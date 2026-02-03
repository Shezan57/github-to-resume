/**
 * README Generator
 * 
 * Uses LLM to generate professional README files from repository metadata
 */

import { getOpenAIClient, LLM_DEFAULT_MODEL } from './openai';
import type { TokenUsage } from '../tokens';

interface RepoContext {
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    homepage: string | null;
    structure: {
        tree: string[];
        languages: string[];
        hasPackageJson: boolean;
        hasRequirements: boolean;
        hasDockerfile: boolean;
        mainFiles: string[];
    };
}

interface GenerateReadmeResult {
    readme: string;
    tokenUsage: TokenUsage;
}

const README_SYSTEM_PROMPT = `You are an expert technical writer who creates professional README.md files for GitHub repositories.

Generate a clear, well-structured README that includes:
1. Project title and description
2. Key features (based on the code structure)
3. Tech stack
4. Installation instructions (based on detected package manager)
5. Usage examples (if possible)
6. Project structure overview
7. Contributing guidelines (brief)
8. License placeholder

Guidelines:
- Use proper markdown formatting with headers, code blocks, and badges
- Be concise but informative
- Infer the project's purpose from its name, description, and file structure
- Include relevant emoji for visual appeal
- Make it professional and welcoming to contributors`;

function createReadmePrompt(context: RepoContext): string {
    const structureInfo = context.structure;

    let techStack = context.language ? [context.language] : [];
    techStack = [...new Set([...techStack, ...structureInfo.languages])];

    const packageManager = structureInfo.hasPackageJson ? 'npm/yarn' :
        structureInfo.hasRequirements ? 'pip' : 'unknown';

    return `Generate a README.md for this repository:

**Repository Name:** ${context.name}
**Description:** ${context.description || 'No description provided'}
**Primary Language:** ${context.language || 'Unknown'}
**Topics/Tags:** ${context.topics.length > 0 ? context.topics.join(', ') : 'None'}
**Homepage/Demo:** ${context.homepage || 'Not provided'}

**Detected Tech Stack:** ${techStack.join(', ') || 'Unknown'}
**Package Manager:** ${packageManager}
**Has Docker:** ${structureInfo.hasDockerfile ? 'Yes' : 'No'}

**Key Files:**
${structureInfo.mainFiles.length > 0
            ? structureInfo.mainFiles.map(f => `- ${f}`).join('\n')
            : '- No main files detected'}

**File Structure (sample):**
\`\`\`
${structureInfo.tree.slice(0, 20).join('\n')}
${structureInfo.tree.length > 20 ? `... and ${structureInfo.tree.length - 20} more files` : ''}
\`\`\`

Generate a professional README.md for this project. Output only the markdown content, nothing else.`;
}

export async function generateReadme(
    context: RepoContext,
    options: { apiKey?: string; verbose?: boolean } = {}
): Promise<GenerateReadmeResult> {
    const client = getOpenAIClient(options.apiKey);

    const prompt = createReadmePrompt(context);

    if (options.verbose) {
        console.log('[README Generator] Generating README for:', context.name);
    }

    const response = await client.chat.completions.create({
        model: LLM_DEFAULT_MODEL,
        messages: [
            { role: 'system', content: README_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    });

    const readme = response.choices[0]?.message?.content || '# README\n\nNo content generated.';

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Estimate cost (GPT-4o-mini pricing)
    const inputCost = (inputTokens / 1000) * 0.00015;
    const outputCost = (outputTokens / 1000) * 0.0006;
    const estimatedCost = inputCost + outputCost;

    return {
        readme,
        tokenUsage: {
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCost,
        },
    };
}
