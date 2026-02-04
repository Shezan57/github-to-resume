/**
 * OpenAI Client Configuration
 */

import OpenAI from 'openai';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

// Create OpenAI client
export function createOpenAIClient(apiKey?: string): OpenAI {
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
        throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }

    // Use proxy if configured (for regions where OpenAI is blocked or behind corporate firewall)
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    
    if (proxyUrl) {
        const agent = new ProxyAgent(proxyUrl);
        const proxyFetch = (url: RequestInfo | URL, init?: RequestInit) => {
            return undiciFetch(url as any, { ...init, dispatcher: agent } as any);
        };
        
        return new OpenAI({
            apiKey: key,
            fetch: proxyFetch as any,
        });
    }

    return new OpenAI({
        apiKey: key,
    });
}

// Default model for analysis
export const LLM_DEFAULT_MODEL = 'gpt-4o-mini';

// Model for higher quality final synthesis (optional upgrade)
export const LLM_SYNTHESIS_MODEL = 'gpt-4o-mini';

// Singleton client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(apiKey?: string): OpenAI {
    if (!openaiClient) {
        openaiClient = createOpenAIClient(apiKey);
    }
    return openaiClient;
}

// Reset client (useful for testing or API key changes)
export function resetOpenAIClient(): void {
    openaiClient = null;
}
