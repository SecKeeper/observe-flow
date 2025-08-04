# 🚀 Observe-Flow Production Deployment Script
# This script guides you through the production deployment process

Write-Host "🚀 Observe-Flow Production Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 1: Backend Deployment (Supabase)" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please follow these manual steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/xvjghqiuhpdlxdzkdzdw" -ForegroundColor White
Write-Host ""
Write-Host "2. Deploy Database Migration:" -ForegroundColor Cyan
Write-Host "   - Go to SQL Editor" -ForegroundColor White
Write-Host "   - Copy content from: supabase/migrations/20250101000000_complete_backend_functionality.sql" -ForegroundColor White
Write-Host "   - Paste and run the migration" -ForegroundColor White
Write-Host ""
Write-Host "3. Create Storage Buckets:" -ForegroundColor Cyan
Write-Host "   - Create 'alert-files' bucket (public)" -ForegroundColor White
Write-Host "   - Create 'report-exports' bucket (private)" -ForegroundColor White
Write-Host ""
Write-Host "4. Deploy Edge Functions:" -ForegroundColor Cyan
Write-Host "   - Install Supabase CLI: npm install -g supabase" -ForegroundColor White
Write-Host "   - Login: supabase login" -ForegroundColor White
Write-Host "   - Link project: supabase link --project-ref xvjghqiuhpdlxdzkdzdw" -ForegroundColor White
Write-Host "   - Deploy functions:" -ForegroundColor White
Write-Host "     supabase functions deploy export-alerts" -ForegroundColor White
Write-Host "     supabase functions deploy share-alert" -ForegroundColor White
Write-Host ""

$backendReady = Read-Host "Press Enter when backend deployment is complete"

Write-Host ""
Write-Host "🌐 Step 2: Frontend Deployment" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Build the project
Write-Host "Building project for production..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Choose deployment platform:" -ForegroundColor Cyan
Write-Host "1. Vercel (Recommended)" -ForegroundColor White
Write-Host "2. Netlify" -ForegroundColor White
Write-Host "3. Manual deployment" -ForegroundColor White
Write-Host ""

$deploymentChoice = Read-Host "Enter your choice (1-3)"

switch ($deploymentChoice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Go to https://vercel.com" -ForegroundColor Cyan
        Write-Host "2. Sign up/Login with GitHub" -ForegroundColor White
        Write-Host "3. Click 'New Project'" -ForegroundColor White
        Write-Host "4. Import your GitHub repository" -ForegroundColor White
        Write-Host "5. Configure build settings:" -ForegroundColor White
        Write-Host "   - Framework Preset: Vite" -ForegroundColor White
        Write-Host "   - Build Command: npm run build" -ForegroundColor White
        Write-Host "   - Output Directory: dist" -ForegroundColor White
        Write-Host "6. Add environment variables:" -ForegroundColor White
        Write-Host "   VITE_SUPABASE_URL=https://xvjghqiuhpdlxdzkdzdw.supabase.co" -ForegroundColor White
        Write-Host "   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2amdocWl1aHBkbHhkemtkemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzQ2MTEsImV4cCI6MjA2OTU1MDYxMX0.oUa5YgNntn-2sRTixT8upgmUNcGcjTiOY_ubFtd4KIM" -ForegroundColor White
        Write-Host "7. Click 'Deploy'" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying to Netlify..." -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Go to https://netlify.com" -ForegroundColor Cyan
        Write-Host "2. Sign up/Login with GitHub" -ForegroundColor White
        Write-Host "3. Click 'New site from Git'" -ForegroundColor White
        Write-Host "4. Connect your repository" -ForegroundColor White
        Write-Host "5. Configure build settings:" -ForegroundColor White
        Write-Host "   - Build command: npm run build" -ForegroundColor White
        Write-Host "   - Publish directory: dist" -ForegroundColor White
        Write-Host "6. Add environment variables in site settings" -ForegroundColor White
        Write-Host "7. Click 'Deploy site'" -ForegroundColor White
    }
    "3" {
        Write-Host ""
        Write-Host "📁 Manual Deployment" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your built files are in the 'dist' folder." -ForegroundColor Cyan
        Write-Host "Upload these files to your web server." -ForegroundColor White
        Write-Host ""
        Write-Host "Don't forget to set environment variables on your server!" -ForegroundColor Yellow
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🧪 Step 3: Verification" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Running production verification..." -ForegroundColor Cyan

# Check if Node.js verification script can run
try {
    node production-verification.js
} catch {
    Write-Host "❌ Verification script failed. Please run manually:" -ForegroundColor Red
    Write-Host "   node production-verification.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Manual Verification Steps:" -ForegroundColor Cyan
Write-Host "1. Open verify-backend.html in your browser" -ForegroundColor White
Write-Host "2. Click 'Run All Tests'" -ForegroundColor White
Write-Host "3. Verify 80%+ success rate" -ForegroundColor White
Write-Host "4. Test your deployed frontend URL" -ForegroundColor White
Write-Host "5. Test authentication and all features" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Complete verification tests" -ForegroundColor White
Write-Host "2. Configure Supabase authentication settings" -ForegroundColor White
Write-Host "3. Create admin user accounts" -ForegroundColor White
Write-Host "4. Onboard your first users" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: PRODUCTION_DEPLOYMENT.md" -ForegroundColor Yellow 