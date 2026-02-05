// Resume data structure types

export interface ResumeHeader {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  avatar?: string;
}

// Skill category for dynamic skills
export interface SkillCategory {
  id: string;
  name: string;  // e.g., "Programming Languages", "Cloud Services"
  items: string[];
}

export interface ResumeSkills {
  categories: SkillCategory[];
}

// Default skill categories (for backwards compatibility)
export const DEFAULT_SKILL_CATEGORIES: SkillCategory[] = [
  { id: 'languages', name: 'Languages', items: [] },
  { id: 'frameworks', name: 'Frameworks', items: [] },
  { id: 'databases', name: 'Databases', items: [] },
  { id: 'tools', name: 'Tools', items: [] },
];

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  url?: string;
  description: string;
  technologies: string[];
  bullets: string[];
  dateRange?: string;
  repoId?: string; // Link to GitHub repo
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate?: string;
  gpa?: string;
  highlights?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

// Custom section for user-defined content (like Europass)
export interface CustomSectionItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  url?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  icon?: string; // emoji or icon name
  type: 'list' | 'text' | 'bullets' | 'items';
  content: string | string[] | CustomSectionItem[];
  visible: boolean;
}

// Predefined custom section templates
export const CUSTOM_SECTION_TEMPLATES = [
  { id: 'languages', title: 'Languages', icon: '🌐', type: 'list' as const },
  { id: 'publications', title: 'Publications', icon: '📄', type: 'items' as const },
  { id: 'awards', title: 'Awards & Honors', icon: '🏆', type: 'items' as const },
  { id: 'volunteer', title: 'Volunteer Experience', icon: '🤝', type: 'items' as const },
  { id: 'interests', title: 'Interests', icon: '⭐', type: 'list' as const },
  { id: 'references', title: 'References', icon: '👤', type: 'text' as const },
  { id: 'courses', title: 'Relevant Courses', icon: '📚', type: 'list' as const },
  { id: 'patents', title: 'Patents', icon: '💡', type: 'items' as const },
  { id: 'speaking', title: 'Speaking & Presentations', icon: '🎤', type: 'items' as const },
  { id: 'custom', title: 'Custom Section', icon: '📝', type: 'text' as const },
];

export interface ResumeMetadata {
  createdAt: string;
  updatedAt: string;
  generatedFrom?: {
    githubUsername: string;
    reposAnalyzed: number;
    generatedAt: string;
  };
}

export interface Resume {
  id: string;
  userId: string;
  template: 'modern' | 'classic' | 'minimal' | 'creative';
  header: ResumeHeader;
  summary: string;
  skills: ResumeSkills;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications?: CertificationItem[];
  customSections: CustomSection[];
  sectionOrder: string[]; // Controls display order of all sections
  sectionVisibility: Record<string, boolean>; // Controls which sections are visible
  metadata: ResumeMetadata;
}

// Template type
export type ResumeTemplate = 'modern' | 'classic' | 'minimal' | 'creative';

// Resume section types for editing
export type ResumeSectionType =
  | 'header'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'custom';

// Default section order
export const DEFAULT_SECTION_ORDER = [
  'header',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
];

// Default section visibility (all visible by default)
export const DEFAULT_SECTION_VISIBILITY: Record<string, boolean> = {
  header: true,
  summary: true,
  skills: true,
  experience: true,
  projects: true,
  education: true,
  certifications: true,
};


