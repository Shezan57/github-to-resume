// GitHub API response types

export interface GitHubUser {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    company: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
}

export interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
    languages_url: string;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    topics: string[];
    fork: boolean;
    archived: boolean;
    disabled: boolean;
    visibility: string;
    pushed_at: string;
    created_at: string;
    updated_at: string;
    size: number;
    default_branch: string;
}

export interface GitHubLanguages {
    [language: string]: number; // bytes of code
}

export interface GitHubContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir' | 'symlink' | 'submodule';
    content?: string; // Base64 encoded
    encoding?: string;
}

export interface GitHubTreeItem {
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
}

export interface GitHubTree {
    sha: string;
    url: string;
    tree: GitHubTreeItem[];
    truncated: boolean;
}

// Processed data types for our app
export interface ProcessedRepository {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    homepage: string | null;
    languages: string[];
    languageBytes: Record<string, number>;
    primaryLanguage: string | null;
    stars: number;
    forks: number;
    topics: string[];
    isFork: boolean;
    isArchived: boolean;
    pushedAt: string;
    createdAt: string;
    size: number;
}

export interface RepositoryContent {
    readme: string | null;
    packageJson: Record<string, unknown> | null;
    requirementsTxt: string | null;
    sourceFiles: Array<{
        path: string;
        content: string;
        language: string;
    }>;
    configFiles: Array<{
        path: string;
        content: string;
        type: string;
    }>;
}

export interface RepositoryAnalysis {
    projectName: string;
    oneLiner: string;
    detailedSummary: string;
    problemSolved: string;
    technologies: string[];
    skillsDemonstrated: string[];
    complexityScore: number;
    projectType: 'web' | 'api' | 'ml' | 'mobile' | 'cli' | 'library' | 'devops' | 'other';
    achievements: string[];
    resumeBulletPoints: string[];
}

export interface ProcessedUser {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
    profileUrl: string;
    bio: string | null;
    location: string | null;
    blog: string | null;
    twitter: string | null;
    company: string | null;
    publicRepos: number;
    followers: number;
}

// Analysis job status
export type AnalysisStatus =
    | 'queued'
    | 'fetching_profile'
    | 'fetching_repos'
    | 'analyzing_repos'
    | 'generating_resume'
    | 'completed'
    | 'failed';

export interface AnalysisJob {
    id: string;
    username: string;
    status: AnalysisStatus;
    progress: {
        current: number;
        total: number;
        currentRepo?: string;
        message?: string;
    };
    user?: ProcessedUser;
    repositories?: ProcessedRepository[];
    analyses?: RepositoryAnalysis[];
    resume?: import('./resume').Resume;
    error?: string;
    createdAt: string;
    updatedAt: string;
}
