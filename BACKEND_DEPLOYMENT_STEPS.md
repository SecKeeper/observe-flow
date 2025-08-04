# 🔧 Backend Deployment Steps - Observe-Flow

## 📋 Prerequisites Check

After installing Node.js, restart your terminal and verify:

```bash
node --version  # Should show v22.18.0 or similar
npm --version   # Should show 10.x.x or similar
```

## 🗄️ Step 1: Database Migration

### 1.1 Open Supabase Dashboard
- Go to: https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw
- Sign in to your Supabase account

### 1.2 Run Migration
1. **Navigate to SQL Editor** (left sidebar)
2. **Copy the migration content** from: `supabase/migrations/20250101000000_complete_backend_functionality.sql`
3. **Paste into SQL Editor**
4. **Click "Run"** to execute

### 1.3 Verify Migration Success
- **Check Table Editor** - you should see these new tables:
  - `profiles` (extended)
  - `alerts` (extended)
  - `alert_shares`
  - `alert_logs`
  - `alert_categories`
  - `user_sessions`
  - `user_activity_log`

- **Check Database → Functions** - you should see:
  - `get_alert_stats`
  - `get_alert_analytics`
  - `assign_alert`
  - `toggle_alert_status`
  - `mark_in_progress`
  - `log_alert_change`

- **Check Database → Triggers** - you should see:
  - `handle_new_user`
  - `handle_updated_at`
  - `handle_alert_log`

## 📦 Step 2: Storage Buckets

### 2.1 Create alert-files Bucket
1. **Go to Storage** (left sidebar)
2. **Click "Create a new bucket"**
3. **Configure**:
   - **Name**: `alert-files`
   - **Public bucket**: ✅ **CHECKED**
   - **File size limit**: `50`
   - **Allowed MIME types**: Leave empty (all types allowed)
4. **Click "Create bucket"**

### 2.2 Create report-exports Bucket
1. **Click "Create a new bucket"** again
2. **Configure**:
   - **Name**: `report-exports`
   - **Public bucket**: ❌ **UNCHECKED** (private)
   - **File size limit**: `100`
   - **Allowed MIME types**: Leave empty
3. **Click "Create bucket"**

### 2.3 Apply Storage Policies
1. **Go to Storage → Policies**
2. **For `alert-files` bucket**:
   - Apply policies from: `supabase/storage/buckets/alert-files/policy.sql`
3. **For `report-exports` bucket**:
   - Apply policies from: `supabase/storage/buckets/report-exports/policy.sql`

## ⚡ Step 3: Edge Functions

### 3.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 3.2 Login to Supabase
```bash
supabase login
```
- Follow the browser authentication flow

### 3.3 Link to Project
```bash
supabase link --project-ref xvjghqiuhpdlxdzkdzdw
```

### 3.4 Deploy Functions
```bash
# Deploy export-alerts function
supabase functions deploy export-alerts

# Deploy share-alert function
supabase functions deploy share-alert
```

### 3.5 Verify Edge Functions
1. **Go to Edge Functions** in Supabase Dashboard
2. **Verify both functions are deployed**:
   - `export-alerts` - Status: Active
   - `share-alert` - Status: Active

## 🔐 Step 4: Security Configuration

### 4.1 Row Level Security (RLS)
- **Verify RLS is enabled** on all tables
- **Check policies are applied** correctly

### 4.2 API Settings
1. **Go to Settings → API**
2. **Note your credentials**:
   - **Project URL**: `https://xvjghqiuhpdlxdzkdzdw.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ✅ Step 5: Verification

### 5.1 Browser Verification
1. **Open**: `verify-backend.html` in your browser
2. **Click**: "Run All Tests"
3. **Verify**: 80%+ success rate

### 5.2 Manual API Test
```bash
# Test database connection
curl -X GET "https://xvjghqiuhpdlxdzkdzdw.supabase.co/rest/v1/alerts" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 🎯 Success Criteria

✅ **Database Migration**: All tables created successfully
✅ **Storage Buckets**: Both buckets created with correct permissions
✅ **Edge Functions**: Both functions deployed and active
✅ **RLS Policies**: Security policies applied correctly
✅ **API Access**: Endpoints responding correctly
✅ **Verification**: 80%+ test success rate

## 📞 Troubleshooting

### Common Issues:

1. **Migration Fails**:
   - Check SQL syntax
   - Ensure you have proper permissions
   - Try running in smaller chunks

2. **Storage Bucket Creation Fails**:
   - Check bucket name uniqueness
   - Verify file size limits are reasonable

3. **Edge Function Deployment Fails**:
   - Check Supabase CLI installation
   - Verify login status
   - Check function code syntax

4. **Verification Tests Fail**:
   - Check RLS policies
   - Verify table structure
   - Check API credentials

## 🚀 Next Steps

After backend deployment is complete:
1. **Proceed to Frontend Deployment**
2. **Configure Environment Variables**
3. **Run Full Verification Suite**
4. **Test Production Features**

---

**Backend deployment should take approximately 15-30 minutes to complete.** 