import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'

// Types for the new functionality
export interface AlertShare {
  id: string
  alert_id: string
  shared_with_email: string
  access_type: 'read-only' | 'edit'
  shared_by: string
  shared_link: string
  is_active: boolean
  expires_at?: string
  created_at: string
}

export interface AlertLog {
  id: string
  alert_id: string
  user_id: string
  action: string
  description?: string
  old_values?: any
  new_values?: any
  timestamp: string
}

export interface AlertCategory {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  created_at: string
}

export interface AlertAnalytics {
  total_alerts: number
  active_alerts: number
  inactive_alerts: number
  unassigned_alerts: number
  in_progress_alerts: number
  critical_alerts: number
  high_alerts: number
  medium_alerts: number
  low_alerts: number
  avg_age_hours: number
}

export interface UserAlertStats {
  user_id: string
  username: string
  email: string
  role: string
  total_alerts_created: number
  active_alerts_created: number
  assigned_alerts: number
  in_progress_assigned: number
  avg_alert_age_hours: number
}

// Alert Management Services
export class AlertService {
  // Get all alerts with filters
  static async getAlerts(filters?: {
    severity?: string[]
    is_active?: boolean
    is_in_progress?: boolean
    assigned_to?: string
    created_by?: string
    category?: string
    search?: string
  }) {
    let query = supabase
      .from('alerts')
      .select(`
        *,
        created_by_profile:profiles!alerts_created_by_fkey(username, email),
        assigned_to_profile:profiles!alerts_assigned_to_fkey(username, email)
      `)

    if (filters?.severity) {
      query = query.in('severity', filters.severity)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.is_in_progress !== undefined) {
      query = query.eq('is_in_progress', filters.is_in_progress)
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
    // Note: category filtering would need to be implemented when category field is added to database
    if (filters?.search) {
      query = query.textSearch('search_vector', filters.search)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data as any[]
  }

  // Get single alert by ID
  static async getAlert(id: string) {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        created_by_profile:profiles!alerts_created_by_fkey(username, email),
        assigned_to_profile:profiles!alerts_assigned_to_fkey(username, email)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as any
  }

  // Create new alert
  static async createAlert(alert: TablesInsert<'alerts'>) {
    const { data, error } = await supabase
      .from('alerts')
      .insert(alert)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update alert
  static async updateAlert(id: string, updates: TablesUpdate<'alerts'>) {
    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete alert
  static async deleteAlert(id: string) {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Assign alert to user (admin only)
  static async assignAlert(alertId: string, userId: string) {
    const { data, error } = await supabase
      .from('alerts')
      .update({ assigned_to: userId })
      .eq('id', alertId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Toggle alert status
  static async toggleAlertStatus(alertId: string) {
    const { data: alert } = await supabase
      .from('alerts')
      .select('is_active')
      .eq('id', alertId)
      .single()

    const { data, error } = await supabase
      .from('alerts')
      .update({ is_active: !alert?.is_active })
      .eq('id', alertId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Mark alert in progress
  static async markInProgress(alertId: string) {
    const { data, error } = await supabase
      .from('alerts')
      .update({ is_in_progress: true })
      .eq('id', alertId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get user's accessible alerts
  static async getUserAlerts(userId?: string) {
    let query = supabase.from('alerts').select('*')
    if (userId) {
      query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  }

  // Get alert statistics
  static async getAlertStats() {
    const { data, error } = await supabase
      .from('alerts')
      .select('severity, is_active, is_in_progress, assigned_to')

    if (error) throw error
    
    const stats = {
      total: data.length,
      active: data.filter(a => a.is_active).length,
      inactive: data.filter(a => !a.is_active).length,
      in_progress: data.filter(a => a.is_in_progress).length,
      unassigned: data.filter(a => !a.assigned_to).length,
      critical: data.filter(a => a.severity === 'Critical').length,
      high: data.filter(a => a.severity === 'High').length,
      medium: data.filter(a => a.severity === 'Medium').length,
      low: data.filter(a => a.severity === 'Low').length
    }
    
    return stats
  }

  // Get alert analytics
  static async getAlertAnalytics(): Promise<AlertAnalytics> {
    const stats = await this.getAlertStats()
    return {
      total_alerts: stats.total,
      active_alerts: stats.active,
      inactive_alerts: stats.inactive,
      unassigned_alerts: stats.unassigned,
      in_progress_alerts: stats.in_progress,
      critical_alerts: stats.critical,
      high_alerts: stats.high,
      medium_alerts: stats.medium,
      low_alerts: stats.low,
      avg_age_hours: 24 // placeholder
    }
  }

  // Get user alert statistics
  static async getUserAlertStats(): Promise<UserAlertStats[]> {
    // Placeholder implementation
    return []
  }

  // Get user profile
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }
}

// Alert Sharing Services
export class AlertShareService {
  // Create share using edge function
  static async createShare(shareData: {
    alert_id: string
    shared_with_email: string
    access_type: 'read-only' | 'edit'
    expires_in_hours?: number
  }) {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch('https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert?action=create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shareData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }

  // Revoke share using edge function
  static async revokeShare(shareId: string) {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch('https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert?action=revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ share_id: shareId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }

  // List shares using edge function
  static async listShares(alertId?: string) {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      throw new Error('Authentication required')
    }

    const url = alertId 
      ? `https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert?action=list&alert_id=${alertId}`
      : 'https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert?action=list'

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }

  // Access shared alert using edge function
  static async accessSharedAlert(shareToken: string) {
    const response = await fetch(`https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert?action=access&token=${shareToken}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    return response.json()
  }
}

// Export Services
export class ExportService {
  // Export alerts using edge function
  static async exportAlerts(format: 'csv' | 'json', filters?: any): Promise<string> {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      throw new Error('Authentication required')
    }

    const url = new URL('https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/export-alerts')
    url.searchParams.set('format', format)
    if (filters) {
      url.searchParams.set('filters', JSON.stringify(filters))
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Export failed')
    }

    return response.text()
  }
}

// Storage Services
export class StorageService {
  // Upload file to alert-files bucket
  static async uploadAlertFile(file: File, alertId: string) {
    const fileName = `${alertId}/${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('alert-files')
      .upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('alert-files')
      .getPublicUrl(fileName)

    return {
      file_url: urlData.publicUrl,
      filename: file.name,
      file_size: file.size,
      content_type: file.type
    }
  }

  // Get signed URL for file
  static async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  }

  // Delete file
  static async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  }
}

// Audit Log Services
export class AuditLogService {
  // Get alert logs
  static async getAlertLogs(alertId: string) {
    const { data, error } = await supabase
      .from('alert_audit_log')
      .select('*')
      .eq('alert_id', alertId)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data
  }

  // Log custom action
  static async logAction(alertId: string, action: string, description?: string) {
    const { data, error } = await supabase
      .from('alert_audit_log')
      .insert({
        alert_id: alertId,
        action,
        changes: { description }
      })

    if (error) throw error
    return data
  }
}

// Category Services
export class CategoryService {
  // Get all categories - mock data for now
  static async getCategories() {
    return [
      { id: '1', name: 'Security', description: 'Security alerts', color: '#ef4444', created_at: new Date().toISOString() },
      { id: '2', name: 'Network', description: 'Network alerts', color: '#3b82f6', created_at: new Date().toISOString() },
      { id: '3', name: 'System', description: 'System alerts', color: '#10b981', created_at: new Date().toISOString() }
    ]
  }

  // Create category - placeholder
  static async createCategory(category: Omit<AlertCategory, 'id' | 'created_at'>) {
    return { id: Date.now().toString(), ...category, created_at: new Date().toISOString() }
  }

  // Update category - placeholder
  static async updateCategory(id: string, updates: Partial<AlertCategory>) {
    return { id, ...updates }
  }

  // Delete category - placeholder
  static async deleteCategory(id: string) {
    // Placeholder
  }
}

// User Activity Services
export class UserActivityService {
  // Get user activity logs
  static async getUserActivity(userId?: string, limit: number = 50) {
    let query = supabase
      .from('user_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Log activity
  static async logActivity(activity: {
    activity_type: string
    details?: string
    ip_address?: string
    user_agent?: string
  }) {
    const { error } = await supabase
      .from('user_activity_log')
      .insert(activity)

    if (error) throw error
  }
}

// Dashboard Services
export class DashboardService {
  // Get user's dashboards
  static async getUserDashboards() {
    const { data, error } = await supabase
      .from('dashboards')
      .select(`
        *,
        owner_profile:profiles!dashboards_owner_id_fkey(username, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Create dashboard
  static async createDashboard(dashboard: {
    name: string
    description?: string
    is_public?: boolean
  }) {
    const { data, error } = await supabase
      .from('dashboards')
      .insert(dashboard)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update dashboard
  static async updateDashboard(id: string, updates: Partial<TablesUpdate<'dashboards'>>) {
    const { data, error } = await supabase
      .from('dashboards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete dashboard
  static async deleteDashboard(id: string) {
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
} 