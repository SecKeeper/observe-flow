# Backend Functionality Documentation

## Overview

This document outlines all the backend functionality that has been implemented for the Observe-Flow project. The backend is built on Supabase and includes comprehensive user management, alert systems, sharing capabilities, analytics, and more.

## 🗄️ Database Schema

### Core Tables

#### 1. **profiles** - User Management
```sql
- id (UUID, Primary Key)
- user_id (UUID, FK to auth.users)
- username (TEXT)
- email (TEXT)
- role (TEXT: 'admin', 'editor', 'read-only')
- avatar_url (TEXT)
- bio (TEXT)
- phone (TEXT)
- department (TEXT)
- last_login (TIMESTAMP)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Features:**
- Auto-created on user signup via trigger
- Role-based access control
- Enhanced profile fields
- RLS enabled with proper policies

#### 2. **alerts** - Alert Management
```sql
- id (UUID, Primary Key)
- dashboard_id (UUID, FK to dashboards)
- rule_name (TEXT)
- short_description (TEXT)
- description (TEXT)
- impact (TEXT)
- mitigation (TEXT)
- false_positive_check (TEXT)
- findings (TEXT)
- severity (TEXT: 'Low', 'Medium', 'High', 'Critical')
- tags (TEXT[])
- file_url (TEXT)
- external_url (TEXT)
- attached_file (TEXT)
- is_active (BOOLEAN)
- assigned_to (UUID, FK to profiles)
- is_in_progress (BOOLEAN)
- created_by (UUID, FK to profiles)
- priority (INTEGER)
- due_date (TIMESTAMP)
- resolved_at (TIMESTAMP)
- resolution_notes (TEXT)
- escalation_level (INTEGER)
- sla_deadline (TIMESTAMP)
- category (TEXT)
- source (TEXT)
- confidence_score (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Features:**
- Comprehensive alert tracking
- Assignment and progress tracking
- File attachments
- Categories and tags
- SLA and escalation support
- Full-text search capabilities

#### 3. **alert_shares** - Alert Sharing
```sql
- id (UUID, Primary Key)
- alert_id (UUID, FK to alerts)
- shared_with_email (TEXT)
- access_type (TEXT: 'read-only', 'edit')
- shared_by (UUID, FK to profiles)
- shared_link (TEXT, Unique)
- is_active (BOOLEAN)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**Features:**
- Secure sharing via unique links
- Access level control
- Expiration support
- Email-based sharing

#### 4. **alert_logs** - Audit Logging
```sql
- id (UUID, Primary Key)
- alert_id (UUID, FK to alerts)
- user_id (UUID, FK to profiles)
- action (TEXT)
- description (TEXT)
- old_values (JSONB)
- new_values (JSONB)
- timestamp (TIMESTAMP)
```

**Features:**
- Complete audit trail
- Change tracking with before/after values
- User action logging

#### 5. **alert_categories** - Alert Categories
```sql
- id (UUID, Primary Key)
- name (TEXT, Unique)
- description (TEXT)
- color (TEXT)
- icon (TEXT)
- created_at (TIMESTAMP)
```

**Features:**
- Predefined categories (Security, Performance, Compliance, etc.)
- Color and icon support
- Customizable categories

### Supporting Tables

#### 6. **dashboards** - Dashboard Management
```sql
- id (UUID, Primary Key)
- name (TEXT)
- description (TEXT)
- owner_id (UUID, FK to profiles)
- is_public (BOOLEAN)
- alert_count (INTEGER)
- active_alert_count (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 7. **user_sessions** - Session Tracking
```sql
- id (UUID, Primary Key)
- user_id (UUID, FK to profiles)
- session_token (TEXT, Unique)
- ip_address (INET)
- user_agent (TEXT)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### 8. **user_activity_log** - Activity Logging
```sql
- id (UUID, Primary Key)
- user_id (UUID, FK to profiles)
- activity_type (TEXT)
- details (TEXT)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

## 🔐 Security & Access Control

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

#### Profiles Policies
- Users can view and update their own profile
- Admins can view all profiles
- Users can only insert their own profile

#### Alerts Policies
- Users can view all alerts
- Users can create alerts
- Users can update their own alerts or if they are admin/editor
- Assigned users can update progress fields
- Users can delete their own alerts or if they are admin

#### Alert Shares Policies
- Users can view shares they created or are shared with
- Alert creators and admins can manage shares

#### Alert Logs Policies
- Users can view logs for alerts they have access to

### Role-Based Access Control

**Roles:**
- **admin**: Full access to all features
- **editor**: Can create, edit, and manage alerts
- **read-only**: Can only view alerts

## 🚀 Backend Functions

### Database Functions

#### 1. **assign_alert(alert_id, user_id)**
- Assigns alert to specific user
- Admin-only function
- Logs the assignment

#### 2. **toggle_alert_status(alert_id)**
- Toggles alert active/inactive status
- Permission-based access
- Logs the change

#### 3. **mark_in_progress(alert_id)**
- Marks alert as in progress
- Only assigned users can call
- Logs the change

#### 4. **log_alert_change(alert_id, action, description)**
- Logs custom alert actions
- Used for audit trail

#### 5. **get_user_alerts(user_uuid)**
- Returns user's accessible alerts
- Respects role-based permissions

#### 6. **get_alert_stats()**
- Returns comprehensive alert statistics
- Used for dashboard analytics

### Triggers

#### 1. **alert_logs_enhanced_trigger**
- Automatically logs all alert changes
- Captures before/after values
- Tracks user actions

#### 2. **update_dashboard_counts_trigger**
- Updates dashboard alert counts
- Maintains real-time statistics

#### 3. **alerts_search_vector_trigger**
- Updates full-text search vector
- Enables search functionality

## 📊 Analytics & Views

### Database Views

#### 1. **alert_analytics**
```sql
- total_alerts
- active_alerts
- inactive_alerts
- unassigned_alerts
- in_progress_alerts
- critical_alerts
- high_alerts
- medium_alerts
- low_alerts
- avg_age_hours
```

#### 2. **user_alert_stats**
```sql
- user_id, username, email, role
- total_alerts_created
- active_alerts_created
- assigned_alerts
- in_progress_assigned
- avg_alert_age_hours
```

## 🗂️ Storage Buckets

### 1. **alert-files**
- **Purpose**: Store alert attachments
- **Permissions**: Uploader and admin access
- **Features**: Signed URLs for secure access

### 2. **report-exports**
- **Purpose**: Store exported reports (CSV, PDF)
- **Permissions**: Admin-only access
- **Features**: Secure report storage

## 🔧 Edge Functions

### 1. **export-alerts**
**Endpoint**: `/api/export-alerts`
**Features:**
- Export alerts as CSV or JSON
- Filtered exports
- Permission-based access
- Activity logging

**Usage:**
```javascript
// Export all alerts as CSV
await ExportService.exportAlerts('csv')

// Export filtered alerts as JSON
await ExportService.exportAlerts('json', {
  severity: ['Critical', 'High'],
  is_active: true
})
```

### 2. **share-alert**
**Endpoint**: `/api/share-alert`
**Actions:**
- `create`: Create new share
- `revoke`: Revoke existing share
- `list`: List shares
- `access`: Access shared alert

**Usage:**
```javascript
// Create share
await AlertShareService.createShare({
  alert_id: 'uuid',
  shared_with_email: 'user@example.com',
  access_type: 'read-only',
  expires_in_hours: 24
})

// Access shared alert
const sharedData = await AlertShareService.accessSharedAlert('share-token')
```

## 📈 Performance Optimizations

### Indexes
- `idx_alerts_assigned_to`
- `idx_alerts_severity`
- `idx_alerts_created_at`
- `idx_alerts_is_active`
- `idx_alerts_is_in_progress`
- `idx_alerts_tags` (GIN index)
- `idx_alerts_created_by`
- `idx_alerts_dashboard_id`
- `idx_alerts_category`
- `idx_alerts_source`
- `idx_alert_logs_alert_id`
- `idx_alert_logs_user_id`
- `idx_alert_logs_timestamp`
- `idx_alert_logs_action`
- `idx_alert_shares_alert_id`
- `idx_alert_shares_shared_with_email`
- `idx_alert_shares_shared_link`

## 🔄 Frontend Integration

### Service Classes

The backend functionality is exposed through service classes in `src/lib/backend-services.ts`:

#### AlertService
- `getAlerts()` - Get alerts with filters
- `getAlert()` - Get single alert
- `createAlert()` - Create new alert
- `updateAlert()` - Update alert
- `deleteAlert()` - Delete alert
- `assignAlert()` - Assign alert to user
- `toggleAlertStatus()` - Toggle status
- `markInProgress()` - Mark in progress
- `getUserAlerts()` - Get user's alerts
- `getAlertStats()` - Get statistics
- `getAlertAnalytics()` - Get analytics
- `getUserAlertStats()` - Get user stats

#### AlertShareService
- `createShare()` - Create share
- `revokeShare()` - Revoke share
- `listShares()` - List shares
- `accessSharedAlert()` - Access shared alert

#### ExportService
- `exportAlerts()` - Export alerts

#### StorageService
- `uploadAlertFile()` - Upload file
- `getSignedUrl()` - Get signed URL
- `deleteFile()` - Delete file

#### AuditLogService
- `getAlertLogs()` - Get alert logs
- `logAction()` - Log custom action

#### CategoryService
- `getCategories()` - Get categories
- `createCategory()` - Create category
- `updateCategory()` - Update category
- `deleteCategory()` - Delete category

#### UserActivityService
- `getUserActivity()` - Get activity logs
- `logActivity()` - Log activity

#### DashboardService
- `getUserDashboards()` - Get dashboards
- `createDashboard()` - Create dashboard
- `updateDashboard()` - Update dashboard
- `deleteDashboard()` - Delete dashboard

## 🚀 Deployment

### Prerequisites
1. Supabase project set up
2. Database migrations applied
3. Storage buckets created
4. Edge functions deployed

### Migration Steps
1. Run the comprehensive migration: `supabase/migrations/20250101000000_complete_backend_functionality.sql`
2. Create storage buckets: `alert-files` and `report-exports`
3. Deploy edge functions
4. Update environment variables

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=your_frontend_url
```

## 🔍 Monitoring & Maintenance

### Audit Trail
- All alert changes are logged
- User activities are tracked
- IP addresses and user agents recorded

### Performance Monitoring
- Database indexes for optimal queries
- Efficient RLS policies
- Optimized views for analytics

### Security Features
- Row-level security on all tables
- Role-based access control
- Secure file storage with signed URLs
- Audit logging for compliance

## 📋 API Reference

### REST Endpoints

#### Alerts
- `GET /api/alerts` - Get alerts with filters
- `GET /api/alerts/:id` - Get single alert
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

#### Analytics
- `GET /api/analytics` - Get alert analytics
- `GET /api/user-stats` - Get user statistics

#### Sharing
- `POST /api/share-alert?action=create` - Create share
- `POST /api/share-alert?action=revoke` - Revoke share
- `GET /api/share-alert?action=list` - List shares
- `GET /api/share-alert?action=access&token=:token` - Access shared alert

#### Export
- `GET /api/export-alerts?format=csv&filters=:filters` - Export alerts

### Database Functions
- `assign_alert(alert_id, user_id)` - Assign alert
- `toggle_alert_status(alert_id)` - Toggle status
- `mark_in_progress(alert_id)` - Mark in progress
- `get_user_alerts(user_uuid)` - Get user alerts
- `get_alert_stats()` - Get statistics

## 🎯 Use Cases

### 1. Alert Management
- Create, update, and delete alerts
- Assign alerts to team members
- Track progress and resolution
- File attachments and external links

### 2. Team Collaboration
- Share alerts with external users
- Role-based access control
- Activity tracking and audit logs

### 3. Analytics & Reporting
- Real-time dashboard statistics
- User performance metrics
- Export capabilities (CSV/JSON)
- Historical data analysis

### 4. Security & Compliance
- Complete audit trail
- Role-based permissions
- Secure file storage
- Activity monitoring

This comprehensive backend provides a robust foundation for the Observe-Flow monitoring platform with enterprise-grade features for security, collaboration, and analytics. 