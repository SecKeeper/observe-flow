# 🚀 Production Deployment Guide - Observe-Flow

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Supabase account with project created
- ✅ Node.js installed (for frontend deployment)
- ✅ Git repository set up (for frontend deployment)

## 🔧 Step 1: Backend Deployment (Supabase)

### 1.1 Deploy Database Migration

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw
   - Navigate to **SQL Editor**

2. **Run the Complete Migration**
   - Copy the entire content from `supabase/migrations/20250101000000_complete_backend_functionality.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify Migration Success**
   - Check **Table Editor** - you should see all new tables
   - Check **Database** → **Functions** - you should see new functions
   - Check **Database** → **Triggers** - you should see new triggers

### 1.2 Create Storage Buckets

1. **Navigate to Storage**
   - Go to **Storage** in the left sidebar
   - Click **Create a new bucket**

2. **Create `alert-files` Bucket**
   - **Name**: `alert-files`
   - **Public bucket**: ✅ Checked
   - **File size limit**: 50MB
   - Click **Create bucket**

3. **Create `report-exports` Bucket**
   - **Name**: `report-exports`
   - **Public bucket**: ❌ Unchecked (admin only)
   - **File size limit**: 100MB
   - Click **Create bucket**

4. **Apply Storage Policies**
   - Go to **Storage** → **Policies**
   - For each bucket, apply the policies from:
     - `supabase/storage/buckets/alert-files/policy.sql`
     - `supabase/storage/buckets/report-exports/policy.sql`

### 1.3 Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref xvjghqiuhpdlxdzkdzdw
   ```

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy export-alerts
   supabase functions deploy share-alert
   ```

5. **Verify Edge Functions**
   - Go to **Edge Functions** in Supabase Dashboard
   - Verify both functions are deployed and active

## 🌐 Step 2: Frontend Deployment

### Option A: Deploy to Vercel (Recommended)

1. **Prepare for Deployment**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click **New Project**
   - Import your GitHub repository
   - Configure build settings:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click **Deploy**

3. **Configure Environment Variables**
   - In Vercel dashboard, go to **Settings** → **Environment Variables**
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=https://xvjghqiuhpdlxdzkdzdw.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2amdocWl1aHBkbHhkemtkemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzQ2MTEsImV4cCI6MjA2OTU1MDYxMX0.oUa5YgNntn-2sRTixT8upgmUNcGcjTiOY_ubFtd4KIM
     ```

### Option B: Deploy to Netlify

1. **Build the Project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to https://netlify.com
   - Sign up/Login with GitHub
   - Click **New site from Git**
   - Connect your repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Click **Deploy site**

3. **Configure Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Add the same variables as above

## ⚙️ Step 3: Production Environment Setup

### 3.1 Supabase Project Settings

1. **Authentication Settings**
   - Go to **Authentication** → **Settings**
   - Configure **Site URL** to your deployed frontend URL
   - Add your domain to **Redirect URLs**:
     ```
     https://your-app.vercel.app/**
     https://your-app.netlify.app/**
     ```

2. **Row Level Security (RLS)**
   - Verify RLS is enabled on all tables
   - Check that policies are properly applied

3. **API Settings**
   - Go to **Settings** → **API**
   - Note your **Project URL** and **anon public** key
   - Ensure these match your environment variables

### 3.2 Storage Configuration

1. **Bucket Permissions**
   - Verify `alert-files` bucket allows authenticated uploads
   - Verify `report-exports` bucket is admin-only
   - Test file upload/download functionality

2. **CORS Settings**
   - Add your frontend domain to CORS origins
   - Allow necessary HTTP methods (GET, POST, PUT, DELETE)

## 🔐 Step 4: Environment Variables Configuration

### 4.1 Frontend Environment Variables

Create `.env.production` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xvjghqiuhpdlxdzkdzdw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2amdocWl1aHBkbHhkemtkemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzQ2MTEsImV4cCI6MjA2OTU1MDYxMX0.oUa5YgNntn-2sRTixT8upgmUNcGcjTiOY_ubFtd4KIM

# Storage Configuration
VITE_ALERT_FILES_BUCKET=alert-files
VITE_REPORT_EXPORTS_BUCKET=report-exports

# Edge Functions
VITE_EXPORT_FUNCTION_URL=https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/export-alerts
VITE_SHARE_FUNCTION_URL=https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert

# Application Settings
VITE_APP_NAME=Observe-Flow
VITE_APP_VERSION=1.0.0
```

### 4.2 Backend Environment Variables (Supabase)

In Supabase Dashboard, go to **Settings** → **Environment variables**:

```env
# Database Configuration
DATABASE_URL=your_database_url
SUPABASE_URL=https://xvjghqiuhpdlxdzkdzdw.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage Configuration
STORAGE_BUCKET_ALERT_FILES=alert-files
STORAGE_BUCKET_REPORT_EXPORTS=report-exports

# Security
JWT_SECRET=your_jwt_secret
```

## 🧪 Step 5: Full Verification Suite

### 5.1 Backend Verification

1. **Open Browser Verification Tool**
   - Open `verify-backend.html` in your browser
   - Click **Run All Tests**
   - Verify 80%+ success rate

2. **Manual API Testing**
   ```bash
   # Test database connection
   curl -X GET "https://xvjghqiuhpdlxdzkdzdw.supabase.co/rest/v1/alerts" \
     -H "apikey: your_anon_key" \
     -H "Authorization: Bearer your_anon_key"

   # Test edge functions
   curl -X POST "https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/export-alerts" \
     -H "Authorization: Bearer your_anon_key" \
     -H "Content-Type: application/json" \
     -d '{"format": "csv"}'
   ```

### 5.2 Frontend Verification

1. **Production URL Testing**
   - Navigate to your deployed frontend URL
   - Test authentication flow
   - Verify all features work in production

2. **Role-based Access Testing**
   - Test with different user roles
   - Verify admin, editor, and read-only permissions
   - Test access denied scenarios

3. **Feature Testing Checklist**
   - ✅ User registration and login
   - ✅ Dashboard with statistics
   - ✅ Alert creation and editing
   - ✅ File upload and download
   - ✅ Alert sharing functionality
   - ✅ Data export (CSV/JSON)
   - ✅ Role-based access control
   - ✅ Mobile responsiveness

### 5.3 Performance Testing

1. **Load Testing**
   - Create multiple test alerts
   - Test filtering with large datasets
   - Verify export performance

2. **File Upload Testing**
   - Test with various file types
   - Test with files up to 50MB
   - Verify upload progress and error handling

## 🎯 Step 6: Production Checklist

### ✅ Backend Verification
- [ ] Database migration deployed successfully
- [ ] All tables created with proper RLS policies
- [ ] Edge functions deployed and accessible
- [ ] Storage buckets created with proper permissions
- [ ] API endpoints responding correctly

### ✅ Frontend Verification
- [ ] Application deployed and accessible
- [ ] Environment variables configured correctly
- [ ] Authentication working in production
- [ ] All features functional
- [ ] Mobile responsiveness verified

### ✅ Security Verification
- [ ] RLS policies enforced
- [ ] Role-based access working
- [ ] File upload security verified
- [ ] Share link security tested
- [ ] Audit logging active

### ✅ Performance Verification
- [ ] Page load times acceptable
- [ ] File upload/download working
- [ ] Export functionality performing well
- [ ] Database queries optimized

## 🚀 Step 7: Go Live

Once all verifications pass:

1. **Update DNS** (if using custom domain)
2. **Configure SSL certificates** (handled by Vercel/Netlify)
3. **Set up monitoring** (optional)
4. **Create admin user accounts**
5. **Document user onboarding process**

## 📞 Support & Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add frontend domain to Supabase CORS settings
   - Verify environment variables are correct

2. **Authentication Issues**
   - Check redirect URLs in Supabase settings
   - Verify JWT configuration

3. **File Upload Failures**
   - Check storage bucket permissions
   - Verify RLS policies on storage objects

4. **Edge Function Errors**
   - Check function logs in Supabase dashboard
   - Verify function deployment status

### Getting Help

- **Supabase Documentation**: https://supabase.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Netlify Documentation**: https://docs.netlify.com

---

**🎉 Congratulations! Your Observe-Flow application is now deployed and ready for production use!**

**Next Steps**:
1. Complete the verification suite
2. Create admin user accounts
3. Onboard your first users
4. Monitor performance and usage 