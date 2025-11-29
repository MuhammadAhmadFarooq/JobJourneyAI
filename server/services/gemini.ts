import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: {
    name: string;
    level: number;
    category: "Frontend" | "Backend" | "Database" | "Cloud" | "Language" | "DevOps" | "Other";
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    startDate?: string;
    endDate?: string;
    description: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    graduationDate?: string;
    gpa?: string;
    relevantCoursework: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  certifications: string[];
  languages: string[];
  profileSummary: string;
  suggestedRoles: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

const RESUME_PARSE_PROMPT = `You are an expert resume parser. Analyze the following resume text and extract all information in a structured JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract ALL information accurately from the resume
2. For skills, estimate proficiency level (0-100) based on:
   - How prominently it's featured
   - Years of experience mentioned
   - Projects using it
   - Certifications related to it
3. Categorize skills into: Frontend, Backend, Database, Cloud, Language, DevOps, or Other
4. For experience, extract detailed bullet points as highlights
5. Generate a professional profile summary based on the content
6. Suggest job roles that match the candidate's profile
7. Identify strength areas and areas for improvement

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, State/Country",
  "summary": "Brief professional summary from resume or empty string",
  "skills": [
    {"name": "React", "level": 85, "category": "Frontend"},
    {"name": "Node.js", "level": 80, "category": "Backend"}
  ],
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2023 - Present",
      "startDate": "2023-01",
      "endDate": "present",
      "description": "Brief role description",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "graduationDate": "2024",
      "gpa": "3.8",
      "relevantCoursework": ["Data Structures", "Algorithms"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project does",
      "technologies": ["React", "Node.js"],
      "link": "https://github.com/..."
    }
  ],
  "certifications": ["AWS Certified Developer", "Google Cloud Associate"],
  "languages": ["English", "Spanish"],
  "profileSummary": "AI-generated 2-3 sentence summary highlighting key strengths and career focus",
  "suggestedRoles": ["Frontend Developer", "Full Stack Engineer", "React Developer"],
  "strengthAreas": ["Strong React expertise", "Good problem-solving skills"],
  "improvementAreas": ["Could expand cloud knowledge", "Limited backend experience"]
}

RESUME TEXT:
`;

export async function parseResumeWithGemini(resumeText: string): Promise<ParsedResume> {
  try {
    // Use gemini-2.0-flash as the model (or gemini-pro as fallback)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(RESUME_PARSE_PROMPT + resumeText);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response - remove any markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();
    
    const parsedData = JSON.parse(cleanedText) as ParsedResume;
    
    // Validate and set defaults for missing fields
    return {
      name: parsedData.name || "",
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      location: parsedData.location || "",
      summary: parsedData.summary || "",
      skills: parsedData.skills || [],
      experience: parsedData.experience || [],
      education: parsedData.education || [],
      projects: parsedData.projects || [],
      certifications: parsedData.certifications || [],
      languages: parsedData.languages || [],
      profileSummary: parsedData.profileSummary || "",
      suggestedRoles: parsedData.suggestedRoles || [],
      strengthAreas: parsedData.strengthAreas || [],
      improvementAreas: parsedData.improvementAreas || [],
    };
  } catch (error) {
    console.error("Error parsing resume with Gemini:", error);
    throw new Error("Failed to parse resume with AI. Please try again.");
  }
}
