import { generateContentWithAI, extractJsonFromText } from "./aiProvider";

export interface CoverLetterInput {
  resumeData: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: Array<{ name: string; level?: number; category?: string }>;
    experience?: Array<{
      role: string;
      company: string;
      duration?: string;
      description?: string;
      highlights?: string[];
    }>;
  };
  jobTitle: string;
  company: string;
  jobDescription: string;
  mode?: "cover-letter" | "cold-email" | "linkedin-message";
  tone?: "professional" | "enthusiastic" | "executive" | "direct";
  recruiterName?: string;
}

export interface CoverLetterResult {
  mode: string;
  tone: string;
  jobTitle: string;
  company: string;
  subjectLine?: string;
  salutation: string;
  content: string;
  keyMatchHighlights: string[];
  callToAction: string;
}

export async function generateCoverLetterOrOutreach(input: CoverLetterInput): Promise<CoverLetterResult> {
  const { 
    resumeData, 
    jobTitle, 
    company, 
    jobDescription, 
    mode = "cover-letter", 
    tone = "professional", 
    recruiterName = "Hiring Manager" 
  } = input;

  const modeDescriptions: Record<string, string> = {
    "cover-letter": "Full formal cover letter (3-4 paragraphs, comprehensive, structured)",
    "cold-email": "Concise outreach email directly to a recruiter or hiring manager (2-3 short paragraphs + catchy subject line)",
    "linkedin-message": "Short, punchy LinkedIn connection note or direct message (under 150 words, friendly and high-converting)",
  };

  const toneDescriptions: Record<string, string> = {
    "professional": "Polished, respectful, articulate, and authoritative",
    "enthusiastic": "Energetic, passionate about the company mission, dynamic",
    "executive": "Strategic, results-oriented, metric-focused, leadership-minded",
    "direct": "Clear, concise, no fluff, immediately highlights candidate-value proposition",
  };

  const prompt = `You are an elite Career Coach and Talent Outreach Strategist.
Write a personalized ${modeDescriptions[mode] || "cover letter"} using a ${toneDescriptions[tone] || "professional"} tone for candidate ${resumeData.name || "the applicant"}.

TARGET DETAILS:
- Job Title: ${jobTitle}
- Target Company: ${company}
- Recruiter / Contact Person: ${recruiterName || "Hiring Manager"}
- Job Description:
${jobDescription}

CANDIDATE PROFILE:
- Name: ${resumeData.name || "Candidate"}
- Email: ${resumeData.email || ""}
- Location: ${resumeData.location || ""}
- Top Skills: ${resumeData.skills?.map(s => s.name).slice(0, 10).join(", ") || "Software Development"}
- Experience Summary: ${resumeData.experience?.map(e => `${e.role} at ${e.company}`).join("; ") || "Relevant Experience"}

Format the response strictly as valid JSON with NO markdown formatting around the output, matching this schema:
{
  "mode": "${mode}",
  "tone": "${tone}",
  "jobTitle": "${jobTitle}",
  "company": "${company}",
  "subjectLine": "${mode !== 'cover-letter' ? 'Compelling Email/LinkedIn Subject Line' : ''}",
  "salutation": "Dear ${recruiterName || 'Hiring Team'},",
  "content": "The full text content of the letter/email/message. Paragraphs separated by standard double line breaks.",
  "keyMatchHighlights": ["Bullet 1 highlighting why candidate is perfect for this role", "Bullet 2"],
  "callToAction": "Suggested closing call-to-action line"
}`;

  try {
    const responseText = await generateContentWithAI(prompt);
    const cleanedText = extractJsonFromText(responseText);

    const parsed = JSON.parse(cleanedText);
    return {
      mode: parsed.mode || mode,
      tone: parsed.tone || tone,
      jobTitle: parsed.jobTitle || jobTitle,
      company: parsed.company || company,
      subjectLine: parsed.subjectLine || `${jobTitle} Application - ${resumeData.name || 'Candidate'}`,
      salutation: parsed.salutation || `Dear ${recruiterName || 'Hiring Team'},`,
      content: parsed.content || "",
      keyMatchHighlights: parsed.keyMatchHighlights || [],
      callToAction: parsed.callToAction || "Looking forward to speaking with you soon.",
    };
  } catch (error: any) {
    console.error("Error generating cover letter:", error);
    throw new Error(`Failed to generate cover letter: ${error.message || error}`);
  }
}
