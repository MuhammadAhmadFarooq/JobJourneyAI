import { generateContentWithAI, extractJsonFromText } from "./aiProvider";

export interface TailorResumeInput {
  resumeData: {
    name?: string;
    summary?: string;
    skills?: Array<{ name: string; level?: number; category?: string }>;
    experience?: Array<{
      role: string;
      company: string;
      duration?: string;
      description?: string;
      highlights?: string[];
    }>;
    education?: any[];
    projects?: any[];
  };
  jobTitle: string;
  company: string;
  jobDescription: string;
}

export interface TailoredResumeResult {
  jobTitle: string;
  company: string;
  matchScoreBefore: number;
  matchScoreAfter: number;
  matchedKeywords: string[];
  missingKeywordsToConsider: string[];
  tailoredSummary: string;
  tailoredExperience: Array<{
    role: string;
    company: string;
    duration: string;
    tailoredHighlights: string[];
  }>;
  tailoredSkills: Array<{ name: string; category: string }>;
  recommendedSkillAdditions: string[];
  atsOptimizationTips: string[];
}

export async function tailorResumeForJob(input: TailorResumeInput): Promise<TailoredResumeResult> {
  const { resumeData, jobTitle, company, jobDescription } = input;

  const prompt = `You are an expert Executive Resume Writer and ATS Optimization Specialist.
Your task is to analyze a candidate's master resume against a specific target job posting and generate a tailored, job-specific resume variant that maximizes ATS keyword matching and candidate impact.

TARGET JOB DETAILS:
- Title: ${jobTitle}
- Company: ${company}
- Job Description:
${jobDescription}

CANDIDATE MASTER RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Provide your response in strictly valid JSON format with NO markdown formatting, matching the following JSON schema:
{
  "jobTitle": "${jobTitle}",
  "company": "${company}",
  "matchScoreBefore": number (estimated 0-100 score based on original resume vs job description),
  "matchScoreAfter": number (estimated 0-100 score for this tailored variant, should be 85-98),
  "matchedKeywords": ["array of exact technical/soft skill keywords present in both job description and resume"],
  "missingKeywordsToConsider": ["array of important keywords from job description missing in resume"],
  "tailoredSummary": "A powerful 3-4 sentence professional summary tailored specifically for the ${jobTitle} position at ${company}, weaving in core requirements and achievements.",
  "tailoredExperience": [
    {
      "role": "Role title",
      "company": "Company name",
      "duration": "Duration text",
      "tailoredHighlights": [
        "High-impact bullet point using action verbs, quantifiable metrics, and relevant keywords matching the job description",
        "Second tailored bullet point",
        "Third tailored bullet point"
      ]
    }
  ],
  "tailoredSkills": [
    { "name": "Skill Name", "category": "Core / Tech / Leadership" }
  ],
  "recommendedSkillAdditions": ["Key skills to highlight or learn for this role"],
  "atsOptimizationTips": [
    "Specific ATS formatting or keyword placement advice for this application"
  ]
}`;

  try {
    const responseText = await generateContentWithAI(prompt);
    const cleanedText = extractJsonFromText(responseText);
    const parsedResult = JSON.parse(cleanedText);
    return {
      jobTitle: parsedResult.jobTitle || jobTitle,
      company: parsedResult.company || company,
      matchScoreBefore: parsedResult.matchScoreBefore || 65,
      matchScoreAfter: parsedResult.matchScoreAfter || 92,
      matchedKeywords: parsedResult.matchedKeywords || [],
      missingKeywordsToConsider: parsedResult.missingKeywordsToConsider || [],
      tailoredSummary: parsedResult.tailoredSummary || "",
      tailoredExperience: parsedResult.tailoredExperience || [],
      tailoredSkills: parsedResult.tailoredSkills || [],
      recommendedSkillAdditions: parsedResult.recommendedSkillAdditions || [],
      atsOptimizationTips: parsedResult.atsOptimizationTips || [],
    };
  } catch (error: any) {
    console.error("Error tailoring resume:", error);
    throw new Error(`Failed to generate tailored resume: ${error.message || error}`);
  }
}
