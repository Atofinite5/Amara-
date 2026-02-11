
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface DiagnosticResult {
    category: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    details?: any;
    timestamp: string;
}

const results: DiagnosticResult[] = [];

function log(category: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    const result: DiagnosticResult = {
        category,
        status,
        message,
        details,
        timestamp: new Date().toISOString()
    };
    results.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${category}] ${message}`);
    if (details) {
        console.log('   Details:', JSON.stringify(details, null, 2));
    }
}

async function checkEnvironmentVariables() {
    console.log('\n--- 1. Environment Configuration Check ---');
    const requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE',
        'JWT_SECRET',
        'NODE_ENV'
    ];

    let allPresent = true;
    for (const v of requiredVars) {
        if (!process.env[v]) {
            log('Config', 'FAIL', `Missing environment variable: ${v}`);
            allPresent = false;
        } else if (process.env[v]!.includes('your-')) {
             log('Config', 'WARN', `Environment variable ${v} appears to be a placeholder`, { value: process.env[v] });
        } else {
            log('Config', 'PASS', `Environment variable ${v} is present`);
        }
    }
    
    // Check JWT_SECRET strength
    if (process.env.JWT_SECRET) {
        if (process.env.JWT_SECRET.length < 32) {
            log('Security', 'WARN', 'JWT_SECRET is relatively short (< 32 chars)');
        } else {
             log('Security', 'PASS', 'JWT_SECRET length is sufficient');
        }
    }

    return allPresent;
}

async function checkSupabaseConnectivity() {
    console.log('\n--- 2. Supabase Connectivity & Schema Check ---');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        log('Database', 'FAIL', 'Skipping Supabase check due to missing credentials');
        return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    try {
        // Test 1: Basic Connection (Heartbeat)
        // We'll try to select from 'events' table since user mentioned it
        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .limit(1);

        if (eventsError) {
             if (eventsError.code === '42P01') { // undefined_table
                 log('Database', 'FAIL', 'Table "events" does not exist', eventsError);
             } else {
                 log('Database', 'FAIL', 'Failed to query "events" table', eventsError);
             }
        } else {
             log('Database', 'PASS', 'Successfully connected and queried "events" table');
             
             // Check for specific columns if we got data or even if empty
             // Note: We can't easily check columns via JS client without inspecting error on select specific column
             // or using rpc to query schema information if allowed.
             // We'll try selecting the 'details' column specifically as a test.
             const { error: colError } = await supabase
                .from('events')
                .select('details')
                .limit(1);
                
             if (colError) {
                 log('Database', 'FAIL', 'Column "details" in "events" table access failed', colError);
             } else {
                 log('Database', 'PASS', 'Column "details" exists in "events" table');
             }
        }

        // Test 2: Check 'rules' table
        const { error: rulesError } = await supabase
            .from('rules')
            .select('count', { count: 'exact', head: true });
            
        if (rulesError) {
            log('Database', 'WARN', 'Issue accessing "rules" table', rulesError);
        } else {
            log('Database', 'PASS', '"rules" table is accessible');
        }

    } catch (err: any) {
        log('Database', 'FAIL', 'Unexpected error during Supabase check', { message: err.message });
    }
}

async function checkRedis() {
    console.log('\n--- 3. Redis/Cache Check ---');
    if (process.env.MOCK_REDIS === 'true') {
        log('Cache', 'PASS', 'Using MOCK_REDIS (Redis connection check skipped)');
        return;
    }

    if (!process.env.REDIS_URL) {
        log('Cache', 'WARN', 'REDIS_URL not set but MOCK_REDIS is not true');
        return;
    }

    // Basic check if we were to implement real redis check
    // keeping it simple for now as we don't want to add redis dependency if not needed for script
    log('Cache', 'PASS', 'REDIS_URL is configured (Connectivity not verified in this script version)');
}

async function generateReport() {
    console.log('\n--- 4. Diagnostic Report Summary ---');
    const passed = results.filter(r => r.status === 'PASS').length;
    const warnings = results.filter(r => r.status === 'WARN').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    console.log(`Total Checks: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Failed: ${failed}`);

    if (failed === 0) {
        console.log('\n✅ SYSTEM STATUS: OPERATIONAL');
    } else {
        console.log('\n❌ SYSTEM STATUS: ISSUES DETECTED');
    }
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'diagnostic_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: { passed, warnings, failed },
        details: results
    }, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
}

async function run() {
    console.log('Starting Amara System Health Check...');
    await checkEnvironmentVariables();
    await checkSupabaseConnectivity();
    await checkRedis();
    await generateReport();
}

run().catch(err => {
    console.error('Fatal error running health check:', err);
    process.exit(1);
});
