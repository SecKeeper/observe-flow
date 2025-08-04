# 🎨 Frontend Integration Guide

## Overview
This guide explains how to integrate the comprehensive backend services with your React frontend application.

## 📁 Service Classes Overview

### Available Services
- **AlertService** - Core alert management
- **AlertShareService** - Alert sharing functionality
- **ExportService** - Data export capabilities
- **StorageService** - File upload/download
- **AuditLogService** - Audit trail management
- **CategoryService** - Alert categories
- **UserActivityService** - User activity tracking
- **DashboardService** - Dashboard management

## 🔧 Integration Steps

### 1. Import Service Classes
```typescript
import { 
  AlertService, 
  AlertShareService, 
  ExportService, 
  StorageService,
  AuditLogService,
  CategoryService,
  UserActivityService,
  DashboardService
} from '@/lib/backend-services'
```

### 2. Update Existing Components

#### Dashboard Component
```typescript
// src/pages/Dashboard.tsx
import { AlertService, DashboardService } from '@/lib/backend-services'

const Dashboard = () => {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load alerts
        const alertsData = await AlertService.getAlerts()
        setAlerts(alertsData)

        // Load statistics
        const statsData = await AlertService.getAlertStats()
        setStats(statsData)

        // Load analytics
        const analyticsData = await AlertService.getAlertAnalytics()
        setAnalytics(analyticsData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadDashboardData()
  }, [])

  // ... rest of component
}
```

#### Alert Form Component
```typescript
// src/pages/AlertForm.tsx
import { AlertService, CategoryService, StorageService } from '@/lib/backend-services'

const AlertForm = () => {
  const [categories, setCategories] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      const categoriesData = await CategoryService.getCategories()
      setCategories(categoriesData)
    }
    loadCategories()
  }, [])

  const handleFileUpload = async (file) => {
    setUploading(true)
    try {
      const fileUrl = await StorageService.uploadAlertFile(file)
      // Update form with file URL
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      await AlertService.createAlert(formData)
      // Handle success
    } catch (error) {
      console.error('Alert creation failed:', error)
    }
  }

  // ... rest of component
}
```

#### Alert Detail Component
```typescript
// src/pages/AlertDetail.tsx
import { AlertService, AlertShareService, AuditLogService } from '@/lib/backend-services'

const AlertDetail = ({ alertId }) => {
  const [alert, setAlert] = useState(null)
  const [logs, setLogs] = useState([])
  const [shares, setShares] = useState([])

  useEffect(() => {
    const loadAlertData = async () => {
      try {
        // Load alert details
        const alertData = await AlertService.getAlert(alertId)
        setAlert(alertData)

        // Load audit logs
        const logsData = await AuditLogService.getAlertLogs(alertId)
        setLogs(logsData)

        // Load shares
        const sharesData = await AlertShareService.listShares(alertId)
        setShares(sharesData)
      } catch (error) {
        console.error('Error loading alert data:', error)
      }
    }

    loadAlertData()
  }, [alertId])

  const handleShare = async (shareData) => {
    try {
      await AlertShareService.createShare({
        alert_id: alertId,
        ...shareData
      })
      // Refresh shares list
    } catch (error) {
      console.error('Share creation failed:', error)
    }
  }

  const handleExport = async (format) => {
    try {
      const data = await ExportService.exportAlerts(format, { id: alertId })
      // Handle download
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // ... rest of component
}
```

### 3. Create New Components

#### Alert Sharing Modal
```typescript
// src/components/AlertSharingModal.tsx
import { AlertShareService } from '@/lib/backend-services'

const AlertSharingModal = ({ alertId, onClose }) => {
  const [shareData, setShareData] = useState({
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    access_type: 'read-only'
  })

  const handleCreateShare = async () => {
    try {
      const share = await AlertShareService.createShare({
        alert_id: alertId,
        ...shareData
      })
      
      // Show share link to user
      alert(`Share link: ${share.share_link}`)
      onClose()
    } catch (error) {
      console.error('Share creation failed:', error)
    }
  }

  return (
    <div className="modal">
      <h3>Share Alert</h3>
      <input
        type="datetime-local"
        value={shareData.expires_at.toISOString().slice(0, 16)}
        onChange={(e) => setShareData({
          ...shareData,
          expires_at: new Date(e.target.value)
        })}
      />
      <select
        value={shareData.access_type}
        onChange={(e) => setShareData({
          ...shareData,
          access_type: e.target.value
        })}
      >
        <option value="read-only">Read Only</option>
        <option value="edit">Edit</option>
      </select>
      <button onClick={handleCreateShare}>Create Share</button>
    </div>
  )
}
```

#### Export Controls
```typescript
// src/components/ExportControls.tsx
import { ExportService } from '@/lib/backend-services'

const ExportControls = ({ filters }) => {
  const handleExport = async (format) => {
    try {
      const data = await ExportService.exportAlerts(format, filters)
      
      // Create download link
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alerts-export.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="export-controls">
      <button onClick={() => handleExport('csv')}>Export CSV</button>
      <button onClick={() => handleExport('json')}>Export JSON</button>
    </div>
  )
}
```

#### File Upload Component
```typescript
// src/components/FileUpload.tsx
import { StorageService } from '@/lib/backend-services'

const FileUpload = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const fileUrl = await StorageService.uploadAlertFile(file)
      onUploadComplete(fileUrl)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,text/*"
        disabled={uploading}
      />
      {uploading && <span>Uploading...</span>}
    </div>
  )
}
```

### 4. Update Context Providers

#### Auth Context Enhancement
```typescript
// src/contexts/AuthContext.tsx
import { UserActivityService } from '@/lib/backend-services'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        if (session?.user) {
          // Log user activity
          await UserActivityService.logActivity({
            action: 'login',
            description: 'User logged in'
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ... rest of context
}
```

### 5. Add Role-Based Access Control

#### Protected Route Enhancement
```typescript
// src/components/ProtectedRoute.tsx
import { AlertService } from '@/lib/backend-services'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await AlertService.getUserProfile(user.id)
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      }
    }

    loadUserProfile()
  }, [user])

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole && userProfile?.role !== requiredRole) {
    return <div>Access denied. Required role: {requiredRole}</div>
  }

  return children
}
```

## 🎯 Usage Examples

### Basic Alert Operations
```typescript
// Get all alerts
const alerts = await AlertService.getAlerts()

// Get alerts with filters
const highPriorityAlerts = await AlertService.getAlerts({
  severity: 'high',
  is_active: true
})

// Create new alert
const newAlert = await AlertService.createAlert({
  rule_name: 'Security Breach Detected',
  description: 'Unauthorized access attempt',
  severity: 'high',
  category: 'security'
})

// Update alert
await AlertService.updateAlert(alertId, {
  is_in_progress: true,
  assigned_to: userId
})

// Assign alert (admin only)
await AlertService.assignAlert(alertId, userId)

// Toggle alert status
await AlertService.toggleAlertStatus(alertId)
```

### Sharing and Export
```typescript
// Create share link
const share = await AlertShareService.createShare({
  alert_id: alertId,
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  access_type: 'read-only'
})

// Export alerts
const csvData = await ExportService.exportAlerts('csv', {
  severity: 'high',
  created_at: '2024-01-01'
})
```

### File Management
```typescript
// Upload file
const fileUrl = await StorageService.uploadAlertFile(file)

// Get signed URL for download
const downloadUrl = await StorageService.getSignedUrl(filePath)

// Delete file
await StorageService.deleteFile(filePath)
```

### Analytics and Reporting
```typescript
// Get alert statistics
const stats = await AlertService.getAlertStats()

// Get user-specific alerts
const userAlerts = await AlertService.getUserAlerts(userId)

// Get analytics data
const analytics = await AlertService.getAlertAnalytics()

// Get user activity
const activity = await UserActivityService.getUserActivity(userId)
```

## 🔒 Security Considerations

### RLS Policies
- All database operations respect Row Level Security
- Users can only access data they're authorized to see
- Role-based permissions are enforced at the database level

### Authentication
- All service calls require valid authentication
- JWT tokens are automatically handled by Supabase client
- Session management is handled by Supabase Auth

### File Security
- File uploads are restricted by MIME type and size
- Storage buckets have proper RLS policies
- Signed URLs expire automatically

## 🧪 Testing Integration

### Unit Tests
```typescript
// Example test for AlertService
import { AlertService } from '@/lib/backend-services'

describe('AlertService', () => {
  it('should create an alert', async () => {
    const alertData = {
      rule_name: 'Test Alert',
      description: 'Test Description',
      severity: 'medium'
    }

    const result = await AlertService.createAlert(alertData)
    expect(result).toBeDefined()
    expect(result.rule_name).toBe(alertData.rule_name)
  })
})
```

### Integration Tests
```typescript
// Test complete workflow
describe('Alert Workflow', () => {
  it('should handle complete alert lifecycle', async () => {
    // Create alert
    const alert = await AlertService.createAlert(alertData)
    
    // Assign alert
    await AlertService.assignAlert(alert.id, userId)
    
    // Mark in progress
    await AlertService.markInProgress(alert.id)
    
    // Create share
    const share = await AlertShareService.createShare({
      alert_id: alert.id,
      access_type: 'read-only'
    })
    
    // Export
    const exportData = await ExportService.exportAlerts('csv', {
      id: alert.id
    })
    
    expect(exportData).toBeDefined()
  })
})
```

## 📊 Performance Optimization

### Caching
```typescript
// Use React Query for caching
import { useQuery, useMutation } from '@tanstack/react-query'

const useAlerts = (filters) => {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => AlertService.getAlerts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Pagination
```typescript
// Implement pagination for large datasets
const alerts = await AlertService.getAlerts({
  page: 1,
  limit: 20,
  ...filters
})
```

## 🚀 Next Steps

1. **Update existing components** to use the new service classes
2. **Add new components** for sharing, export, and file management
3. **Implement role-based UI** based on user permissions
4. **Add error handling** and loading states
5. **Test all functionality** with the verification tool
6. **Deploy and monitor** the integrated application

## 📚 Additional Resources

- [Backend Services Documentation](./BACKEND_FUNCTIONALITY.md)
- [Deployment Guide](./MANUAL_DEPLOYMENT.md)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest) 