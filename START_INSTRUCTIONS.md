# 🚀 Start Instructions - Observe-Flow Application

## 📋 Prerequisites

Before starting the application, ensure you have:

1. **Node.js** installed (version 16 or higher)
2. **Supabase CLI** installed (optional, for deployment)
3. **Backend deployed** (follow the deployment guides)

## 🔧 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5173`

## 🧪 Testing the Integration

### 1. **Backend Verification**
First, verify your backend is properly deployed:

1. Open `verify-backend.html` in your browser
2. Click "Run All Tests"
3. Verify all tests pass (80%+ success rate)

### 2. **Frontend Testing**

#### **Authentication Test**
1. Navigate to `http://localhost:5173`
2. Register a new account or login
3. Verify you can access the dashboard

#### **Dashboard Features Test**
1. **Statistics Cards**: Verify statistics are displayed
2. **Filtering**: Test all filter options (severity, status, category, assignment)
3. **Search**: Test search functionality
4. **Export**: Test CSV/JSON export buttons
5. **Role-based UI**: Verify buttons are hidden/shown based on permissions

#### **Alert Creation Test**
1. Click "Create Alert"
2. Fill out the enhanced form with all new fields:
   - Rule name, description, impact, mitigation
   - Category, priority, due date
   - Source, confidence score
   - Tags, external URL
3. Upload a test file (image, PDF, or text file)
4. Submit and verify alert appears in dashboard

#### **Alert Management Test**
1. **View Alert**: Click on an alert to view details
2. **Edit Alert**: Test editing functionality
3. **Status Management**: Test "Mark In Progress" and status toggle
4. **File Management**: Test file upload/download
5. **Findings**: Add and edit investigation findings

#### **Sharing Test**
1. Click "Share" on an alert
2. Create a share link with different access levels
3. Test email invitations
4. Verify share link works in incognito mode
5. Test share revocation

#### **Export Test**
1. Click "Export" on dashboard or alert detail
2. Test CSV and JSON export
3. Test filtered exports
4. Test field selection
5. Verify downloaded files

#### **Role-based Access Test**
1. **Admin User**: Test all features are available
2. **Editor User**: Test create/edit permissions
3. **Read-only User**: Test view-only access
4. **Access Denied**: Verify proper error pages

## 📊 Expected Features

### **Dashboard**
- ✅ Statistics cards showing alert counts
- ✅ Advanced filtering and search
- ✅ Role-based action buttons
- ✅ Export functionality
- ✅ Real-time updates

### **Alert Management**
- ✅ Enhanced form with all new fields
- ✅ File upload and management
- ✅ Status tracking and management
- ✅ Activity logs and audit trail
- ✅ Sharing and collaboration

### **Security**
- ✅ Role-based access control
- ✅ Secure file upload/download
- ✅ Share link security
- ✅ Audit logging

## 🔍 Troubleshooting

### **Common Issues**

#### **Backend Not Deployed**
- **Symptom**: API calls fail with 404 or connection errors
- **Solution**: Follow the deployment guides to deploy the backend

#### **Authentication Issues**
- **Symptom**: Can't login or access protected routes
- **Solution**: Check Supabase configuration in `src/integrations/supabase/client.ts`

#### **File Upload Fails**
- **Symptom**: File upload errors or 403 permissions
- **Solution**: Verify storage buckets are created in Supabase dashboard

#### **Role-based Access Not Working**
- **Symptom**: Users see features they shouldn't have access to
- **Solution**: Check user profiles and role assignments in database

#### **Export Not Working**
- **Symptom**: Export buttons don't work or return errors
- **Solution**: Verify edge functions are deployed

### **Debug Steps**

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are successful
3. **Check Supabase Dashboard**: Verify data and functions
4. **Check Backend Logs**: Look for server-side errors

## 📱 Mobile Testing

### **Responsive Design**
1. Open browser dev tools
2. Toggle device simulation
3. Test on different screen sizes
4. Verify all features work on mobile

### **Touch Interactions**
1. Test file upload on mobile
2. Test navigation and menus
3. Test form interactions
4. Verify touch-friendly buttons

## 🎯 Performance Testing

### **Load Testing**
1. Create multiple alerts
2. Test filtering with large datasets
3. Test export with many records
4. Verify performance remains good

### **File Upload Testing**
1. Test with large files (up to 50MB)
2. Test with different file types
3. Test concurrent uploads
4. Verify upload progress works

## 📈 Success Criteria

### **Functionality**
- ✅ All backend services working
- ✅ Role-based access control active
- ✅ File upload/download working
- ✅ Sharing functionality complete
- ✅ Export functionality working
- ✅ Audit logging active

### **User Experience**
- ✅ Modern, responsive UI
- ✅ Intuitive navigation
- ✅ Proper error handling
- ✅ Loading states and feedback
- ✅ Mobile-friendly design

### **Security**
- ✅ Authentication working
- ✅ Authorization enforced
- ✅ Data protection active
- ✅ Audit trail complete

## 🚀 Production Deployment

### **Build for Production**
```bash
npm run build
```

### **Deploy Options**
1. **Vercel**: Connect GitHub repository
2. **Netlify**: Drag and drop build folder
3. **AWS S3**: Upload build files
4. **Custom Server**: Serve build files

### **Environment Variables**
Ensure these are set in production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📚 Additional Resources

- [Backend Deployment Guide](./MANUAL_DEPLOYMENT.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
- [Backend Functionality Documentation](./BACKEND_FUNCTIONALITY.md)
- [Verification Tools](./verify-backend.html)

---

**🎉 Your Observe-Flow application is ready to use!**

**Next Steps**:
1. Deploy the backend using the provided guides
2. Start the development server with `npm run dev`
3. Test all functionality using the verification tools
4. Deploy to production when ready

**Support**: If you encounter any issues, check the troubleshooting section or refer to the documentation files. 