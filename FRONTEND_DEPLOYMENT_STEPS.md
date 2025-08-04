# 🌐 Frontend Deployment Steps - Observe-Flow

## 📋 Prerequisites

✅ **Node.js installed** (v22.18.0)
✅ **Backend deployed** (follow BACKEND_DEPLOYMENT_STEPS.md)
✅ **GitHub repository** with your code

## 🏗️ Step 1: Local Build Test

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Test Build Locally
```bash
npm run build
```

**Expected Output**: Build should complete successfully with files in `dist/` folder

### 1.3 Test Development Server
```bash
npm run dev
```

**Verify**: Application runs on `http://localhost:5173`

## 🚀 Step 2: Vercel Deployment

### 2.1 Prepare for Deployment
1. **Ensure your code is committed** to GitHub
2. **Verify build works locally** (`npm run build`)

### 2.2 Deploy to Vercel
1. **Go to**: https://vercel.com
2. **Sign up/Login** with GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure project settings**:

   **Framework Preset**: `Vite`
   **Build Command**: `npm run build`
   **Output Directory**: `dist`
   **Install Command**: `npm install`

6. **Click "Deploy"**

### 2.3 Configure Environment Variables
In Vercel dashboard, go to **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://xvjghqiuhpdlxdzkdzdw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2amdocWl1aHBkbHhkemtkemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzQ2MTEsImV4cCI6MjA2OTU1MDYxMX0.oUa5YgNntn-2sRTixT8upgmUNcGcjTiOY_ubFtd4KIM` |
| `VITE_ALERT_FILES_BUCKET` | `alert-files` |
| `VITE_REPORT_EXPORTS_BUCKET` | `report-exports` |
| `VITE_EXPORT_FUNCTION_URL` | `https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/export-alerts` |
| `VITE_SHARE_FUNCTION_URL` | `https://xvjghqiuhpdlxdzkdzdw.supabase.co/functions/v1/share-alert` |

### 2.4 Redeploy with Environment Variables
1. **Go to Deployments tab**
2. **Click "Redeploy"** on latest deployment
3. **Wait for deployment to complete**

## 🔧 Step 3: Supabase Configuration

### 3.1 Authentication Settings
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw
2. **Navigate to**: Authentication → Settings
3. **Configure**:
   - **Site URL**: `https://your-app-name.vercel.app`
   - **Redirect URLs**: `https://your-app-name.vercel.app/**`

### 3.2 CORS Configuration
1. **Go to**: Settings → API
2. **Under "Allowed CORS Origins"**, add:
   ```
   https://your-app-name.vercel.app
   ```

## 🧪 Step 4: Production Testing

### 4.1 Basic Functionality Test
Visit your deployed URL and test:

- ✅ **Homepage loads** without errors
- ✅ **Authentication** (sign up/login)
- ✅ **Dashboard** displays correctly
- ✅ **Navigation** works properly

### 4.2 Feature Testing
Test all major features:

1. **Alert Management**:
   - Create new alert
   - Edit existing alert
   - Delete alert
   - Toggle alert status

2. **File Operations**:
   - Upload file to alert
   - Download attached file
   - File validation

3. **Sharing Features**:
   - Generate share link
   - Set access permissions
   - Test share link access

4. **Export Functionality**:
   - Export alerts as CSV
   - Export alerts as JSON
   - Filtered exports

5. **Role-based Access**:
   - Test admin permissions
   - Test editor permissions
   - Test read-only permissions

### 4.3 Mobile Testing
1. **Open browser dev tools**
2. **Toggle device simulation**
3. **Test on different screen sizes**:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px+)

## 📊 Step 5: Performance Verification

### 5.1 Load Testing
1. **Create multiple test alerts** (10-20)
2. **Test filtering** with large datasets
3. **Verify export performance** with many records
4. **Check page load times** are acceptable

### 5.2 File Upload Testing
1. **Test with various file types**:
   - Images (.jpg, .png)
   - Documents (.pdf, .docx)
   - Network files (.pcap, .pcapng)
2. **Test file size limits** (up to 50MB)
3. **Verify upload progress** works

## 🔒 Step 6: Security Verification

### 6.1 Authentication Security
1. **Test unauthorized access** to protected routes
2. **Verify logout** clears session properly
3. **Test password reset** functionality

### 6.2 Data Security
1. **Verify RLS policies** are working
2. **Test role-based access** restrictions
3. **Check file access** permissions

## 🎯 Success Criteria

✅ **Build Success**: `npm run build` completes without errors
✅ **Deployment Success**: Vercel deployment completes successfully
✅ **Environment Variables**: All variables configured correctly
✅ **Authentication**: Login/signup works in production
✅ **Core Features**: All major features functional
✅ **Mobile Responsive**: Works on mobile devices
✅ **Performance**: Acceptable load times
✅ **Security**: Access controls working properly

## 📞 Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check for TypeScript errors
   - Verify all dependencies installed
   - Check import paths

2. **Environment Variables Not Working**:
   - Verify variable names start with `VITE_`
   - Redeploy after adding variables
   - Check for typos in values

3. **Authentication Issues**:
   - Check Supabase URL and key
   - Verify redirect URLs in Supabase
   - Check CORS configuration

4. **File Upload Fails**:
   - Verify storage buckets exist
   - Check bucket permissions
   - Verify RLS policies

5. **Edge Functions Not Working**:
   - Check function deployment status
   - Verify function URLs
   - Check authentication headers

## 🚀 Next Steps

After frontend deployment is complete:
1. **Run Full Verification Suite**
2. **Test with Real Users**
3. **Monitor Performance**
4. **Set Up Monitoring**

---

**Frontend deployment should take approximately 10-20 minutes to complete.** 