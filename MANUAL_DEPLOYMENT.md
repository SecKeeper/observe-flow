# Manual Backend Deployment Guide

## Prerequisites
1. Supabase CLI installed
2. Access to your Supabase project dashboard
3. Your Supabase project credentials

## Step 1: Install Supabase CLI

### Option 1: Using winget (Windows)
```powershell
winget install Supabase.CLI
```

### Option 2: Using npm
```bash
npm install -g supabase
```

### Option 3: Manual download
Download from: https://supabase.com/docs/guides/cli

## Step 2: Login to Supabase
```bash
supabase login
```

## Step 3: Link Your Project
```bash
supabase link --project-ref xvjghqiuhpdlxdzkdzdw
```

## Step 4: Deploy Database Migration
```bash
supabase db push
```

This will apply the comprehensive migration file `20250101000000_complete_backend_functionality.sql` which includes:
- Enhanced profiles table with additional fields
- User sessions tracking
- Enhanced alerts with priority, due dates, categories
- Alert categories table
- Alert sharing functionality
- Comprehensive audit logging
- Analytics views
- Database functions and triggers
- Performance indexes
- RLS policies

## Step 5: Deploy Edge Functions
```bash
supabase functions deploy export-alerts
supabase functions deploy share-alert
```

## Step 6: Create Storage Buckets (Manual)

### Via Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw/storage/buckets
2. Create bucket: `alert-files`
   - Public bucket: No
   - File size limit: 50MB
   - Allowed MIME types: image/*, application/pdf, text/*
3. Create bucket: `report-exports`
   - Public bucket: No
   - File size limit: 10MB
   - Allowed MIME types: application/csv, application/json

### Apply Storage Policies:
The storage policies are already included in the migration file and will be applied automatically.

## Step 7: Verify Deployment

### Check Database Tables:
1. Go to https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw/editor
2. Verify these tables exist:
   - `profiles` (enhanced)
   - `alerts` (enhanced)
   - `alert_categories`
   - `alert_logs`
   - `alert_shares`
   - `user_sessions`

### Check Functions:
1. Go to https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw/editor
2. Verify these functions exist:
   - `assign_alert`
   - `toggle_alert_status`
   - `mark_in_progress`
   - `log_alert_change`
   - `get_user_alerts`
   - `get_alert_stats`

### Check Edge Functions:
1. Go to https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw/functions
2. Verify these functions are deployed:
   - `export-alerts`
   - `share-alert`

## Step 8: Test Functionality

### Using the Service Classes:
The backend services are ready to use in your frontend. You can test them using the classes in `src/lib/backend-services.ts`:

```typescript
import { AlertService, AlertShareService, ExportService } from '@/lib/backend-services'

// Test alert operations
const alerts = await AlertService.getAlerts()
const stats = await AlertService.getAlertStats()

// Test sharing
const share = await AlertShareService.createShare({
  alert_id: 'your-alert-id',
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  access_type: 'read-only'
})

// Test export
const csvData = await ExportService.exportAlerts('csv', { severity: 'high' })
```

## Current Configuration

Your Supabase project is already configured with:
- **URL**: https://xvjghqiuhpdlxdzkdzdw.supabase.co
- **Project ID**: xvjghqiuhpdlxdzkdzdw
- **Public Key**: Already in `src/integrations/supabase/client.ts`

## Troubleshooting

### If CLI installation fails:
1. Try restarting your terminal
2. Check if the installation path is in your system PATH
3. Try the manual download option

### If deployment fails:
1. Check your Supabase credentials
2. Ensure you're logged in: `supabase login`
3. Verify project linking: `supabase link --project-ref xvjghqiuhpdlxdzkdzdw`

### If functions fail to deploy:
1. Check your Supabase plan (Edge Functions require Pro plan or higher)
2. Verify the function code in `supabase/functions/`

## Next Steps After Deployment

1. Start your development server: `npm run dev`
2. Test the new backend functionality
3. Create some test data to verify everything works
4. Update your frontend components to use the new service classes 