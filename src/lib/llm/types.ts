export interface LLMRequest {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        cost?: number;
    };
}

export type LLMProvider = 'groq' | 'openai';

export interface LLMService {
    chat(request: LLMRequest): Promise<LLMResponse>;
}
