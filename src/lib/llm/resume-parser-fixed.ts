import { UnifiedLLMService } from './llm-service';
import { LLMRequest } from './types';
import { Resume } from '@/types';

export class ResumeParser {
    private llmService: UnifiedLLMService;

    constructor() {
        this.llmService = new UnifiedLLMService();
    }

    async parseResume(text: string): Promise<Resume> {
        const systemPrompt = `You are an expert Resume Parser. Your goal is to extract structured information from the provided resume text and return it as a VALID JSON object matching the exact schema provided.
        
        CRITICAL RULES:
        1. Return ONLY the JSON object. No markdown formatting, no explanations.
        2. If a field is missing, use an empty string "" or empty array [] or null as appropriate.
        3. Ensure "skills" has "categories" with "name" and "items".
        4. "projects" and "experience" are arrays of objects.
        5. "header" contains contact info.

        SCHEMA:
        {
            "id": "generated-id",
            "basics": { // Helper for intermediate, mapped to header
                "name": "",
                "label": "",
                "email": "",
                "phone": "",
                "url": "",
                "summary": "",
                "location": { "city": "", "countryCode": "", "region": "" },
                "profiles": [{ "network": "", "username": "", "url": "" }]
            },
            "work": [{
                "name": "",
                "position": "",
                "url": "",
                "startDate": "YYYY-MM",
                "endDate": "YYYY-MM",
                "summary": "",
                "highlights": [""]
            }],
            "education": [{
                "institution": "",
                "url": "",
                "area": "",
                "studyType": "",
                "startDate": "YYYY-MM",
                "endDate": "YYYY-MM",
                "score": "",
                "courses": [""]
            }],
            "skills": [{ // Intermediate format
                "name": "",
                "level": "",
                "keywords": [""]
            }],
             "projects": [{
                "name": "",
                "description": "",
                "highlights": [""],
                "keywords": [""],
                "startDate": "",
                "endDate": "",
                "url": "",
                "roles": [""],
                "entity": "",
                "type": ""
            }]
        }
        
        NOTE: I will transform your output to my internal Resume type.
        Focus on extracting:
        - Name, Title, Contact Info
        - Summary/Bio
        - Skills (Categorize them if possible, e.g. Languages, Frameworks)
        - Experience (Company, Role, Dates, Bullets)
        - Projects (Name, Description, Tech Stack)
        - Education
        `;

        const userPrompt = `Parse the following resume text into JSON:\n\n${text.substring(0, 15000)}`; // Truncate to avoid context limits if huge

        const request: LLMRequest = {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1, // Low temp for extraction
            maxTokens: 4000,
            jsonMode: true
        };

        try {
            // Force Groq (Free) for parsing to save cost, or use tier?
            // Plan says: "use Groq (openai/gpt-oss-120b)"
            // llm-service calls Groq if provider is 'groq'.
            // I'll assume 'groq' provider for this internal task.
            const response = await this.llmService.chat(request);

            let jsonString = response.content;
            // Clean up if MD code block is present despite instructions
            if (jsonString.includes('```json')) {
                jsonString = jsonString.split('```json')[1].split('```')[0];
            } else if (jsonString.includes('```')) {
                jsonString = jsonString.split('```')[1].split('```')[0];
            }

            const parsed = JSON.parse(jsonString);

            // Mapper to internal Resume Type
            return this.mapToInternalResume(parsed);
        } catch (error) {
            console.error("Resume Parsing Error:", error);
            throw new Error("Failed to parse resume text.");
        }
    }

    private mapToInternalResume(data: any): Resume {
        // Transform the LLM output (JSON Resume format-ish) to our Resume Interface
        return {
            id: crypto.randomUUID(),
            userId: "", // Placeholder, will be assigned by auth context or backend if needed
            template: 'modern',
            header: {
                name: data.basics?.name || "Your Name",
                title: data.basics?.label || "Professional Title",
                email: data.basics?.email || "",
                phone: data.basics?.phone || "",
                github: data.basics?.profiles?.find((p: any) => p.network?.toLowerCase().includes('github'))?.url || "",
                linkedin: data.basics?.profiles?.find((p: any) => p.network?.toLowerCase().includes('linkedin'))?.url || "",
                portfolio: data.basics?.url || "",
                location: data.basics?.location?.city ? `${data.basics.location.city}, ${data.basics.location.region || ''}` : "",
                avatar: ""
            },
            summary: data.basics?.summary || "",
            skills: {
                categories: data.skills?.map((cat: any) => ({
                    id: crypto.randomUUID(),
                    name: cat.name || "Skills",
                    items: cat.keywords || []
                })) || []
            },
            experience: data.work?.map((job: any) => ({
                id: crypto.randomUUID(),
                company: job.name || "",
                title: job.position || "",
                current: !job.endDate,
                startDate: job.startDate || "",
                endDate: job.endDate || "",
                bullets: job.highlights || []
            })) || [],
            projects: data.projects?.map((proj: any) => ({
                id: crypto.randomUUID(),
                name: proj.name || "",
                description: proj.description || "",
                technologies: proj.keywords || [],
                bullets: proj.highlights || [],
                url: proj.url || ""
            })) || [],
            education: data.education?.map((edu: any) => ({
                id: crypto.randomUUID(),
                institution: edu.institution || "",
                degree: `${edu.studyType || ''} ${edu.area || ''}`.trim(),
                field: edu.area || "",
                graduationDate: edu.endDate || "",
                gpa: edu.score || ""
            })) || [],
            certifications: [],
            customSections: [],
            sectionOrder: ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
            sectionVisibility: {
                header: true,
                summary: true,
                skills: true,
                experience: true,
                projects: true,
                education: true,
                certifications: true
            },
            metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };
    }
}
