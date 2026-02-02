/**
 * Repository Analyzer with Hierarchical Summarization
 * 
 * This module handles intelligent analysis of GitHub repositories using OpenAI.
 * It implements a hierarchical summarization strategy to handle large repos:
 * 
 * 1. If content fits in context → Direct analysis
 * 2. If content too large → Chunk → Summarize chunks → Combine → Analyze
 * 
 * This ensures we never exceed token limits while preserving maximum information.
 */

import type OpenAI from 'openai';
import { getOpenAIClient, LLM_DEFAULT_MODEL } from './openai';
import {
    REPO_ANALYSIS_SYSTEM_PROMPT,
    CHUNK_SUMMARY_SYSTEM_PROMPT,
    CHUNK_COMBINE_SYSTEM_PROMPT,
    generateRepoAnalysisPrompt,
    generateChunkSummaryPrompt,
    generateCombineSummariesPrompt,
} from './prompts';
import {
    countTokens,
    getAvailableTokens,
    chunkText,
    truncateToTokenLimit,
    allocateTokenBudget,
    needsHierarchicalSummarization,
    estimateRepoTokens,
    calculateCost,
    type ModelName,
    type TokenUsage,
} from '../tokens';
import {
    ProcessedRepository,
    RepositoryContent,
    RepositoryAnalysis,
} from '@/types';
import { retry, safeJsonParse } from '../utils';

// Configuration
const MAX_RETRIES = 3;
const MAX_CHUNK_TOKENS = 3000;
const MIN_CHUNK_FOR_HIERARCHICAL = 8000; // Only use hierarchical if > 8K tokens
const MAX_SUMMARIES_TO_COMBINE = 10;

interface AnalyzerOptions {
    apiKey?: string;
    model?: ModelName;
    verbose?: boolean;
    onProgress?: (message: string) => void;
}

interface AnalysisResult {
    analysis: RepositoryAnalysis;
    tokenUsage: TokenUsage;
}

/**
 * Analyze a single repository
 */
export async function analyzeRepository(
    repo: ProcessedRepository,
    content: RepositoryContent,
    options: AnalyzerOptions = {}
): Promise<AnalysisResult> {
    const {
        apiKey,
        model = LLM_DEFAULT_MODEL as ModelName,
        verbose = false,
        onProgress,
    } = options;

    const openai = getOpenAIClient(apiKey);
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const log = (msg: string) => {
        if (verbose) console.log(`[Analyzer] ${msg}`);
        if (onProgress) onProgress(msg);
    };

    log(`Analyzing repository: ${repo.name}`);

    // Estimate content size
    const estimatedTokens = estimateContentTokens(content);
    log(`Estimated content tokens: ${estimatedTokens}`);

    // Check if we need hierarchical summarization
    const availableTokens = getAvailableTokens(model);

    let processedContent: RepositoryContent = content;

    if (needsHierarchicalSummarization(estimatedTokens, model)) {
        log(`Content too large (${estimatedTokens} tokens). Using hierarchical summarization...`);

        // Hierarchical summarization for large content
        const { summarizedContent, inputTokens, outputTokens } =
            await hierarchicalSummarize(repo.name, content, openai, model, log);

        processedContent = summarizedContent;
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
    }

    // Generate the analysis prompt
    const userPrompt = generateRepoAnalysisPrompt(repo, processedContent);
    const promptTokens = countTokens(userPrompt);

    log(`Analysis prompt tokens: ${promptTokens}`);

    // If still too large after summarization, truncate
    const maxUserPromptTokens = availableTokens - countTokens(REPO_ANALYSIS_SYSTEM_PROMPT) - 500;
    const finalPrompt = promptTokens > maxUserPromptTokens
        ? truncateToTokenLimit(userPrompt, maxUserPromptTokens)
        : userPrompt;

    // Call LLM for analysis
    const response = await retry(
        () => openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: REPO_ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: finalPrompt },
            ],
            temperature: 0.3, // Lower temperature for more consistent output
            response_format: { type: 'json_object' },
        }),
        { maxRetries: MAX_RETRIES }
    );

    totalInputTokens += response.usage?.prompt_tokens || 0;
    totalOutputTokens += response.usage?.completion_tokens || 0;

    // Parse the response
    const responseText = response.choices[0]?.message?.content || '';
    const analysis = parseAnalysisResponse(responseText, repo);

    log(`Analysis complete for ${repo.name}`);

    return {
        analysis,
        tokenUsage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            estimatedCost: calculateCost(totalInputTokens, totalOutputTokens, model),
        },
    };
}

/**
 * Estimate token count for repository content
 */
function estimateContentTokens(content: RepositoryContent): number {
    let tokens = 0;

    if (content.readme) {
        tokens += countTokens(content.readme);
    }

    for (const file of content.sourceFiles) {
        tokens += countTokens(file.content);
    }

    for (const file of content.configFiles) {
        tokens += countTokens(file.content);
    }

    // Add metadata overhead
    tokens += 500;

    return tokens;
}

/**
 * Hierarchical summarization for large content
 * 
 * Strategy:
 * 1. Split large content into chunks
 * 2. Summarize each chunk independently
 * 3. Combine summaries into final compact form
 */
async function hierarchicalSummarize(
    repoName: string,
    content: RepositoryContent,
    openai: OpenAI,
    model: ModelName,
    log: (msg: string) => void
): Promise<{
    summarizedContent: RepositoryContent;
    inputTokens: number;
    outputTokens: number;
}> {
    let inputTokens = 0;
    let outputTokens = 0;

    const summarizedContent: RepositoryContent = {
        readme: null,
        packageJson: content.packageJson, // Keep small structured data
        requirementsTxt: content.requirementsTxt
            ? content.requirementsTxt.split('\n').slice(0, 20).join('\n')
            : null,
        sourceFiles: [],
        configFiles: [],
    };

    // Summarize README if large
    if (content.readme && countTokens(content.readme) > MIN_CHUNK_FOR_HIERARCHICAL) {
        log('Summarizing large README...');
        const { summary, input, output } = await summarizeLargeText(
            content.readme,
            repoName,
            openai,
            model
        );
        summarizedContent.readme = summary;
        inputTokens += input;
        outputTokens += output;
    } else {
        summarizedContent.readme = content.readme;
    }

    // Summarize source files
    for (const file of content.sourceFiles) {
        if (countTokens(file.content) > MAX_CHUNK_TOKENS) {
            log(`Summarizing large source file: ${file.path}`);
            const { summary, input, output } = await summarizeLargeText(
                file.content,
                `${repoName}/${file.path}`,
                openai,
                model
            );
            summarizedContent.sourceFiles.push({
                ...file,
                content: summary,
            });
            inputTokens += input;
            outputTokens += output;
        } else {
            summarizedContent.sourceFiles.push(file);
        }
    }

    // Keep config files as-is (usually small and structured)
    summarizedContent.configFiles = content.configFiles.map(file => ({
        ...file,
        content: truncateToTokenLimit(file.content, 500),
    }));

    return { summarizedContent, inputTokens, outputTokens };
}

/**
 * Summarize a large text using chunk-and-combine strategy
 */
async function summarizeLargeText(
    text: string,
    contextName: string,
    openai: OpenAI,
    model: ModelName
): Promise<{
    summary: string;
    input: number;
    output: number;
}> {
    // Split into chunks
    const chunks = chunkText(text, { maxChunkTokens: MAX_CHUNK_TOKENS });

    if (chunks.length === 1) {
        return { summary: chunks[0], input: 0, output: 0 };
    }

    let inputTokens = 0;
    let outputTokens = 0;

    // Summarize each chunk
    const chunkSummaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunkPrompt = generateChunkSummaryPrompt(
            chunks[i],
            i,
            chunks.length,
            contextName
        );

        const response = await retry(
            () => openai.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: CHUNK_SUMMARY_SYSTEM_PROMPT },
                    { role: 'user', content: chunkPrompt },
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
            { maxRetries: MAX_RETRIES }
        );

        inputTokens += response.usage?.prompt_tokens || 0;
        outputTokens += response.usage?.completion_tokens || 0;

        const summary = response.choices[0]?.message?.content || '';
        chunkSummaries.push(summary);
    }

    // If too many summaries, combine in batches
    let finalSummaries = chunkSummaries;

    while (finalSummaries.length > MAX_SUMMARIES_TO_COMBINE) {
        const batchedSummaries: string[] = [];

        for (let i = 0; i < finalSummaries.length; i += MAX_SUMMARIES_TO_COMBINE) {
            const batch = finalSummaries.slice(i, i + MAX_SUMMARIES_TO_COMBINE);
            const combined = await combineSummaries(batch, contextName, openai, model);
            batchedSummaries.push(combined.summary);
            inputTokens += combined.input;
            outputTokens += combined.output;
        }

        finalSummaries = batchedSummaries;
    }

    // Final combination
    if (finalSummaries.length > 1) {
        const final = await combineSummaries(finalSummaries, contextName, openai, model);
        inputTokens += final.input;
        outputTokens += final.output;
        return { summary: final.summary, input: inputTokens, output: outputTokens };
    }

    return {
        summary: finalSummaries[0],
        input: inputTokens,
        output: outputTokens
    };
}

/**
 * Combine multiple summaries into one
 */
async function combineSummaries(
    summaries: string[],
    contextName: string,
    openai: OpenAI,
    model: ModelName
): Promise<{
    summary: string;
    input: number;
    output: number;
}> {
    const prompt = generateCombineSummariesPrompt(summaries, contextName);

    const response = await retry(
        () => openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: CHUNK_COMBINE_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
        }),
        { maxRetries: MAX_RETRIES }
    );

    return {
        summary: response.choices[0]?.message?.content || summaries.join('\n'),
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
    };
}

/**
 * Parse the analysis response with fallbacks
 */
function parseAnalysisResponse(
    response: string,
    repo: ProcessedRepository
): RepositoryAnalysis {
    // Default analysis structure
    const defaultAnalysis: RepositoryAnalysis = {
        projectName: repo.name,
        oneLiner: repo.description || `A ${repo.primaryLanguage || 'software'} project`,
        detailedSummary: repo.description || 'No detailed description available.',
        problemSolved: 'Not specified',
        technologies: repo.languages,
        skillsDemonstrated: [],
        complexityScore: 5,
        projectType: 'other',
        achievements: [],
        resumeBulletPoints: [`Developed ${repo.name} using ${repo.languages.join(', ')}`],
    };

    try {
        // Try to parse JSON
        const parsed = JSON.parse(response);

        // Validate and merge with defaults
        return {
            projectName: parsed.projectName || defaultAnalysis.projectName,
            oneLiner: parsed.oneLiner || defaultAnalysis.oneLiner,
            detailedSummary: parsed.detailedSummary || defaultAnalysis.detailedSummary,
            problemSolved: parsed.problemSolved || defaultAnalysis.problemSolved,
            technologies: Array.isArray(parsed.technologies)
                ? parsed.technologies
                : defaultAnalysis.technologies,
            skillsDemonstrated: Array.isArray(parsed.skillsDemonstrated)
                ? parsed.skillsDemonstrated
                : defaultAnalysis.skillsDemonstrated,
            complexityScore: typeof parsed.complexityScore === 'number'
                ? Math.min(10, Math.max(1, parsed.complexityScore))
                : defaultAnalysis.complexityScore,
            projectType: validateProjectType(parsed.projectType)
                || inferProjectType(repo),
            achievements: Array.isArray(parsed.achievements)
                ? parsed.achievements
                : defaultAnalysis.achievements,
            resumeBulletPoints: Array.isArray(parsed.resumeBulletPoints)
                ? parsed.resumeBulletPoints
                : defaultAnalysis.resumeBulletPoints,
        };
    } catch (error) {
        console.error('Failed to parse analysis response:', error);
        return defaultAnalysis;
    }
}

/**
 * Validate project type
 */
function validateProjectType(
    type: string
): RepositoryAnalysis['projectType'] | null {
    const validTypes = ['web', 'api', 'ml', 'mobile', 'cli', 'library', 'devops', 'other'];
    return validTypes.includes(type)
        ? type as RepositoryAnalysis['projectType']
        : null;
}

/**
 * Infer project type from repository data
 */
function inferProjectType(repo: ProcessedRepository): RepositoryAnalysis['projectType'] {
    const langs = repo.languages.map(l => l.toLowerCase());
    const topics = repo.topics.map(t => t.toLowerCase());
    const name = repo.name.toLowerCase();
    const desc = (repo.description || '').toLowerCase();

    // Check for ML/AI
    if (
        langs.includes('jupyter notebook') ||
        topics.some(t => ['machine-learning', 'ml', 'ai', 'deep-learning', 'tensorflow', 'pytorch'].includes(t)) ||
        desc.includes('machine learning') ||
        desc.includes('neural network')
    ) {
        return 'ml';
    }

    // Check for mobile
    if (
        langs.includes('swift') ||
        langs.includes('kotlin') ||
        langs.includes('dart') ||
        topics.some(t => ['android', 'ios', 'flutter', 'react-native', 'mobile'].includes(t))
    ) {
        return 'mobile';
    }

    // Check for CLI
    if (
        name.includes('cli') ||
        topics.includes('cli') ||
        topics.includes('command-line')
    ) {
        return 'cli';
    }

    // Check for library
    if (
        name.includes('lib') ||
        topics.includes('library') ||
        topics.includes('package') ||
        topics.includes('npm')
    ) {
        return 'library';
    }

    // Check for DevOps
    if (
        topics.some(t => ['docker', 'kubernetes', 'devops', 'infrastructure', 'terraform'].includes(t))
    ) {
        return 'devops';
    }

    // Check for API
    if (
        name.includes('api') ||
        topics.includes('api') ||
        topics.includes('rest') ||
        topics.includes('graphql')
    ) {
        return 'api';
    }

    // Default to web for common web languages
    if (
        langs.includes('javascript') ||
        langs.includes('typescript') ||
        langs.includes('html') ||
        topics.some(t => ['react', 'vue', 'angular', 'nextjs', 'website', 'webapp'].includes(t))
    ) {
        return 'web';
    }

    return 'other';
}
