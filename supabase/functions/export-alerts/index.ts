import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Only allow admins and editors to export
    if (!['admin', 'editor'].includes(profile.role)) {
      throw new Error('Insufficient permissions')
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const filters = searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : {}

    // Build query based on filters
    let query = supabaseClient
      .from('alerts')
      .select(`
        *,
        created_by_profile:profiles!alerts_created_by_fkey(username, email),
        assigned_to_profile:profiles!alerts_assigned_to_fkey(username, email)
      `)

    // Apply filters
    if (filters.severity) {
      query = query.in('severity', filters.severity)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.is_in_progress !== undefined) {
      query = query.eq('is_in_progress', filters.is_in_progress)
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data: alerts, error } = await query

    if (error) {
      throw error
    }

    let content: string
    let contentType: string
    let filename: string

    if (format === 'csv') {
      content = generateCSV(alerts)
      contentType = 'text/csv'
      filename = `alerts_export_${new Date().toISOString().split('T')[0]}.csv`
    } else if (format === 'json') {
      content = JSON.stringify(alerts, null, 2)
      contentType = 'application/json'
      filename = `alerts_export_${new Date().toISOString().split('T')[0]}.json`
    } else {
      throw new Error('Unsupported format')
    }

    // Log the export activity
    await supabaseClient
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'export_alerts',
        details: `Exported ${alerts.length} alerts in ${format} format`,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

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

function generateCSV(alerts: any[]): string {
  const headers = [
    'ID',
    'Rule Name',
    'Short Description',
    'Description',
    'Severity',
    'Status',
    'In Progress',
    'Created By',
    'Assigned To',
    'Created At',
    'Updated At',
    'Tags',
    'Category',
    'Source'
  ]

  const rows = alerts.map(alert => [
    alert.id,
    `"${alert.rule_name?.replace(/"/g, '""') || ''}"`,
    `"${alert.short_description?.replace(/"/g, '""') || ''}"`,
    `"${alert.description?.replace(/"/g, '""') || ''}"`,
    alert.severity,
    alert.is_active ? 'Active' : 'Inactive',
    alert.is_in_progress ? 'Yes' : 'No',
    alert.created_by_profile?.username || alert.created_by_profile?.email || '',
    alert.assigned_to_profile?.username || alert.assigned_to_profile?.email || '',
    alert.created_at,
    alert.updated_at,
    `"${(alert.tags || []).join(', ')}"`,
    alert.category || '',
    alert.source || ''
  ])

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
} 