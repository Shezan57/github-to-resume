/**
 * OpenAI API Connection Test Script
 * Run with: npx tsx test-openai.ts
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

// Force IPv4 (fixes connection issues in some networks)
dns.setDefaultResultOrder('ipv4first');

// Manually load .env.local
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const [key, ...vals] = line.split('=');
            if (key && vals.length) {
                process.env[key.trim()] = vals.join('=').trim();
            }
        });
    }
}

loadEnv();

async function testOpenAI() {
    console.log('🔍 Testing OpenAI API Connection...\n');

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY not found in .env.local');
        process.exit(1);
    }

    console.log(`✓ API Key found: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

    // Use proxy if available (for regions where OpenAI is blocked)
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:17890';
    console.log(`✓ Using proxy: ${proxyUrl}`);
    
    const agent = new ProxyAgent(proxyUrl);

    // Custom fetch that uses the proxy agent
    const proxyFetch = (url: RequestInfo | URL, init?: RequestInit) => {
        return undiciFetch(url as any, { ...init, dispatcher: agent } as any);
    };

    const openai = new OpenAI({ 
        apiKey,
        timeout: 60000,
        maxRetries: 2,
        fetch: proxyFetch as any,
    });

    try {
        console.log('\n📡 Sending test request to OpenAI...');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "Hello!" only' }],
            max_tokens: 10,
        });

        console.log('\n✅ SUCCESS! OpenAI API is accessible.');
        console.log(`📝 Response: ${response.choices[0]?.message?.content}`);

    } catch (error: any) {
        console.error('\n❌ FAILED to connect to OpenAI API');
        console.error(`   Code: ${error.code || 'N/A'}`);
        console.error(`   Status: ${error.status || 'N/A'}`);
        console.error(`   Message: ${error.message}`);
        console.error(`   Cause: ${error.cause?.message || error.cause || 'N/A'}`);
        console.error(`   Full error:`, error);

        if (error.code === 'unsupported_country_region_territory') {
            console.error('\n⚠️  REGIONAL RESTRICTION: OpenAI is blocked in your region.');
            console.error('💡 Use a VPN or switch to Google Gemini API');
        }

        process.exit(1);
    }
}

testOpenAI();
