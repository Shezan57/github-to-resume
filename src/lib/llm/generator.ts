/**
 * Resume Generator
 * 
 * Synthesizes analyzed repository data into a complete resume structure
 */

import type OpenAI from 'openai';
import { getOpenAIClient, LLM_DEFAULT_MODEL, LLM_SYNTHESIS_MODEL } from './openai';
import {
    RESUME_GENERATION_SYSTEM_PROMPT,
    BULLET_ENHANCE_SYSTEM_PROMPT,
    generateResumeSynthesisPrompt,
    generateBulletEnhancePrompt,
} from './prompts';
import {
    countTokens,
    getAvailableTokens,
    truncateToTokenLimit,
    calculateCost,
    type ModelName,
    type TokenUsage,
} from '../tokens';
import {
    ProcessedUser,
    RepositoryAnalysis,
    Resume,
    ResumeHeader,
    ResumeSkills,
    ProjectItem,
} from '@/types';
import { retry, generateId, unique } from '../utils';

const MAX_RETRIES = 3;

interface GeneratorOptions {
    apiKey?: string;
    model?: ModelName;
    verbose?: boolean;
    onProgress?: (message: string) => void;
}

interface GenerationResult {
    resume: Resume;
    tokenUsage: TokenUsage;
}

/**
 * Generate a complete resume from user profile and project analyses
 */
export async function generateResume(
    user: ProcessedUser,
    analyses: RepositoryAnalysis[],
    options: GeneratorOptions = {}
): Promise<GenerationResult> {
    const {
        apiKey,
        model = LLM_SYNTHESIS_MODEL as ModelName,
        verbose = false,
        onProgress,
    } = options;

    const openai = getOpenAIClient(apiKey);
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const log = (msg: string) => {
        if (verbose) console.log(`[Generator] ${msg}`);
        if (onProgress) onProgress(msg);
    };

    log('Generating resume from analyzed projects...');

    // Sort analyses by complexity/impact
    const sortedAnalyses = [...analyses].sort(
        (a, b) => b.complexityScore - a.complexityScore
    );

    // Generate the synthesis prompt
    const userPrompt = generateResumeSynthesisPrompt(user, sortedAnalyses);
    const promptTokens = countTokens(userPrompt);

    log(`Synthesis prompt tokens: ${promptTokens}`);

    // Truncate if needed
    const availableTokens = getAvailableTokens(model);
    const maxPromptTokens = availableTokens - countTokens(RESUME_GENERATION_SYSTEM_PROMPT) - 2000;

    const finalPrompt = promptTokens > maxPromptTokens
        ? truncateToTokenLimit(userPrompt, maxPromptTokens)
        : userPrompt;

    // Call LLM for resume generation
    const response = await retry(
        () => openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: RESUME_GENERATION_SYSTEM_PROMPT },
                { role: 'user', content: finalPrompt },
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' },
        }),
        { maxRetries: MAX_RETRIES }
    );

    totalInputTokens += response.usage?.prompt_tokens || 0;
    totalOutputTokens += response.usage?.completion_tokens || 0;

    // Parse the response
    const responseText = response.choices[0]?.message?.content || '';
    const resume = parseResumeResponse(responseText, user, analyses);

    log('Resume generation complete!');

    return {
        resume,
        tokenUsage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            estimatedCost: calculateCost(totalInputTokens, totalOutputTokens, model),
        },
    };
}

/**
 * Enhance a single bullet point using AI
 */
export async function enhanceBulletPoint(
    bullet: string,
    context?: string,
    options: GeneratorOptions = {}
): Promise<{
    enhanced: string;
    tokenUsage: TokenUsage;
}> {
    const { apiKey, model = LLM_DEFAULT_MODEL as ModelName } = options;
    const openai = getOpenAIClient(apiKey);

    const prompt = generateBulletEnhancePrompt(bullet, context);

    const response = await retry(
        () => openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: BULLET_ENHANCE_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 200,
        }),
        { maxRetries: MAX_RETRIES }
    );

    const enhanced = response.choices[0]?.message?.content?.trim() || bullet;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
        enhanced,
        tokenUsage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            estimatedCost: calculateCost(inputTokens, outputTokens, model),
        },
    };
}

/**
 * Parse the resume response with fallbacks
 */
function parseResumeResponse(
    response: string,
    user: ProcessedUser,
    analyses: RepositoryAnalysis[]
): Resume {
    const now = new Date().toISOString();

    // Default resume structure
    const defaultResume: Resume = {
        id: generateId(),
        userId: user.id.toString(),
        template: 'modern',
        header: createDefaultHeader(user),
        summary: createDefaultSummary(user, analyses),
        skills: extractSkills(analyses),
        experience: [],
        projects: createDefaultProjects(analyses),
        education: [],
        certifications: [],
        metadata: {
            createdAt: now,
            updatedAt: now,
            generatedFrom: {
                githubUsername: user.username,
                reposAnalyzed: analyses.length,
                generatedAt: now,
            },
        },
    };

    try {
        const parsed = JSON.parse(response);

        // Merge parsed data with defaults
        return {
            ...defaultResume,
            header: {
                ...defaultResume.header,
                ...parsed.header,
                name: parsed.header?.name || user.name || user.username,
            },
            summary: parsed.summary || defaultResume.summary,
            skills: {
                languages: Array.isArray(parsed.skills?.languages)
                    ? parsed.skills.languages
                    : defaultResume.skills.languages,
                frameworks: Array.isArray(parsed.skills?.frameworks)
                    ? parsed.skills.frameworks
                    : defaultResume.skills.frameworks,
                databases: Array.isArray(parsed.skills?.databases)
                    ? parsed.skills.databases
                    : defaultResume.skills.databases,
                tools: Array.isArray(parsed.skills?.tools)
                    ? parsed.skills.tools
                    : defaultResume.skills.tools,
                concepts: Array.isArray(parsed.skills?.concepts)
                    ? parsed.skills.concepts
                    : defaultResume.skills.concepts,
            },
            projects: Array.isArray(parsed.projects)
                ? parsed.projects.map((p: Partial<ProjectItem>) => ({
                    id: generateId(),
                    name: p.name || 'Unnamed Project',
                    url: p.url || '',
                    description: p.description || '',
                    technologies: Array.isArray(p.technologies) ? p.technologies : [],
                    bullets: Array.isArray(p.bullets) ? p.bullets : [],
                    dateRange: p.dateRange,
                    repoId: p.repoId,
                }))
                : defaultResume.projects,
        };
    } catch (error) {
        console.error('Failed to parse resume response:', error);
        return defaultResume;
    }
}

/**
 * Create default header from user profile
 */
function createDefaultHeader(user: ProcessedUser): ResumeHeader {
    return {
        name: user.name || user.username,
        title: 'Software Developer',
        email: user.email || '',
        location: user.location || '',
        github: `github.com/${user.username}`,
        linkedin: '',
        portfolio: user.blog || '',
        avatar: user.avatarUrl,
    };
}

/**
 * Create default summary from analyses
 */
function createDefaultSummary(
    user: ProcessedUser,
    analyses: RepositoryAnalysis[]
): string {
    const projectTypes = unique(analyses.map(a => a.projectType));
    const topTech = unique(analyses.flatMap(a => a.technologies)).slice(0, 5);

    const typeLabels: Record<string, string> = {
        web: 'web applications',
        api: 'backend services',
        ml: 'machine learning solutions',
        mobile: 'mobile applications',
        cli: 'command-line tools',
        library: 'software libraries',
        devops: 'DevOps infrastructure',
        other: 'software projects',
    };

    const focusAreas = projectTypes
        .slice(0, 2)
        .map(t => typeLabels[t] || 'software projects')
        .join(' and ');

    return `Passionate software developer with experience building ${focusAreas}. ` +
        `Proficient in ${topTech.join(', ')}. ` +
        `${user.bio || `Active open-source contributor with ${user.publicRepos} public repositories.`}`;
}

/**
 * Extract and categorize skills from analyses
 */
function extractSkills(analyses: RepositoryAnalysis[]): ResumeSkills {
    const allTech = analyses.flatMap(a => a.technologies);
    const allSkills = analyses.flatMap(a => a.skillsDemonstrated);

    // Common categorization
    const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
        'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'HTML', 'CSS'];
    const frameworks = ['React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express',
        'Django', 'Flask', 'FastAPI', 'Spring', 'Rails', 'Laravel', 'Flutter',
        'React Native', 'TensorFlow', 'PyTorch', 'Tailwind', 'Bootstrap'];
    const databases = ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
        'Elasticsearch', 'DynamoDB', 'Firebase', 'Supabase'];
    const tools = ['Git', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
        'GitHub Actions', 'Jenkins', 'Terraform', 'Webpack', 'Vite', 'npm', 'yarn'];

    const categorize = (items: string[], category: string[]): string[] => {
        return unique(
            items.filter(item =>
                category.some(c =>
                    item.toLowerCase().includes(c.toLowerCase()) ||
                    c.toLowerCase().includes(item.toLowerCase())
                )
            )
        ).slice(0, 8);
    };

    const allItems = [...allTech, ...allSkills];

    return {
        languages: categorize(allItems, languages),
        frameworks: categorize(allItems, frameworks),
        databases: categorize(allItems, databases),
        tools: categorize(allItems, tools),
        concepts: unique(allSkills.filter(s =>
            !languages.some(l => s.toLowerCase().includes(l.toLowerCase())) &&
            !frameworks.some(f => s.toLowerCase().includes(f.toLowerCase()))
        )).slice(0, 8),
    };
}

/**
 * Create default projects from analyses
 */
function createDefaultProjects(analyses: RepositoryAnalysis[]): ProjectItem[] {
    return analyses.slice(0, 8).map(analysis => ({
        id: generateId(),
        name: analysis.projectName,
        url: '',
        description: analysis.oneLiner,
        technologies: analysis.technologies.slice(0, 5),
        bullets: analysis.resumeBulletPoints.slice(0, 3),
    }));
}
