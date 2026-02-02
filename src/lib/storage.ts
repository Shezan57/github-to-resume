/**
 * Resume Storage Service
 * 
 * Handles saving and loading resumes from storage.
 * Uses localStorage for simplicity - can be extended to use a database.
 */

import { Resume } from '@/types';
import { generateId } from './utils';

const STORAGE_KEY = 'github_resumes';

/**
 * Get all saved resumes
 */
export function getResumes(): Resume[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Get a resume by ID
 */
export function getResume(id: string): Resume | null {
    const resumes = getResumes();
    return resumes.find(r => r.id === id) || null;
}

/**
 * Save a resume
 */
export function saveResume(resume: Resume): Resume {
    const resumes = getResumes();
    const existing = resumes.findIndex(r => r.id === resume.id);

    const updatedResume = {
        ...resume,
        metadata: {
            ...resume.metadata,
            updatedAt: new Date().toISOString(),
        },
    };

    if (existing >= 0) {
        resumes[existing] = updatedResume;
    } else {
        resumes.push(updatedResume);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
    return updatedResume;
}

/**
 * Delete a resume
 */
export function deleteResume(id: string): boolean {
    const resumes = getResumes();
    const filtered = resumes.filter(r => r.id !== id);

    if (filtered.length === resumes.length) {
        return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

/**
 * Create a new empty resume
 */
export function createEmptyResume(userId: string = 'anonymous'): Resume {
    const now = new Date().toISOString();

    return {
        id: generateId(),
        userId,
        template: 'modern',
        header: {
            name: '',
            title: '',
            email: '',
            location: '',
            github: '',
            linkedin: '',
            portfolio: '',
        },
        summary: '',
        skills: {
            languages: [],
            frameworks: [],
            databases: [],
            tools: [],
            concepts: [],
        },
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        metadata: {
            createdAt: now,
            updatedAt: now,
        },
    };
}

/**
 * Duplicate a resume
 */
export function duplicateResume(resume: Resume): Resume {
    const now = new Date().toISOString();

    return saveResume({
        ...resume,
        id: generateId(),
        metadata: {
            ...resume.metadata,
            createdAt: now,
            updatedAt: now,
        },
    });
}
