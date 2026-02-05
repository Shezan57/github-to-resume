/**
 * Modern Resume Template Component
 * 
 * A fully editable, professional resume template
 * Features: inline editing, add/remove items, section management
 */

'use client';

import { Resume, CustomSection, CustomSectionItem, ExperienceItem, ProjectItem, EducationItem, CertificationItem } from '@/types';
import {
    Mail,
    MapPin,
    Github,
    Linkedin,
    Globe,
    Phone,
    ExternalLink,
    Plus,
    Trash2,
    X,
} from 'lucide-react';

interface ResumeTemplateProps {
    resume: Resume;
    isEditing?: boolean;
    onUpdate?: (path: string, value: unknown) => void;
}

// Generate unique ID
const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ModernTemplate({ resume, isEditing = false, onUpdate }: ResumeTemplateProps) {
    const handleEdit = (path: string, value: unknown) => {
        if (isEditing && onUpdate) {
            onUpdate(path, value);
        }
    };

    // Add new experience item
    const addExperience = () => {
        const newItem: ExperienceItem = {
            id: generateId(),
            company: 'Company Name',
            title: 'Job Title',
            location: 'Location',
            startDate: 'Start Date',
            endDate: 'End Date',
            current: false,
            bullets: ['Describe your responsibilities and achievements'],
        };
        handleEdit('experience', [...resume.experience, newItem]);
    };

    // Add new project item
    const addProject = () => {
        const newItem: ProjectItem = {
            id: generateId(),
            name: 'Project Name',
            description: 'Brief description of the project',
            technologies: ['Technology'],
            bullets: ['Key achievement or feature'],
            url: '',
        };
        handleEdit('projects', [...resume.projects, newItem]);
    };

    // Add new education item
    const addEducation = () => {
        const newItem: EducationItem = {
            id: generateId(),
            institution: 'University/Institution',
            degree: 'Degree',
            field: 'Field of Study',
            graduationDate: 'Graduation Year',
        };
        handleEdit('education', [...resume.education, newItem]);
    };

    // Add new certification
    const addCertification = () => {
        const newItem: CertificationItem = {
            id: generateId(),
            name: 'Certification Name',
            issuer: 'Issuing Organization',
            date: 'Date',
        };
        handleEdit('certifications', [...(resume.certifications || []), newItem]);
    };

    // Remove item from array
    const removeItem = (path: string, index: number) => {
        const parts = path.split('.');
        const arrayPath = parts[0];
        const arr = (resume as unknown as Record<string, unknown[]>)[arrayPath];
        if (Array.isArray(arr)) {
            handleEdit(arrayPath, arr.filter((_, i) => i !== index));
        }
    };

    // Add bullet to item
    const addBullet = (basePath: string, currentBullets: string[]) => {
        handleEdit(`${basePath}.bullets`, [...currentBullets, 'New bullet point']);
    };

    // Remove bullet
    const removeBullet = (basePath: string, currentBullets: string[], index: number) => {
        handleEdit(`${basePath}.bullets`, currentBullets.filter((_, i) => i !== index));
    };

    // Add skill to category
    const addSkill = (categoryId: string) => {
        const newCategories = (resume.skills.categories || []).map(cat =>
            cat.id === categoryId
                ? { ...cat, items: [...cat.items, 'New Skill'] }
                : cat
        );
        handleEdit('skills.categories', newCategories);
    };

    // Remove skill from category
    const removeSkill = (categoryId: string, index: number) => {
        const newCategories = (resume.skills.categories || []).map(cat =>
            cat.id === categoryId
                ? { ...cat, items: cat.items.filter((_, i) => i !== index) }
                : cat
        );
        handleEdit('skills.categories', newCategories);
    };

    // Add new skill category
    const addSkillCategory = () => {
        const newCategory = {
            id: generateId(),
            name: 'New Category',
            items: [],
        };
        handleEdit('skills.categories', [...(resume.skills.categories || []), newCategory]);
    };

    // Remove skill category
    const removeSkillCategory = (categoryId: string) => {
        handleEdit('skills.categories', (resume.skills.categories || []).filter(cat => cat.id !== categoryId));
    };

    // Update skill category name
    const updateCategoryName = (categoryId: string, newName: string) => {
        const newCategories = (resume.skills.categories || []).map(cat =>
            cat.id === categoryId ? { ...cat, name: newName } : cat
        );
        handleEdit('skills.categories', newCategories);
    };

    // Update skill in category
    const updateSkill = (categoryId: string, skillIndex: number, newValue: string) => {
        const newCategories = (resume.skills.categories || []).map(cat =>
            cat.id === categoryId
                ? { ...cat, items: cat.items.map((item, i) => i === skillIndex ? newValue : item) }
                : cat
        );
        handleEdit('skills.categories', newCategories);
    };

    // Get section order and visibility
    const sectionOrder = resume.sectionOrder || [
        'header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'
    ];
    const sectionVisibility = resume.sectionVisibility || {};

    // Check if a section is visible
    const isSectionVisible = (sectionId: string): boolean => {
        return sectionVisibility[sectionId] !== false; // Default to visible
    };

    // Render custom section
    const renderCustomSection = (section: CustomSection, sectionIndex: number) => {
        if (!section.visible) return null;
        const sectionPath = `customSections.${sectionIndex}`;

        return (
            <section key={section.id} className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3 flex items-center gap-2">
                    <span>{section.icon}</span>
                    <span
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => handleEdit(`${sectionPath}.title`, e.currentTarget.textContent || '')}
                    >
                        {section.title}
                    </span>
                </h2>

                {section.type === 'text' && (
                    <p
                        className="text-gray-700 leading-relaxed"
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => handleEdit(`${sectionPath}.content`, e.currentTarget.textContent || '')}
                    >
                        {typeof section.content === 'string' ? section.content || 'Click to add content...' : ''}
                    </p>
                )}

                {section.type === 'list' && (
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(section.content) && section.content.map((item, i) => (
                            typeof item === 'string' && (
                                <span key={i} className="group relative px-2 py-1 text-sm rounded bg-purple-100 text-purple-700">
                                    <span
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newContent = [...(section.content as string[])];
                                            newContent[i] = e.currentTarget.textContent || '';
                                            handleEdit(`${sectionPath}.content`, newContent);
                                        }}
                                    >
                                        {item}
                                    </span>
                                    {isEditing && (
                                        <button
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
                                            onClick={() => {
                                                const newContent = (section.content as string[]).filter((_, idx) => idx !== i);
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}
                                        >
                                            <X className="w-3 h-3 mx-auto" />
                                        </button>
                                    )}
                                </span>
                            )
                        ))}
                        {isEditing && (
                            <button
                                className="px-2 py-1 text-sm rounded border border-dashed border-purple-300 text-purple-500 hover:bg-purple-50 flex items-center gap-1"
                                onClick={() => {
                                    const newContent = [...(Array.isArray(section.content) ? section.content : []), 'New Item'];
                                    handleEdit(`${sectionPath}.content`, newContent);
                                }}
                            >
                                <Plus className="h-3 w-3" /> Add
                            </button>
                        )}
                    </div>
                )}

                {section.type === 'bullets' && (
                    <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                        {Array.isArray(section.content) && section.content.map((item, i) => (
                            typeof item === 'string' && (
                                <li key={i} className="group flex items-start gap-1">
                                    <span className="flex-1">
                                        <span
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newContent = [...(section.content as string[])];
                                                newContent[i] = e.currentTarget.textContent || '';
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}
                                        >
                                            {item}
                                        </span>
                                    </span>
                                    {isEditing && (
                                        <button
                                            className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            onClick={() => {
                                                const newContent = (section.content as string[]).filter((_, idx) => idx !== i);
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </li>
                            )
                        ))}
                        {isEditing && (
                            <li className="list-none">
                                <button
                                    className="text-purple-500 hover:text-purple-600 text-sm flex items-center gap-1"
                                    onClick={() => {
                                        const newContent = [...(Array.isArray(section.content) ? section.content : []), 'New bullet point'];
                                        handleEdit(`${sectionPath}.content`, newContent);
                                    }}
                                >
                                    <Plus className="h-3 w-3" /> Add bullet
                                </button>
                            </li>
                        )}
                    </ul>
                )}

                {section.type === 'items' && (
                    <div className="space-y-3">
                        {Array.isArray(section.content) && section.content.map((item, i) => {
                            if (typeof item === 'string') return null;
                            const sectionItem = item as CustomSectionItem;
                            return (
                                <div key={sectionItem.id || i} className="group flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3
                                            className="font-medium text-gray-900"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newContent = [...(section.content as CustomSectionItem[])];
                                                newContent[i] = { ...newContent[i], title: e.currentTarget.textContent || '' };
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}
                                        >
                                            {sectionItem.title}
                                        </h3>
                                        <p
                                            className="text-sm text-gray-600"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newContent = [...(section.content as CustomSectionItem[])];
                                                newContent[i] = { ...newContent[i], description: e.currentTarget.textContent || '' };
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}
                                        >
                                            {sectionItem.description || 'Click to add description...'}
                                        </p>
                                    </div>
                                    <span
                                        className="text-sm text-gray-500"
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newContent = [...(section.content as CustomSectionItem[])];
                                            newContent[i] = { ...newContent[i], date: e.currentTarget.textContent || '' };
                                            handleEdit(`${sectionPath}.content`, newContent);
                                        }}
                                    >
                                        {sectionItem.date || (isEditing ? 'Date' : '')}
                                    </span>
                                    {isEditing && (
                                        <button
                                            className="ml-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            onClick={() => {
                                                const newContent = (section.content as CustomSectionItem[]).filter((_, idx) => idx !== i);
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {isEditing && (
                            <button
                                className="text-purple-500 hover:text-purple-600 text-sm flex items-center gap-1"
                                onClick={() => {
                                    const newItem: CustomSectionItem = {
                                        id: generateId(),
                                        title: 'New Item',
                                        description: 'Description',
                                    };
                                    const newContent = [...(Array.isArray(section.content) ? section.content : []), newItem];
                                    handleEdit(`${sectionPath}.content`, newContent);
                                }}
                            >
                                <Plus className="h-3 w-3" /> Add item
                            </button>
                        )}
                    </div>
                )}
            </section>
        );
    };

    // Render section by ID
    const renderSection = (sectionId: string) => {
        // Custom section
        const customSectionIndex = (resume.customSections || []).findIndex(s => s.id === sectionId);
        if (customSectionIndex >= 0) {
            return renderCustomSection(resume.customSections[customSectionIndex], customSectionIndex);
        }

        switch (sectionId) {
            case 'header':
                return (
                    <header key="header" className="mb-6">
                        <h1
                            className="text-3xl font-bold text-gray-900 mb-1"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.name', e.currentTarget.textContent || '')}
                        >
                            {resume.header.name || (isEditing ? 'Your Name' : '')}
                        </h1>
                        <p
                            className="text-lg font-medium text-purple-600 mb-3"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.title', e.currentTarget.textContent || '')}
                        >
                            {resume.header.title || (isEditing ? 'Professional Title' : '')}
                        </p>

                        {/* Contact Info - All Editable */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                <span
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit('header.email', e.currentTarget.textContent || '')}
                                    className={!resume.header.email && isEditing ? 'text-gray-400' : ''}
                                >
                                    {resume.header.email || (isEditing ? 'email@example.com' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                <span
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit('header.phone', e.currentTarget.textContent || '')}
                                    className={!resume.header.phone && isEditing ? 'text-gray-400' : ''}
                                >
                                    {resume.header.phone || (isEditing ? '+1 (555) 123-4567' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit('header.location', e.currentTarget.textContent || '')}
                                    className={!resume.header.location && isEditing ? 'text-gray-400' : ''}
                                >
                                    {resume.header.location || (isEditing ? 'City, Country' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Github className="h-3.5 w-3.5" />
                                <span
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit('header.github', e.currentTarget.textContent || '')}
                                    className={!resume.header.github && isEditing ? 'text-gray-400' : ''}
                                >
                                    {resume.header.github || (isEditing ? 'github.com/username' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Linkedin className="h-3.5 w-3.5" />
                                <span
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit('header.linkedin', e.currentTarget.textContent || '')}
                                    className={!resume.header.linkedin && isEditing ? 'text-gray-400' : ''}
                                >
                                    {resume.header.linkedin || (isEditing ? 'linkedin.com/in/username' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5" />
                                <span
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit('header.portfolio', e.currentTarget.textContent || '')}
                                    className={!resume.header.portfolio && isEditing ? 'text-gray-400' : ''}
                                >
                                    {resume.header.portfolio || (isEditing ? 'yourwebsite.com' : '')}
                                </span>
                            </span>
                        </div>
                    </header>
                );

            case 'summary':
                return (
                    <section key="summary" className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                            Professional Summary
                        </h2>
                        <p
                            className="text-gray-700 leading-relaxed"
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            onBlur={(e) => handleEdit('summary', e.currentTarget.textContent || '')}
                        >
                            {resume.summary || (isEditing ? 'Write a compelling summary of your professional background, key skills, and career objectives. Focus on what makes you unique and valuable to potential employers.' : '')}
                        </p>
                    </section>
                );

            case 'skills':
                return (
                    <section key="skills" className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                            Technical Skills
                        </h2>
                        <div className="space-y-2 text-sm">
                            {(resume.skills.categories || []).map((category) => (
                                <div key={category.id} className="group/cat flex flex-wrap items-center gap-1">
                                    <span
                                        className="font-semibold text-gray-700 mr-1"
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => updateCategoryName(category.id, e.currentTarget.textContent || 'Category')}
                                    >
                                        {category.name}:
                                    </span>
                                    {category.items.map((skill, i) => (
                                        <span key={i} className="group relative px-2 py-0.5 rounded bg-gray-100">
                                            <span
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => updateSkill(category.id, i, e.currentTarget.textContent || '')}
                                            >
                                                {skill}
                                            </span>
                                            {isEditing && (
                                                <button
                                                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                    onClick={() => removeSkill(category.id, i)}
                                                >
                                                    <X className="w-2 h-2" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                    {isEditing && (
                                        <>
                                            <button
                                                className="px-2 py-0.5 rounded border border-dashed border-gray-300 text-gray-500 text-xs hover:bg-gray-50"
                                                onClick={() => addSkill(category.id)}
                                            >
                                                +
                                            </button>
                                            <button
                                                className="ml-1 text-red-400 opacity-0 group-hover/cat:opacity-100 hover:text-red-500"
                                                onClick={() => removeSkillCategory(category.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                            {isEditing && (
                                <button
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                                    onClick={addSkillCategory}
                                >
                                    <Plus className="h-4 w-4" /> Add Skill Category
                                </button>
                            )}
                        </div>
                    </section>
                );

            case 'experience':
                return (
                    <section key="experience" className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                            Work Experience
                        </h2>
                        <div className="space-y-4">
                            {resume.experience.map((exp, index) => (
                                <div key={exp.id || index} className="group relative">
                                    {isEditing && (
                                        <button
                                            className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('experience', index)}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3
                                                className="font-semibold text-gray-900"
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.title`, e.currentTarget.textContent || '')}
                                            >
                                                {exp.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                <span
                                                    contentEditable={isEditing}
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => handleEdit(`experience.${index}.company`, e.currentTarget.textContent || '')}
                                                >
                                                    {exp.company}
                                                </span>
                                                {' • '}
                                                <span
                                                    contentEditable={isEditing}
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => handleEdit(`experience.${index}.location`, e.currentTarget.textContent || '')}
                                                >
                                                    {exp.location || (isEditing ? 'Location' : '')}
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            <span
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.startDate`, e.currentTarget.textContent || '')}
                                            >
                                                {exp.startDate}
                                            </span>
                                            {' - '}
                                            <span
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.endDate`, e.currentTarget.textContent || '')}
                                            >
                                                {exp.current ? 'Present' : exp.endDate}
                                            </span>
                                        </p>
                                    </div>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                                        {exp.bullets.map((bullet, i) => (
                                            <li key={i} className="group/bullet flex items-start gap-1">
                                                <span className="flex-1">
                                                    <span
                                                        contentEditable={isEditing}
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => handleEdit(`experience.${index}.bullets.${i}`, e.currentTarget.textContent || '')}
                                                    >
                                                        {bullet}
                                                    </span>
                                                </span>
                                                {isEditing && (
                                                    <button
                                                        className="text-red-400 hover:text-red-500 opacity-0 group-hover/bullet:opacity-100"
                                                        onClick={() => removeBullet(`experience.${index}`, exp.bullets, i)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                        {isEditing && (
                                            <li className="list-none">
                                                <button
                                                    className="text-purple-500 hover:text-purple-600 text-xs flex items-center gap-1"
                                                    onClick={() => addBullet(`experience.${index}`, exp.bullets)}
                                                >
                                                    <Plus className="h-3 w-3" /> Add bullet
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                            {isEditing && (
                                <button
                                    className="w-full py-2 border-2 border-dashed border-purple-200 rounded-lg text-purple-500 hover:bg-purple-50 flex items-center justify-center gap-2"
                                    onClick={addExperience}
                                >
                                    <Plus className="h-4 w-4" /> Add Experience
                                </button>
                            )}
                        </div>
                        {!isEditing && resume.experience.length === 0 && (
                            <p className="text-gray-400 italic text-sm">No work experience added yet.</p>
                        )}
                    </section>
                );

            case 'projects':
                return (
                    <section key="projects" className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                            Projects
                        </h2>
                        <div className="space-y-4">
                            {resume.projects.map((project, index) => (
                                <div key={project.id || index} className="group relative">
                                    {isEditing && (
                                        <button
                                            className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('projects', index)}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3
                                                className="font-semibold text-gray-900"
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`projects.${index}.name`, e.currentTarget.textContent || '')}
                                            >
                                                {project.name}
                                            </h3>
                                            {(project.url || isEditing) && (
                                                <span
                                                    className="text-xs text-purple-600 flex items-center gap-1"
                                                    contentEditable={isEditing}
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => handleEdit(`projects.${index}.url`, e.currentTarget.textContent || '')}
                                                >
                                                    {project.url || (isEditing ? 'https://project-url.com' : '')}
                                                    {project.url && <ExternalLink className="h-3 w-3" />}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {project.technologies.map((tech, i) => (
                                                <span key={i} className="group/tech relative text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                                    <span
                                                        contentEditable={isEditing}
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => {
                                                            const newTech = [...project.technologies];
                                                            newTech[i] = e.currentTarget.textContent || '';
                                                            handleEdit(`projects.${index}.technologies`, newTech);
                                                        }}
                                                    >
                                                        {tech}
                                                    </span>
                                                    {isEditing && (
                                                        <button
                                                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover/tech:opacity-100 flex items-center justify-center"
                                                            onClick={() => {
                                                                const newTech = project.technologies.filter((_, idx) => idx !== i);
                                                                handleEdit(`projects.${index}.technologies`, newTech);
                                                            }}
                                                        >
                                                            <X className="w-2 h-2" />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            {isEditing && (
                                                <button
                                                    className="text-xs px-2 py-0.5 rounded border border-dashed border-purple-300 text-purple-500"
                                                    onClick={() => handleEdit(`projects.${index}.technologies`, [...project.technologies, 'Tech'])}
                                                >
                                                    +
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p
                                        className="text-sm text-gray-600 mt-1"
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`projects.${index}.description`, e.currentTarget.textContent || '')}
                                    >
                                        {project.description}
                                    </p>
                                    {(project.bullets.length > 0 || isEditing) && (
                                        <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                                            {project.bullets.map((bullet, i) => (
                                                <li key={i} className="group/bullet flex items-start gap-1">
                                                    <span className="flex-1">
                                                        <span
                                                            contentEditable={isEditing}
                                                            suppressContentEditableWarning
                                                            onBlur={(e) => handleEdit(`projects.${index}.bullets.${i}`, e.currentTarget.textContent || '')}
                                                        >
                                                            {bullet}
                                                        </span>
                                                    </span>
                                                    {isEditing && (
                                                        <button
                                                            className="text-red-400 hover:text-red-500 opacity-0 group-hover/bullet:opacity-100"
                                                            onClick={() => removeBullet(`projects.${index}`, project.bullets, i)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                            {isEditing && (
                                                <li className="list-none">
                                                    <button
                                                        className="text-purple-500 hover:text-purple-600 text-xs flex items-center gap-1"
                                                        onClick={() => addBullet(`projects.${index}`, project.bullets)}
                                                    >
                                                        <Plus className="h-3 w-3" /> Add bullet
                                                    </button>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {isEditing && (
                                <button
                                    className="w-full py-2 border-2 border-dashed border-purple-200 rounded-lg text-purple-500 hover:bg-purple-50 flex items-center justify-center gap-2"
                                    onClick={addProject}
                                >
                                    <Plus className="h-4 w-4" /> Add Project
                                </button>
                            )}
                        </div>
                    </section>
                );

            case 'education':
                return (
                    <section key="education" className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                            Education
                        </h2>
                        <div className="space-y-3">
                            {resume.education.map((edu, index) => (
                                <div key={edu.id || index} className="group relative flex justify-between">
                                    {isEditing && (
                                        <button
                                            className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('education', index)}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            <span
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`education.${index}.degree`, e.currentTarget.textContent || '')}
                                            >
                                                {edu.degree}
                                            </span>
                                            {' in '}
                                            <span
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`education.${index}.field`, e.currentTarget.textContent || '')}
                                            >
                                                {edu.field}
                                            </span>
                                        </h3>
                                        <p
                                            className="text-sm text-gray-600"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`education.${index}.institution`, e.currentTarget.textContent || '')}
                                        >
                                            {edu.institution}
                                        </p>
                                    </div>
                                    <p
                                        className="text-sm text-gray-500"
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.graduationDate`, e.currentTarget.textContent || '')}
                                    >
                                        {edu.graduationDate || (isEditing ? 'Year' : '')}
                                    </p>
                                </div>
                            ))}
                            {isEditing && (
                                <button
                                    className="w-full py-2 border-2 border-dashed border-purple-200 rounded-lg text-purple-500 hover:bg-purple-50 flex items-center justify-center gap-2"
                                    onClick={addEducation}
                                >
                                    <Plus className="h-4 w-4" /> Add Education
                                </button>
                            )}
                        </div>
                        {!isEditing && resume.education.length === 0 && (
                            <p className="text-gray-400 italic text-sm">No education added yet.</p>
                        )}
                    </section>
                );

            case 'certifications':
                return (
                    <section key="certifications" className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                            Certifications
                        </h2>
                        <div className="space-y-2">
                            {(resume.certifications || []).map((cert, index) => (
                                <div key={cert.id || index} className="group relative flex justify-between">
                                    {isEditing && (
                                        <button
                                            className="absolute -right-2 -top-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => {
                                                const newCerts = (resume.certifications || []).filter((_, i) => i !== index);
                                                handleEdit('certifications', newCerts);
                                            }}
                                        >
                                            <X className="w-2 h-2" />
                                        </button>
                                    )}
                                    <div>
                                        <h3
                                            className="font-medium text-gray-900"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`certifications.${index}.name`, e.currentTarget.textContent || '')}
                                        >
                                            {cert.name}
                                        </h3>
                                        <p
                                            className="text-sm text-gray-600"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`certifications.${index}.issuer`, e.currentTarget.textContent || '')}
                                        >
                                            {cert.issuer}
                                        </p>
                                    </div>
                                    <p
                                        className="text-sm text-gray-500"
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`certifications.${index}.date`, e.currentTarget.textContent || '')}
                                    >
                                        {cert.date || (isEditing ? 'Date' : '')}
                                    </p>
                                </div>
                            ))}
                            {isEditing && (
                                <button
                                    className="w-full py-2 border-2 border-dashed border-purple-200 rounded-lg text-purple-500 hover:bg-purple-50 flex items-center justify-center gap-2"
                                    onClick={addCertification}
                                >
                                    <Plus className="h-4 w-4" /> Add Certification
                                </button>
                            )}
                        </div>
                        {!isEditing && (!resume.certifications || resume.certifications.length === 0) && (
                            <p className="text-gray-400 italic text-sm">No certifications added yet.</p>
                        )}
                    </section>
                );

            default:
                return null;
        }
    };

    return (
        <div className="resume-page shadow-2xl mx-auto">
            {sectionOrder
                .filter(sectionId => isSectionVisible(sectionId))
                .map(sectionId => renderSection(sectionId))}
        </div>
    );
}
