import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'create') {
      return await handleCreateShare(req, supabaseClient, user)
    } else if (action === 'revoke') {
      return await handleRevokeShare(req, supabaseClient, user)
    } else if (action === 'list') {
      return await handleListShares(req, supabaseClient, user)
    } else if (action === 'access') {
      return await handleAccessShare(req, supabaseClient)
    } else {
      throw new Error('Invalid action')
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleCreateShare(req: Request, supabaseClient: any, user: any) {
  const body = await req.json()
  const { alert_id, shared_with_email, access_type, expires_in_hours } = body

  // Validate input
  if (!alert_id || !shared_with_email || !access_type) {
    throw new Error('Missing required fields')
  }

  if (!['read-only', 'edit'].includes(access_type)) {
    throw new Error('Invalid access type')
  }

  // Check if user has permission to share this alert
  const { data: alert, error: alertError } = await supabaseClient
    .from('alerts')
    .select('created_by')
    .eq('id', alert_id)
    .single()

  if (alertError || !alert) {
    throw new Error('Alert not found')
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // Only alert creator or admin can share
  if (alert.created_by !== user.id && profile.role !== 'admin') {
    throw new Error('Insufficient permissions to share this alert')
  }

  // Generate unique share link
  const shareToken = await generateShareToken()
  const expiresAt = expires_in_hours 
    ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
    : null

  // Create share record
  const { data: share, error: shareError } = await supabaseClient
    .from('alert_shares')
    .insert({
      alert_id,
      shared_with_email,
      access_type,
      shared_by: user.id,
      shared_link: shareToken,
      expires_at: expiresAt
    })
    .select()
    .single()

  if (shareError) {
    throw shareError
  }

  // Log the share activity
  await supabaseClient
    .from('user_activity_log')
    .insert({
      user_id: user.id,
      activity_type: 'share_alert',
      details: `Shared alert ${alert_id} with ${shared_with_email}`,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

  return new Response(
    JSON.stringify({ 
      success: true, 
      share,
      share_url: `${Deno.env.get('FRONTEND_URL')}/shared-alert/${shareToken}`
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleRevokeShare(req: Request, supabaseClient: any, user: any) {
  const body = await req.json()
  const { share_id } = body

  if (!share_id) {
    throw new Error('Share ID is required')
  }

  // Get share record
  const { data: share, error: shareError } = await supabaseClient
    .from('alert_shares')
    .select('*')
    .eq('id', share_id)
    .single()

  if (shareError || !share) {
    throw new Error('Share not found')
  }

  // Check permissions
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  if (share.shared_by !== user.id && profile.role !== 'admin') {
    throw new Error('Insufficient permissions to revoke this share')
  }

  // Revoke share
  const { error: revokeError } = await supabaseClient
    .from('alert_shares')
    .update({ is_active: false })
    .eq('id', share_id)

  if (revokeError) {
    throw revokeError
  }

  // Log the revoke activity
  await supabaseClient
    .from('user_activity_log')
    .insert({
      user_id: user.id,
      activity_type: 'revoke_share',
      details: `Revoked share ${share_id} for alert ${share.alert_id}`,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    })

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleListShares(req: Request, supabaseClient: any, user: any) {
  const { searchParams } = new URL(req.url)
  const alert_id = searchParams.get('alert_id')

  let query = supabaseClient
    .from('alert_shares')
    .select('*')
    .eq('is_active', true)

  if (alert_id) {
    query = query.eq('alert_id', alert_id)
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // If not admin, only show shares created by user
  if (profile.role !== 'admin') {
    query = query.eq('shared_by', user.id)
  }

  const { data: shares, error } = await query

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({ shares }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleAccessShare(req: Request, supabaseClient: any) {
  const { searchParams } = new URL(req.url)
  const share_token = searchParams.get('token')

  if (!share_token) {
    throw new Error('Share token is required')
  }

  // Get share record
  const { data: share, error: shareError } = await supabaseClient
    .from('alert_shares')
    .select('*')
    .eq('shared_link', share_token)
    .eq('is_active', true)
    .single()

  if (shareError || !share) {
    throw new Error('Invalid or expired share link')
  }

  // Check if share has expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error('Share link has expired')
  }

  // Get alert details
  const { data: alert, error: alertError } = await supabaseClient
    .from('alerts')
    .select(`
      *,
      created_by_profile:profiles!alerts_created_by_fkey(username, email),
      assigned_to_profile:profiles!alerts_assigned_to_fkey(username, email)
    `)
    .eq('id', share.alert_id)
    .single()

  if (alertError || !alert) {
    throw new Error('Alert not found')
  }

  return new Response(
    JSON.stringify({ 
      alert,
      share,
      access_type: share.access_type
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function generateShareToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
} 