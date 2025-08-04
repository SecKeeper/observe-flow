#!/usr/bin/env node

/**
 * 🧪 Observe-Flow Production Verification Script
 * 
 * This script performs comprehensive testing of your deployed application
 * to ensure everything is working correctly in production.
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

// Configuration
const SUPABASE_URL = "https://xvjghqiuhpdlxdzkdzdw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2amdocWl1aHBkbHhkemtkemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzQ2MTEsImV4cCI6MjA2OTU1MDYxMX0.oUa5YgNntn-2sRTixT8upgmUNcGcjTiOY_ubFtd4KIM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test Results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, details = '') {
  const test = { name, passed, details, timestamp: new Date().toISOString() };
  results.tests.push(test);
  
  if (passed) {
    results.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    results.failed++;
    log(`FAIL: ${name} - ${details}`, 'error');
  }
}

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('alerts').select('count').limit(1);
    if (error) throw error;
    recordTest('Database Connection', true);
    return true;
  } catch (error) {
    recordTest('Database Connection', false, error.message);
    return false;
  }
}

async function testTableExistence() {
  const requiredTables = [
    'alerts', 'profiles', 'alert_shares', 'alert_logs', 
    'alert_categories', 'user_sessions', 'user_activity_log'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        recordTest(`Table: ${table}`, false, error.message);
        allTablesExist = false;
      } else {
        recordTest(`Table: ${table}`, true);
      }
    } catch (error) {
      recordTest(`Table: ${table}`, false, error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testFunctions() {
  const requiredFunctions = [
    'get_alert_stats',
    'get_alert_analytics',
    'assign_alert',
    'toggle_alert_status',
    'mark_in_progress',
    'log_alert_change'
  ];
  
  let allFunctionsExist = true;
  
  for (const func of requiredFunctions) {
    try {
      // Test function existence by calling it (this will fail gracefully if function doesn't exist)
      const { data, error } = await supabase.rpc(func, {});
      // We expect an error for invalid parameters, but not for function not found
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        recordTest(`Function: ${func}`, false, 'Function not found');
        allFunctionsExist = false;
      } else {
        recordTest(`Function: ${func}`, true);
      }
    } catch (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        recordTest(`Function: ${func}`, false, 'Function not found');
        allFunctionsExist = false;
      } else {
        recordTest(`Function: ${func}`, true);
      }
    }
  }
  
  return allFunctionsExist;
}

async function testStorageBuckets() {
  const buckets = ['alert-files', 'report-exports'];
  let allBucketsExist = true;
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucket);
      if (error) {
        recordTest(`Storage Bucket: ${bucket}`, false, error.message);
        allBucketsExist = false;
      } else {
        recordTest(`Storage Bucket: ${bucket}`, true);
      }
    } catch (error) {
      recordTest(`Storage Bucket: ${bucket}`, false, error.message);
      allBucketsExist = false;
    }
  }
  
  return allBucketsExist;
}

async function testEdgeFunctions() {
  const functions = [
    { name: 'export-alerts', url: `${SUPABASE_URL}/functions/v1/export-alerts` },
    { name: 'share-alert', url: `${SUPABASE_URL}/functions/v1/share-alert` }
  ];
  
  let allFunctionsWork = true;
  
  for (const func of functions) {
    try {
      const response = await fetch(func.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      // We expect a 401 or 400 error (not 404) which means the function exists
      if (response.status === 404) {
        recordTest(`Edge Function: ${func.name}`, false, 'Function not deployed');
        allFunctionsWork = false;
      } else {
        recordTest(`Edge Function: ${func.name}`, true);
      }
    } catch (error) {
      recordTest(`Edge Function: ${func.name}`, false, error.message);
      allFunctionsWork = false;
    }
  }
  
  return allFunctionsWork;
}

async function testRLSPolicies() {
  try {
    // Test that unauthenticated users cannot access alerts
    const { data, error } = await supabase.from('alerts').select('*');
    
    // Should return empty array or error due to RLS
    if (data && data.length === 0) {
      recordTest('RLS Policies', true, 'Unauthenticated access blocked');
    } else if (error && error.message.includes('permission')) {
      recordTest('RLS Policies', true, 'RLS blocking unauthorized access');
    } else {
      recordTest('RLS Policies', false, 'RLS not properly configured');
    }
  } catch (error) {
    recordTest('RLS Policies', false, error.message);
  }
}

async function testAuthentication() {
  try {
    // Test auth endpoints
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      recordTest('Authentication Service', false, error.message);
      return false;
    } else {
      recordTest('Authentication Service', true);
      return true;
    }
  } catch (error) {
    recordTest('Authentication Service', false, error.message);
    return false;
  }
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.passed + results.failed,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(2)
    },
    tests: results.tests
  };
  
  // Save report to file
  fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
  
  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PRODUCTION VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed} ✅`);
  console.log(`Failed: ${report.summary.failed} ❌`);
  console.log(`Success Rate: ${report.summary.successRate}%`);
  console.log('='.repeat(60));
  
  if (report.summary.successRate >= 80) {
    console.log('🎉 PRODUCTION READY! Your application is ready for users.');
  } else {
    console.log('⚠️  ISSUES DETECTED! Please fix the failed tests before going live.');
  }
  
  console.log('\n📄 Detailed report saved to: verification-report.json');
}

async function runAllTests() {
  console.log('🚀 Starting Observe-Flow Production Verification...\n');
  
  // Run all tests
  await testDatabaseConnection();
  await testTableExistence();
  await testFunctions();
  await testStorageBuckets();
  await testEdgeFunctions();
  await testRLSPolicies();
  await testAuthentication();
  
  // Generate report
  await generateReport();
}

// Run the verification
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testDatabaseConnection,
  testTableExistence,
  testFunctions,
  testStorageBuckets,
  testEdgeFunctions,
  testRLSPolicies,
  testAuthentication
}; 