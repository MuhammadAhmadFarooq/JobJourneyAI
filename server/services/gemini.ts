import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const parsedResumeCache = new Map<string, { expiresAt: number; value: ParsedResume }>();
const inflightResumeParses = new Map<string, Promise<ParsedResume>>();
const geminiCooldownUntil = new Map<string, number>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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
  const cacheKey = normalizeResumeText(resumeText);
  const cached = parsedResumeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inflight = inflightResumeParses.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const parsePromise = parseResumeWithGeminiInternal(resumeText)
    .then((result) => {
      parsedResumeCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    })
    .finally(() => {
      inflightResumeParses.delete(cacheKey);
    });

  inflightResumeParses.set(cacheKey, parsePromise);
  return parsePromise;
}

async function parseResumeWithGeminiInternal(resumeText: string): Promise<ParsedResume> {
  try {
    // Use gemini-2.0-flash as the model (or gemini-pro as fallback)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const cooldownKey = "gemini-2.0-flash";

    const cooldownUntil = geminiCooldownUntil.get(cooldownKey) || 0;
    if (cooldownUntil > Date.now()) {
      throw createGeminiCooldownError(cooldownUntil - Date.now());
    }

    // Retry only for non-rate-limit transient errors; 429 should fall back immediately.
    const maxAttempts = 2;
    let attempt = 0;
    let lastError: any = null;
    let text: string | undefined = undefined;

    while (attempt < maxAttempts) {
      try {
        const result = await model.generateContent(RESUME_PARSE_PROMPT + resumeText);
        const response = await result.response;
        text = response.text();
        break;
      } catch (err: any) {
        lastError = err;
        attempt += 1;
        // If it's a rate limit, wait using the API-provided retry delay; otherwise use a short exponential backoff.
        const status = err?.status || err?.statusCode;
        if (status === 429 && attempt < maxAttempts) {
          geminiCooldownUntil.set(cooldownKey, Date.now() + 5 * 60 * 1000);
          throw err;
        }
        if (attempt < maxAttempts) {
          const backoff = Math.min(Math.pow(2, attempt) * 500, 4000);
          console.warn(`Transient Gemini error (attempt ${attempt}). Retrying in ${backoff}ms.`);
          await delay(backoff);
          continue;
        }
        break;
      }
    }

    if (!text) {
      throw lastError || new Error("No response from Gemini");
    }
    
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
  } catch (error: any) {
    console.error("Error parsing resume with Gemini:", error);

    // If the error is a quota or invalid-key issue, fall back to a lightweight local parser
    const isQuotaError = error?.status === 429;
    const isInvalidKey = (error?.status === 400) && JSON.stringify(error).includes("API_KEY_INVALID");

    if (isQuotaError || isInvalidKey) {
      geminiCooldownUntil.set("gemini-2.0-flash", Date.now() + 5 * 60 * 1000);
      console.warn("Falling back to local resume parser due to Gemini error.");
      return parseResumeFallback(resumeText);
    }

    throw new Error("Failed to parse resume with AI. Please try again.");
  }
}

function createGeminiCooldownError(msRemaining: number): Error {
  const seconds = Math.max(1, Math.ceil(msRemaining / 1000));
  return new Error(`Gemini temporarily rate-limited. Retry in about ${seconds}s.`);
}

function normalizeResumeText(resumeText: string): string {
  return resumeText
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
    .toLowerCase();
}

function getRetryDelayMs(error: any): number | null {
  const retryDelay = error?.errorDetails?.find?.((detail: any) => detail?.retryDelay)?.retryDelay;
  if (typeof retryDelay === "string") {
    const match = retryDelay.match(/^(\d+)(ms|s)$/i);
    if (match) {
      const value = Number(match[1]);
      return match[2].toLowerCase() === "s" ? value * 1000 : value;
    }
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseResumeFallback(resumeText: string): ParsedResume {
  // Very small heuristic parser: extract name (first non-empty line), email, phone and common tech keywords
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const name = lines.length ? lines[0] : "";

  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = resumeText.match(/\+?[0-9][0-9()\- .]{6,}[0-9]/);

  const techKeywords = [
    "react", "node", "express", "typescript", "javascript", "python", "java", "aws", "docker", "kubernetes", "mongo", "postgres", "sql", "html", "css", "next", "vite",
  ];

  const foundSkills = Array.from(new Set(
    techKeywords.filter((kw) => new RegExp(`\\b${kw}\\b`, "i").test(resumeText))
  )).map((s) => ({ name: s, level: 50, category: "Other" as const }));

  return {
    name: name || "",
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0] : "",
    location: "",
    summary: lines.slice(0, 3).join(" ") || "",
    skills: foundSkills,
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    profileSummary: "",
    suggestedRoles: [],
    strengthAreas: [],
    improvementAreas: [],
  };
}
