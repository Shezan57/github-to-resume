/**
 * Token Management System
 * 
 * This module handles intelligent text chunking and token counting
 * to prevent LLM context overflow when processing large GitHub repositories.
 * 
 * Key features:
 * - Accurate token counting using tiktoken-compatible library
 * - Smart text chunking with overlap for context preservation
 * - Priority-based content selection when budget is limited
 * - Hierarchical summarization for large codebases
 */

import { encode } from 'gpt-tokenizer';

// Token limits for different OpenAI models
export const MODEL_TOKEN_LIMITS = {
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
} as const;

export type ModelName = keyof typeof MODEL_TOKEN_LIMITS;

// Default model for our application
export const DEFAULT_MODEL: ModelName = 'gpt-4o-mini';

// Reserve tokens for system prompt and response
export const RESERVED_TOKENS = {
    systemPrompt: 1000,
    response: 2000,
    safety: 500, // Buffer for edge cases
} as const;

/**
 * Count tokens in a string using GPT tokenizer
 */
export function countTokens(text: string): number {
    if (!text) return 0;
    try {
        return encode(text).length;
    } catch {
        // Fallback: rough estimate (1 token ≈ 4 chars for English)
        return Math.ceil(text.length / 4);
    }
}

/**
 * Calculate available tokens for content after reserving for system/response
 */
export function getAvailableTokens(model: ModelName = DEFAULT_MODEL): number {
    const limit = MODEL_TOKEN_LIMITS[model];
    const reserved = RESERVED_TOKENS.systemPrompt + RESERVED_TOKENS.response + RESERVED_TOKENS.safety;
    return limit - reserved;
}

/**
 * Truncate text to fit within a token budget
 */
export function truncateToTokenLimit(
    text: string,
    maxTokens: number,
    addEllipsis: boolean = true
): string {
    if (!text) return '';

    const tokens = encode(text);
    if (tokens.length <= maxTokens) {
        return text;
    }

    // Binary search for optimal truncation point
    let low = 0;
    let high = text.length;
    let result = '';

    while (low < high) {
        const mid = Math.floor((low + high + 1) / 2);
        const truncated = text.slice(0, mid);
        const tokenCount = countTokens(truncated);

        if (tokenCount <= maxTokens - (addEllipsis ? 3 : 0)) {
            result = truncated;
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    return addEllipsis && result.length < text.length
        ? result.trimEnd() + '...'
        : result;
}

/**
 * Content chunk with metadata
 */
export interface ContentChunk {
    id: string;
    content: string;
    tokenCount: number;
    type: 'readme' | 'source' | 'config' | 'metadata' | 'summary';
    priority: number; // 1-10, higher = more important
    source: string; // file path or description
}

/**
 * Chunk configuration options
 */
export interface ChunkingOptions {
    maxChunkTokens: number;
    overlapTokens: number;
    preserveCodeBlocks: boolean;
    preserveParagraphs: boolean;
}

const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
    maxChunkTokens: 3000,
    overlapTokens: 200,
    preserveCodeBlocks: true,
    preserveParagraphs: true,
};

/**
 * Split text into chunks that fit within token limits
 * Uses smart splitting to preserve code blocks and paragraphs
 */
export function chunkText(
    text: string,
    options: Partial<ChunkingOptions> = {}
): string[] {
    const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };

    if (!text || countTokens(text) <= opts.maxChunkTokens) {
        return text ? [text] : [];
    }

    const chunks: string[] = [];

    // First, try to split by natural boundaries
    const segments = splitByBoundaries(text, opts);

    let currentChunk = '';
    let currentTokens = 0;

    for (const segment of segments) {
        const segmentTokens = countTokens(segment);

        // If single segment exceeds limit, force-split it
        if (segmentTokens > opts.maxChunkTokens) {
            // Save current chunk first
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
                currentTokens = 0;
            }
            // Force-split the large segment
            chunks.push(...forceSplitText(segment, opts.maxChunkTokens));
            continue;
        }

        // Check if adding this segment exceeds limit
        if (currentTokens + segmentTokens > opts.maxChunkTokens) {
            // Save current chunk and start new one
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            // Start new chunk with overlap from previous
            const overlap = getOverlap(currentChunk, opts.overlapTokens);
            currentChunk = overlap + segment;
            currentTokens = countTokens(currentChunk);
        } else {
            currentChunk += segment;
            currentTokens += segmentTokens;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Split text by natural boundaries (paragraphs, code blocks, etc.)
 */
function splitByBoundaries(text: string, opts: ChunkingOptions): string[] {
    const segments: string[] = [];

    if (opts.preserveCodeBlocks) {
        // Split around code blocks to keep them intact
        const codeBlockRegex = /```[\s\S]*?```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const beforeCode = text.slice(lastIndex, match.index);
                segments.push(...splitByParagraphs(beforeCode, opts));
            }
            // Add code block as single segment
            segments.push(match[0]);
            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            segments.push(...splitByParagraphs(text.slice(lastIndex), opts));
        }

        return segments;
    }

    return splitByParagraphs(text, opts);
}

/**
 * Split text by paragraphs
 */
function splitByParagraphs(text: string, opts: ChunkingOptions): string[] {
    if (!opts.preserveParagraphs) {
        return [text];
    }

    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map(p => p + '\n\n').filter(p => p.trim());
}

/**
 * Force-split text when it exceeds token limit and can't be split naturally
 */
function forceSplitText(text: string, maxTokens: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining) {
        // Try to split at sentence boundary first
        let splitPoint = findSentenceBoundary(remaining, maxTokens);

        if (splitPoint === 0) {
            // No sentence boundary found, split at word boundary
            splitPoint = findWordBoundary(remaining, maxTokens);
        }

        if (splitPoint === 0) {
            // No good split point, force split by characters
            splitPoint = Math.floor(maxTokens * 3.5); // Rough char estimate
        }

        chunks.push(remaining.slice(0, splitPoint).trim());
        remaining = remaining.slice(splitPoint).trim();
    }

    return chunks;
}

/**
 * Find the last sentence boundary within token limit
 */
function findSentenceBoundary(text: string, maxTokens: number): number {
    const sentenceEnders = /[.!?]\s+/g;
    let lastValidIndex = 0;
    let match;

    while ((match = sentenceEnders.exec(text)) !== null) {
        const candidate = match.index + match[0].length;
        const tokens = countTokens(text.slice(0, candidate));

        if (tokens <= maxTokens) {
            lastValidIndex = candidate;
        } else {
            break;
        }
    }

    return lastValidIndex;
}

/**
 * Find the last word boundary within token limit
 */
function findWordBoundary(text: string, maxTokens: number): number {
    const words = text.split(/\s+/);
    let result = '';

    for (const word of words) {
        const candidate = result + (result ? ' ' : '') + word;
        if (countTokens(candidate) > maxTokens) {
            break;
        }
        result = candidate;
    }

    return result.length;
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlap(text: string, overlapTokens: number): string {
    if (!text || overlapTokens === 0) return '';

    // Get last N tokens worth of text
    const words = text.split(/\s+/);
    let overlap = '';

    for (let i = words.length - 1; i >= 0; i--) {
        const candidate = words[i] + (overlap ? ' ' : '') + overlap;
        if (countTokens(candidate) > overlapTokens) {
            break;
        }
        overlap = candidate;
    }

    return overlap ? overlap + ' ' : '';
}

/**
 * Content budget allocation for different content types
 */
export interface ContentBudget {
    readme: number;
    sourceFiles: number;
    configFiles: number;
    metadata: number;
}

/**
 * Allocate token budget across different content types
 * Prioritizes README and key source files
 */
export function allocateTokenBudget(
    totalBudget: number,
    hasReadme: boolean = true,
    sourceFileCount: number = 0,
    configFileCount: number = 0
): ContentBudget {
    // Base allocations (percentages)
    const allocations = {
        readme: hasReadme ? 0.35 : 0,      // 35% for README
        sourceFiles: 0.40,                  // 40% for source code
        configFiles: 0.15,                  // 15% for configs
        metadata: 0.10,                     // 10% for repo metadata
    };

    // Redistribute if no README
    if (!hasReadme) {
        allocations.sourceFiles += 0.25;
        allocations.configFiles += 0.10;
    }

    // Redistribute if no source files
    if (sourceFileCount === 0) {
        allocations.readme += allocations.sourceFiles * 0.6;
        allocations.configFiles += allocations.sourceFiles * 0.4;
        allocations.sourceFiles = 0;
    }

    return {
        readme: Math.floor(totalBudget * allocations.readme),
        sourceFiles: Math.floor(totalBudget * allocations.sourceFiles),
        configFiles: Math.floor(totalBudget * allocations.configFiles),
        metadata: Math.floor(totalBudget * allocations.metadata),
    };
}

/**
 * Select the most important content chunks within a token budget
 * Uses priority scoring to maximize information value
 */
export function selectChunksWithinBudget(
    chunks: ContentChunk[],
    budget: number
): ContentChunk[] {
    // Sort by priority (descending)
    const sorted = [...chunks].sort((a, b) => b.priority - a.priority);

    const selected: ContentChunk[] = [];
    let usedTokens = 0;

    for (const chunk of sorted) {
        if (usedTokens + chunk.tokenCount <= budget) {
            selected.push(chunk);
            usedTokens += chunk.tokenCount;
        }
    }

    return selected;
}

/**
 * Estimate tokens for a repository based on file count and sizes
 */
export function estimateRepoTokens(
    readmeSize: number,
    sourceFileSizes: number[],
    configFileSizes: number[]
): number {
    // Rough estimate: 1 byte ≈ 0.25 tokens for code
    const readmeTokens = Math.ceil(readmeSize * 0.3);
    const sourceTokens = sourceFileSizes.reduce((sum, size) => sum + Math.ceil(size * 0.25), 0);
    const configTokens = configFileSizes.reduce((sum, size) => sum + Math.ceil(size * 0.3), 0);

    return readmeTokens + sourceTokens + configTokens;
}

/**
 * Check if content will fit in a single context or needs hierarchical summarization
 */
export function needsHierarchicalSummarization(
    estimatedTokens: number,
    model: ModelName = DEFAULT_MODEL
): boolean {
    const available = getAvailableTokens(model);
    // Use hierarchical if content is more than 80% of available budget
    return estimatedTokens > available * 0.8;
}

/**
 * Token usage tracking for cost estimation
 */
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
}

// Pricing per 1M tokens (as of early 2024)
const PRICING = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
} as const;

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: ModelName = DEFAULT_MODEL
): number {
    const prices = PRICING[model];
    const inputCost = (inputTokens / 1_000_000) * prices.input;
    const outputCost = (outputTokens / 1_000_000) * prices.output;
    return inputCost + outputCost;
}
