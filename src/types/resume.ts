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

export interface ResumeSkills {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  concepts: string[];
}

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
  | 'certifications';
