import { Groq } from 'groq-sdk';
import fs from 'node:fs';
import path from 'node:path';

// Manual .env loading since dotenv is not installed or might not be loaded
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }
} catch (error) {
    console.error('Error loading .env.local:', error);
}

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.error('Error: GROQ_API_KEY not found in environment.');
    process.exit(1);
}

console.log('Initializing Groq with API Key:', apiKey.slice(0, 10) + '...');

const groq = new Groq({
    apiKey: apiKey
});

async function main() {
    try {
        console.log('Sending request to Groq...');
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": "Hello, are you working?"
                }
            ],
            // Use a standard supported model on Groq
            "model": "openai/gpt-oss-120b",
            "temperature": 0.5,
            "max_tokens": 100,
            "top_p": 1,
            "stream": true,
            "stop": null
        });

        console.log('Response:');
        for await (const chunk of chatCompletion) {
            process.stdout.write(chunk.choices[0]?.delta?.content || '');
        }
        console.log('\n\nSuccess! Groq is working.');
    } catch (error) {
        console.error('Error calling Groq:', error);
    }
}

main();
