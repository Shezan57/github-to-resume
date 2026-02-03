/**
 * LLM Prompts for Repository Analysis and Resume Generation
 * 
 * These prompts are carefully designed to:
 * 1. Extract maximum value from limited context
 * 2. Generate consistent, parseable JSON output
 * 3. Focus on resume-relevant information
 */

import { ProcessedRepository, RepositoryContent, ProcessedUser, RepositoryAnalysis } from '@/types';

/**
 * System prompt for repository analysis
 */
export const REPO_ANALYSIS_SYSTEM_PROMPT = `You are a technical resume writer and senior software engineer analyzing GitHub repositories. Your goal is to extract key information that would impress hiring managers at top tech companies.

Focus on:
- What the project DOES (not just what technologies it uses)
- Quantifiable achievements when possible
- Technical complexity and design decisions
- Problem-solving demonstrated
- Skills that are in demand

Output ONLY valid JSON. No markdown, no explanation, just the JSON object.`;

/**
 * Generate the user prompt for analyzing a single repository
 */
export function generateRepoAnalysisPrompt(
    repo: ProcessedRepository,
    content: RepositoryContent
): string {
    const parts: string[] = [];

    // Repository metadata
    parts.push(`## Repository: ${repo.name}`);
    parts.push(`Description: ${repo.description || 'No description'}`);
    parts.push(`Stars: ${repo.stars} | Forks: ${repo.forks}`);
    parts.push(`Primary Language: ${repo.primaryLanguage || 'Unknown'}`);
    parts.push(`Languages: ${repo.languages.join(', ') || 'None detected'}`);
    parts.push(`Topics: ${repo.topics.join(', ') || 'None'}`);
    parts.push(`Created: ${repo.createdAt} | Last Push: ${repo.pushedAt}`);
    parts.push('');

    // README content
    if (content.readme) {
        parts.push('## README');
        parts.push(content.readme);
        parts.push('');
    }

    // Dependencies (from package.json)
    if (content.packageJson) {
        const pkg = content.packageJson as Record<string, unknown>;
        const deps = {
            ...(pkg.dependencies as Record<string, string> || {}),
            ...(pkg.devDependencies as Record<string, string> || {}),
        };
        const depNames = Object.keys(deps).slice(0, 30); // Limit to top 30
        if (depNames.length > 0) {
            parts.push('## Dependencies');
            parts.push(depNames.join(', '));
            parts.push('');
        }
    }

    // Python requirements
    if (content.requirementsTxt) {
        parts.push('## Python Requirements');
        parts.push(content.requirementsTxt.split('\n').slice(0, 20).join('\n'));
        parts.push('');
    }

    // Config files
    if (content.configFiles.length > 0) {
        parts.push('## Configuration Files');
        for (const config of content.configFiles.slice(0, 5)) {
            parts.push(`### ${config.path} (${config.type})`);
            parts.push(config.content);
            parts.push('');
        }
    }

    // Source code samples
    if (content.sourceFiles.length > 0) {
        parts.push('## Key Source Files');
        for (const file of content.sourceFiles.slice(0, 3)) {
            parts.push(`### ${file.path} (${file.language})`);
            parts.push('```' + file.language);
            parts.push(file.content);
            parts.push('```');
            parts.push('');
        }
    }

    parts.push('---');
    parts.push('');
    parts.push(`Analyze this repository and respond with ONLY this JSON structure (no markdown):
{
  "projectName": "Human-readable project name",
  "oneLiner": "One sentence describing what this project does",
  "detailedSummary": "2-3 sentences with technical depth",
  "problemSolved": "What problem does this solve?",
  "technologies": ["tech1", "tech2", "tech3"],
  "skillsDemonstrated": ["skill1", "skill2"],
  "complexityScore": 7,
  "projectType": "web",
  "achievements": ["Built X that achieved Y", "Implemented Z reducing W by N%"],
  "resumeBulletPoints": [
    "Developed a full-stack web application using React and Node.js, serving 1000+ users",
    "Implemented RESTful API with authentication, reducing response time by 40%"
  ]
}

Guidelines:
- projectType must be one of: web, api, ml, mobile, cli, library, devops, other
- complexityScore: 1-10 based on architecture, code quality, scale
- resumeBulletPoints should be action-oriented: "[Action verb] + [what you did] + [impact/result]"
- achievements should be quantifiable when possible (estimate if needed)
- Extract at least 3-5 technologies and skills`);

    return parts.join('\n');
}

/**
 * System prompt for chunk summarization (hierarchical processing)
 */
export const CHUNK_SUMMARY_SYSTEM_PROMPT = `You are a technical analyst summarizing code repositories. Extract the most important information while preserving technical accuracy.

Focus on:
- Core functionality and purpose
- Key technologies and frameworks
- Notable implementations
- Architecture patterns

Be concise but comprehensive. Output plain text summary, not JSON.`;

/**
 * Generate prompt for summarizing large file chunks
 */
export function generateChunkSummaryPrompt(
    chunkContent: string,
    chunkIndex: number,
    totalChunks: number,
    repoName: string
): string {
    return `Summarize this code/documentation chunk from the "${repoName}" repository.
This is chunk ${chunkIndex + 1} of ${totalChunks}.

---
${chunkContent}
---

Provide a concise summary (2-4 sentences) capturing the key technical details.`;
}

/**
 * System prompt for combining chunk summaries
 */
export const CHUNK_COMBINE_SYSTEM_PROMPT = `You are a technical writer combining multiple summaries into a cohesive overview of a code repository.

Create a unified summary that:
- Removes redundancy
- Preserves unique technical details
- Maintains coherent structure
- Focuses on resume-relevant information

Output plain text summary.`;

/**
 * Generate prompt for combining multiple chunk summaries
 */
export function generateCombineSummariesPrompt(
    summaries: string[],
    repoName: string
): string {
    return `Combine these ${summaries.length} summaries of the "${repoName}" repository into a single cohesive overview:

${summaries.map((s, i) => `Summary ${i + 1}:\n${s}`).join('\n\n')}

---

Provide a unified summary (4-6 sentences) that captures all key technical details without redundancy.`;
}

/**
 * System prompt for final resume generation
 */
export const RESUME_GENERATION_SYSTEM_PROMPT = `You are an expert resume writer specializing in software engineering positions. Create professional, compelling resumes that pass ATS systems and impress human reviewers.

Guidelines:
- Use strong action verbs (Developed, Implemented, Architected, Optimized, Led)
- Quantify achievements when possible (users, performance, reduction %)
- Focus on impact, not just responsibilities
- Keep bullet points concise (1-2 lines each)
- Prioritize most impressive projects
- Infer a suitable professional title from the projects
- Create a compelling professional summary

Output ONLY valid JSON. No markdown, no explanation.`;

/**
 * Generate the final resume synthesis prompt
 */
export function generateResumeSynthesisPrompt(
    user: ProcessedUser,
    analyses: RepositoryAnalysis[]
): string {
    const parts: string[] = [];

    parts.push('## GitHub Profile Information');
    parts.push(`Name: ${user.name || user.username}`);
    if (user.bio) parts.push(`Bio: ${user.bio}`);
    if (user.location) parts.push(`Location: ${user.location}`);
    if (user.company) parts.push(`Company: ${user.company}`);
    if (user.email) parts.push(`Email: ${user.email}`);
    if (user.blog) parts.push(`Website: ${user.blog}`);
    if (user.twitter) parts.push(`Twitter: @${user.twitter}`);
    parts.push(`GitHub: github.com/${user.username}`);
    parts.push(`Public Repositories: ${user.publicRepos}`);
    parts.push(`Followers: ${user.followers}`);
    parts.push('');

    parts.push('## Analyzed Projects');
    parts.push('');

    for (const analysis of analyses) {
        parts.push(`### ${analysis.projectName}`);
        parts.push(`Type: ${analysis.projectType} | Complexity: ${analysis.complexityScore}/10`);
        parts.push(`Summary: ${analysis.detailedSummary}`);
        parts.push(`Technologies: ${analysis.technologies.join(', ')}`);
        parts.push(`Skills: ${analysis.skillsDemonstrated.join(', ')}`);
        parts.push('Achievements:');
        for (const achievement of analysis.achievements) {
            parts.push(`- ${achievement}`);
        }
        parts.push('Resume Bullets:');
        for (const bullet of analysis.resumeBulletPoints) {
            parts.push(`- ${bullet}`);
        }
        parts.push('');
    }

    parts.push('---');
    parts.push('');
    parts.push(`Generate a professional software engineer resume in this exact JSON format:
{
  "header": {
    "name": "${user.name || user.username}",
    "title": "Suggested job title based on projects",
    "email": "${user.email || ''}",
    "location": "${user.location || ''}",
    "github": "github.com/${user.username}",
    "linkedin": "",
    "portfolio": "${user.blog || ''}"
  },
  "summary": "3-4 sentence professional summary highlighting key strengths",
  "skills": {
    "languages": ["Programming languages extracted from projects"],
    "frameworks": ["Frameworks and libraries"],
    "databases": ["Databases if any"],
    "tools": ["Development tools, CI/CD, cloud"],
    "concepts": ["Software concepts: REST API, Microservices, etc."]
  },
  "projects": [
    {
      "name": "Project Name",
      "url": "github.com/user/repo",
      "description": "Brief project description",
      "technologies": ["tech1", "tech2"],
      "bullets": [
        "Action-oriented bullet point 1",
        "Action-oriented bullet point 2"
      ]
    }
  ]
}

IMPORTANT:
- Include TOP 6-8 most impressive/relevant projects
- Order projects by impact/complexity (most impressive first)
- Deduplicate skills across all projects
- Order skills by importance/frequency
- Infer appropriate job title (Full Stack Developer, Backend Engineer, ML Engineer, etc.)
- Make summary compelling and specific to this developer's strengths`);

    return parts.join('\n');
}

/**
 * System prompt for enhancing individual bullet points
 */
export const BULLET_ENHANCE_SYSTEM_PROMPT = `You are a resume writing expert. Your task is to improve resume bullet points to be more impactful and ATS-friendly.

Guidelines:
- Start with strong action verb
- Quantify when possible
- Show impact, not just responsibility
- Keep concise (1-2 lines)
- Use industry-standard terminology

Output only the improved bullet point, no explanation.`;

/**
 * Generate prompt for enhancing a bullet point
 */
export function generateBulletEnhancePrompt(
    bullet: string,
    context?: string
): string {
    let prompt = `Improve this resume bullet point:\n"${bullet}"`;

    if (context) {
        prompt += `\n\nContext: ${context}`;
    }

    prompt += '\n\nProvide the improved version only.';

    return prompt;
}

/**
 * Role-specific keywords for ATS optimization
 */
export const ROLE_KEYWORDS: Record<string, string[]> = {
    'software-engineer': [
        'software development', 'algorithms', 'data structures', 'system design',
        'code review', 'debugging', 'testing', 'agile', 'scrum', 'version control',
        'performance optimization', 'scalability', 'clean code'
    ],
    'frontend-developer': [
        'React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
        'responsive design', 'UI/UX', 'accessibility', 'web performance',
        'component architecture', 'state management', 'REST API integration'
    ],
    'backend-developer': [
        'API design', 'RESTful services', 'databases', 'SQL', 'NoSQL',
        'microservices', 'server-side development', 'authentication',
        'authorization', 'caching', 'message queues', 'scalability'
    ],
    'fullstack-developer': [
        'full stack development', 'frontend', 'backend', 'databases',
        'deployment', 'cloud services', 'DevOps', 'API development',
        'end-to-end development', 'system integration'
    ],
    'devops-engineer': [
        'CI/CD', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
        'infrastructure as code', 'Terraform', 'monitoring', 'logging',
        'automation', 'shell scripting', 'security'
    ],
    'mobile-developer': [
        'iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin',
        'mobile UI/UX', 'app store deployment', 'push notifications',
        'offline storage', 'performance optimization'
    ],
    'data-scientist': [
        'machine learning', 'statistics', 'Python', 'R', 'data analysis',
        'data visualization', 'predictive modeling', 'feature engineering',
        'A/B testing', 'experimental design', 'SQL'
    ],
    'data-analyst': [
        'SQL', 'Excel', 'data visualization', 'Tableau', 'Power BI',
        'reporting', 'business intelligence', 'analytics', 'dashboards',
        'data cleaning', 'statistical analysis'
    ],
    'ml-engineer': [
        'deep learning', 'TensorFlow', 'PyTorch', 'model deployment',
        'MLOps', 'neural networks', 'NLP', 'computer vision',
        'model optimization', 'feature engineering', 'data pipelines'
    ],
    'ai-researcher': [
        'research', 'publications', 'NLP', 'computer vision',
        'reinforcement learning', 'transformers', 'novel architectures',
        'experimentation', 'benchmarking', 'state-of-the-art'
    ],
    'phd-application': [
        'research experience', 'publications', 'thesis', 'academic',
        'teaching assistant', 'grants', 'collaboration', 'methodology',
        'literature review', 'experimental design'
    ],
    'research-fellowship': [
        'research', 'publications', 'grants', 'collaboration',
        'presentations', 'peer review', 'academic writing',
        'interdisciplinary', 'impact'
    ],
    'scholarship': [
        'academic excellence', 'leadership', 'community service',
        'extracurricular activities', 'achievements', 'GPA',
        'awards', 'volunteer work', 'initiative'
    ],
    'technical-pm': [
        'product strategy', 'roadmap', 'stakeholder management',
        'agile methodology', 'technical leadership', 'requirements gathering',
        'cross-functional collaboration', 'metrics', 'OKRs'
    ],
    'engineering-manager': [
        'team leadership', 'mentoring', 'project management',
        'agile', 'technical vision', 'hiring', 'performance reviews',
        'sprint planning', 'resource allocation', 'technical decisions'
    ],
};

/**
 * Generate role-aware system prompt for resume generation
 */
export function generateRoleAwareSystemPrompt(
    targetRole?: string,
    customRole?: string
): string {
    const basePrompt = `You are an expert resume writer specializing in creating ATS-optimized resumes for tech professionals.`;

    const roleTitle = customRole || targetRole || 'software engineering positions';

    let roleGuidelines = `
Create a professional, compelling resume targeting ${roleTitle} positions.

Guidelines:
- Use strong action verbs (Developed, Implemented, Architected, Optimized, Led)
- Quantify achievements when possible (users, performance, reduction %)
- Focus on impact, not just responsibilities
- Keep bullet points concise (1-2 lines each)
- Prioritize projects most relevant to ${roleTitle}
- Use industry-standard terminology for ${roleTitle}`;

    // Add role-specific keywords if available
    if (targetRole && ROLE_KEYWORDS[targetRole]) {
        const keywords = ROLE_KEYWORDS[targetRole];
        roleGuidelines += `

ATS Keywords to incorporate naturally:
${keywords.join(', ')}`;
    }

    roleGuidelines += `

Output ONLY valid JSON. No markdown, no explanation.`;

    return basePrompt + roleGuidelines;
}

/**
 * Generate role-targeted resume synthesis prompt
 */
export function generateRoleTargetedResumeSynthesisPrompt(
    user: ProcessedUser,
    analyses: RepositoryAnalysis[],
    targetRole?: string,
    customRole?: string
): string {
    const parts: string[] = [];

    const roleTitle = customRole || targetRole || 'Software Engineer';

    parts.push(`## Target Position: ${roleTitle}`);
    parts.push('');
    parts.push('## GitHub Profile Information');
    parts.push(`Name: ${user.name || user.username}`);
    if (user.bio) parts.push(`Bio: ${user.bio}`);
    if (user.location) parts.push(`Location: ${user.location}`);
    if (user.company) parts.push(`Company: ${user.company}`);
    if (user.email) parts.push(`Email: ${user.email}`);
    if (user.blog) parts.push(`Website: ${user.blog}`);
    if (user.twitter) parts.push(`Twitter: @${user.twitter}`);
    parts.push(`GitHub: github.com/${user.username}`);
    parts.push(`Public Repositories: ${user.publicRepos}`);
    parts.push(`Followers: ${user.followers}`);
    parts.push('');

    parts.push('## Analyzed Projects');
    parts.push('');

    for (const analysis of analyses) {
        parts.push(`### ${analysis.projectName}`);
        parts.push(`Type: ${analysis.projectType} | Complexity: ${analysis.complexityScore}/10`);
        parts.push(`Summary: ${analysis.detailedSummary}`);
        parts.push(`Technologies: ${analysis.technologies.join(', ')}`);
        parts.push(`Skills: ${analysis.skillsDemonstrated.join(', ')}`);
        parts.push('Achievements:');
        for (const achievement of analysis.achievements) {
            parts.push(`- ${achievement}`);
        }
        parts.push('Resume Bullets:');
        for (const bullet of analysis.resumeBulletPoints) {
            parts.push(`- ${bullet}`);
        }
        parts.push('');
    }

    parts.push('---');
    parts.push('');
    parts.push(`Generate a professional resume optimized for "${roleTitle}" positions in this exact JSON format:
{
  "header": {
    "name": "${user.name || user.username}",
    "title": "${roleTitle}",
    "email": "${user.email || ''}",
    "location": "${user.location || ''}",
    "github": "github.com/${user.username}",
    "linkedin": "",
    "portfolio": "${user.blog || ''}"
  },
  "summary": "3-4 sentence professional summary tailored for ${roleTitle} positions, highlighting relevant strengths",
  "skills": {
    "languages": ["Programming languages most relevant to ${roleTitle}"],
    "frameworks": ["Frameworks and libraries relevant to ${roleTitle}"],
    "databases": ["Databases if relevant"],
    "tools": ["Development tools, CI/CD, cloud relevant to ${roleTitle}"],
    "concepts": ["Software concepts relevant to ${roleTitle}"]
  },
  "projects": [
    {
      "name": "Project Name",
      "url": "github.com/user/repo",
      "description": "Brief project description emphasizing relevance to ${roleTitle}",
      "technologies": ["tech1", "tech2"],
      "bullets": [
        "Action-oriented bullet point highlighting skills for ${roleTitle}",
        "Another relevant achievement"
      ]
    }
  ]
}

IMPORTANT:
- Prioritize projects most relevant to ${roleTitle}
- Include TOP 6-8 most impressive/relevant projects
- Tailor bullet points to emphasize ${roleTitle} skills
- Use terminology and keywords common in ${roleTitle} job descriptions
- Make summary specifically compelling for ${roleTitle} recruiters`);

    return parts.join('\n');
}
