// Test script for backend functionality
// Run with: node test-backend.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_URL = "https://xvjghqiuhpdlxdzkdzdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2amdocWl1aHBkbHhkemtkemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzQ2MTEsImV4cCI6MjA2OTU1MDYxMX0.oUa5YgNntn-2sRTixT8upgmUNcGcjTiOY_ubFtd4KIM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBackendFunctionality() {
    console.log('🧪 Testing Backend Functionality...\n');

    try {
        // Test 1: Check if tables exist
        console.log('1. Checking database tables...');
        
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['profiles', 'alerts', 'alert_categories', 'alert_logs', 'alert_shares', 'user_sessions']);

        if (tablesError) {
            console.log('❌ Error checking tables:', tablesError.message);
        } else {
            console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));
        }

        // Test 2: Check if functions exist
        console.log('\n2. Checking database functions...');
        
        const { data: functions, error: functionsError } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_schema', 'public')
            .in('routine_name', ['assign_alert', 'toggle_alert_status', 'mark_in_progress', 'get_alert_stats']);

        if (functionsError) {
            console.log('❌ Error checking functions:', functionsError.message);
        } else {
            console.log('✅ Found functions:', functions.map(f => f.routine_name).join(', '));
        }

        // Test 3: Test alert stats function
        console.log('\n3. Testing alert stats function...');
        
        const { data: stats, error: statsError } = await supabase
            .rpc('get_alert_stats');

        if (statsError) {
            console.log('❌ Error getting alert stats:', statsError.message);
        } else {
            console.log('✅ Alert stats:', stats);
        }

        // Test 4: Check storage buckets (if accessible)
        console.log('\n4. Checking storage buckets...');
        
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.log('❌ Error checking storage buckets:', bucketsError.message);
        } else {
            const bucketNames = buckets.map(b => b.name);
            console.log('✅ Available buckets:', bucketNames);
            
            if (bucketNames.includes('alert-files')) {
                console.log('✅ alert-files bucket exists');
            } else {
                console.log('⚠️  alert-files bucket not found - create it manually');
            }
            
            if (bucketNames.includes('report-exports')) {
                console.log('✅ report-exports bucket exists');
            } else {
                console.log('⚠️  report-exports bucket not found - create it manually');
            }
        }

        // Test 5: Test edge functions (if accessible)
        console.log('\n5. Testing edge functions...');
        
        try {
            const exportResponse = await fetch(`${SUPABASE_URL}/functions/v1/export-alerts`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (exportResponse.ok) {
                console.log('✅ export-alerts function is accessible');
            } else {
                console.log('⚠️  export-alerts function returned:', exportResponse.status);
            }
        } catch (error) {
            console.log('❌ Error testing export-alerts function:', error.message);
        }

        console.log('\n🎉 Backend testing completed!');
        console.log('\nNext steps:');
        console.log('1. If any tests failed, follow the manual deployment guide');
        console.log('2. Create storage buckets in Supabase dashboard if needed');
        console.log('3. Deploy edge functions using Supabase CLI');
        console.log('4. Start your development server: npm run dev');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testBackendFunctionality(); 