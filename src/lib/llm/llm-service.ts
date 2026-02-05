import { Groq } from 'groq-sdk';
import { getOpenAIClient } from './openai'; // Existing OpenAI logic
import { LLMRequest, LLMResponse, LLMProvider } from './types';
import { calculateCost } from '@/lib/tokens';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key_if_missing',
    dangerouslyAllowBrowser: true // For client-side if needed, though we prefer server-side
});

export class UnifiedLLMService {
    private provider: LLMProvider;

    constructor(provider: LLMProvider = 'groq') {
        this.provider = provider;
    }

    async chat(request: LLMRequest): Promise<LLMResponse> {
        if (this.provider === 'openai') {
            return this.callOpenAI(request);
        } else {
            return this.callGroq(request);
        }
    }

    private async callGroq(request: LLMRequest): Promise<LLMResponse> {
        try {
            const completion = await groq.chat.completions.create({
                messages: request.messages,
                model: "openai/gpt-oss-120b", // User requested specific model
                temperature: request.temperature ?? 1,
                max_tokens: request.maxTokens ?? 8192,
                top_p: 1,
                stream: false,
            });

            const content = completion.choices[0]?.message?.content || '';
            const usage = completion.usage;

            return {
                content,
                usage: {
                    promptTokens: usage?.prompt_tokens || 0,
                    completionTokens: usage?.completion_tokens || 0,
                    totalTokens: usage?.total_tokens || 0,
                    cost: 0 // Groq is free tier for this user
                }
            };
        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    }

    private async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
        const openai = getOpenAIClient();
        const model = 'gpt-4o-mini';

        try {
            const completion = await openai.chat.completions.create({
                messages: request.messages,
                model: model,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens,
                response_format: request.jsonMode ? { type: 'json_object' } : undefined
            });

            const content = completion.choices[0]?.message?.content || '';
            const usage = completion.usage;

            // Calculate cost for OpenAI
            const cost = calculateCost({
                input: usage?.prompt_tokens || 0,
                output: usage?.completion_tokens || 0,
                model: model
            });

            return {
                content,
                usage: {
                    promptTokens: usage?.prompt_tokens || 0,
                    completionTokens: usage?.completion_tokens || 0,
                    totalTokens: usage?.total_tokens || 0,
                    cost
                }
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    }
}
