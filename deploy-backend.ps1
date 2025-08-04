# Observe-Flow Backend Deployment Script
# This script helps deploy the backend functionality to Supabase

Write-Host "🚀 Observe-Flow Backend Deployment Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    if ($supabaseVersion) {
        Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   Option 1: winget install Supabase.CLI" -ForegroundColor Yellow
    Write-Host "   Option 2: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "   Option 3: Download from https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Step 1: Deploy Database Migration
Write-Host "`n📊 Step 1: Deploying Database Migration..." -ForegroundColor Cyan
try {
    supabase db push
    Write-Host "✅ Database migration deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy migration. Please check your Supabase credentials." -ForegroundColor Red
    Write-Host "   Make sure you're logged in with: supabase login" -ForegroundColor Yellow
    exit 1
}

# Step 2: Deploy Edge Functions
Write-Host "`n⚡ Step 2: Deploying Edge Functions..." -ForegroundColor Cyan
try {
    supabase functions deploy export-alerts
    Write-Host "✅ export-alerts function deployed!" -ForegroundColor Green
    
    supabase functions deploy share-alert
    Write-Host "✅ share-alert function deployed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy edge functions. Please check your Supabase credentials." -ForegroundColor Red
    exit 1
}

# Step 3: Create Storage Buckets
Write-Host "`n📁 Step 3: Creating Storage Buckets..." -ForegroundColor Cyan
Write-Host "   Please manually create these buckets in your Supabase dashboard:" -ForegroundColor Yellow
Write-Host "   1. alert-files (for alert attachments)" -ForegroundColor White
Write-Host "   2. report-exports (for exported reports)" -ForegroundColor White

# Step 4: Environment Variables
Write-Host "`n🔧 Step 4: Environment Variables..." -ForegroundColor Cyan
Write-Host "   Your current Supabase configuration:" -ForegroundColor Yellow
Write-Host "   URL: https://xvjghqiuhpdlxdzkdzdw.supabase.co" -ForegroundColor White
Write-Host "   Project ID: xvjghqiuhpdlxdzkdzdw" -ForegroundColor White

Write-Host "`n🎉 Deployment completed! Next steps:" -ForegroundColor Green
Write-Host "1. Create storage buckets in Supabase dashboard" -ForegroundColor White
Write-Host "2. Test the functionality using the service classes" -ForegroundColor White
Write-Host "3. Run: npm run dev to start the development server" -ForegroundColor White 