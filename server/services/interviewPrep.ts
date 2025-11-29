import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const SERPER_API_KEY = process.env.SERPER_API_KEY || "";

interface JobDetails {
  title: string;
  company: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  location?: string;
}

interface UserProfile {
  skills: Array<{ name: string; level: number; category: string }>;
  experience: Array<{ role: string; company: string; duration: string; description: string }>;
  education?: Array<{ degree: string; institution: string }>;
  yearsOfExperience?: number;
}

interface InterviewQuestion {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "Technical" | "Behavioral" | "System Design" | "Coding" | "Situational";
  topic: string;
  hints: string[];
  sampleAnswer?: string;
  whyAsked: string;
}

interface InterviewTopic {
  title: string;
  description: string;
  importance: "High" | "Medium" | "Low";
  keyConceptsToReview: string[];
  commonMistakes: string[];
  resources: string[];
  questions: InterviewQuestion[];
}

interface InterviewPrepResult {
  jobTitle: string;
  company: string;
  companyInsights: {
    overview: string;
    culture: string;
    interviewProcess: string;
    recentNews: string[];
  };
  roleInsights: {
    overview: string;
    dayToDay: string;
    growthPath: string;
    salaryRange: string;
  };
  techStackAnalysis: {
    requiredTechnologies: string[];
    niceToHave: string[];
    trendingInField: string[];
  };
  topics: InterviewTopic[];
  studyPlan: {
    week1: string[];
    week2: string[];
    lastDays: string[];
  };
  tips: string[];
  redFlags: string[];
  questionsToAsk: string[];
}

// Search the web for relevant information
async function searchWeb(query: string): Promise<string[]> {
  if (!SERPER_API_KEY) {
    console.log("⚠️ No Serper API key, skipping web search");
    return [];
  }

  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      {
        q: query,
        num: 10,
      },
      {
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const results: string[] = [];
    
    if (response.data.organic) {
      response.data.organic.forEach((result: any) => {
        results.push(`${result.title}: ${result.snippet || ""}`);
      });
    }

    if (response.data.peopleAlsoAsk) {
      response.data.peopleAlsoAsk.forEach((item: any) => {
        results.push(`Q: ${item.question} - ${item.snippet || ""}`);
      });
    }

    return results;
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
}

// Research company information
async function researchCompany(company: string): Promise<string[]> {
  const queries = [
    `${company} interview process experience`,
    `${company} company culture work environment`,
    `${company} interview questions glassdoor`,
    `${company} recent news 2024 2025`,
  ];

  const allResults: string[] = [];
  for (const query of queries) {
    const results = await searchWeb(query);
    allResults.push(...results);
  }

  return allResults;
}

// Research role-specific information
async function researchRole(title: string, company: string, skills: string[]): Promise<string[]> {
  const topSkills = skills.slice(0, 3).join(" ");
  const queries = [
    `${title} interview questions ${topSkills}`,
    `${title} ${company} interview experience`,
    `${title} common interview mistakes`,
    `${title} technical interview preparation`,
    `${topSkills} interview questions 2024 2025`,
  ];

  const allResults: string[] = [];
  for (const query of queries) {
    const results = await searchWeb(query);
    allResults.push(...results);
  }

  return allResults;
}

// Determine experience level
function determineExperienceLevel(profile: UserProfile): "Entry" | "Mid" | "Senior" {
  const years = profile.yearsOfExperience || profile.experience.length;
  if (years <= 2) return "Entry";
  if (years <= 5) return "Mid";
  return "Senior";
}

// Main function to generate interview prep
export async function generateInterviewPrep(
  job: JobDetails,
  userProfile: UserProfile
): Promise<InterviewPrepResult> {
  console.log(`\n🎯 Generating interview prep for ${job.title} at ${job.company}`);
  
  const experienceLevel = determineExperienceLevel(userProfile);
  const userSkills = userProfile.skills.map(s => s.name);
  const jobSkills = job.skills || [];
  
  // Step 1: Research the company
  console.log("📊 Researching company...");
  const companyResearch = await researchCompany(job.company);
  
  // Step 2: Research the role
  console.log("🔍 Researching role and technologies...");
  const roleResearch = await researchRole(job.title, job.company, jobSkills);
  
  // Step 3: Use Gemini to generate comprehensive prep materials
  console.log("🤖 Generating interview preparation with AI...");
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `You are an expert career coach and interview preparation specialist. Generate a comprehensive interview preparation guide based on the following information.

## Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description}
- Required Skills: ${jobSkills.join(", ")}
- Location: ${job.location || "Not specified"}

## Candidate Profile:
- Experience Level: ${experienceLevel}
- Skills: ${userSkills.join(", ")}
- Experience: ${userProfile.experience.map(e => `${e.role} at ${e.company}`).join("; ")}

## Research Data (from web search):
### Company Research:
${companyResearch.slice(0, 15).join("\n")}

### Role Research:
${roleResearch.slice(0, 15).join("\n")}

## Your Task:
Generate a comprehensive interview preparation guide in the following JSON format. Be specific, actionable, and tailored to this exact role and company.

IMPORTANT: 
- Generate questions appropriate for ${experienceLevel} level candidates
- Focus on the specific technologies mentioned: ${jobSkills.join(", ")}
- Include real, practical questions that are commonly asked
- Provide actionable study materials

Return ONLY valid JSON (no markdown, no code blocks):

{
  "companyInsights": {
    "overview": "2-3 sentence company overview",
    "culture": "Description of company culture and values",
    "interviewProcess": "Typical interview process at this company",
    "recentNews": ["Recent news item 1", "Recent news item 2", "Recent news item 3"]
  },
  "roleInsights": {
    "overview": "What this role entails",
    "dayToDay": "Typical day-to-day responsibilities",
    "growthPath": "Career growth opportunities",
    "salaryRange": "Expected salary range for this role"
  },
  "techStackAnalysis": {
    "requiredTechnologies": ["Must-know tech 1", "Must-know tech 2"],
    "niceToHave": ["Good to know 1", "Good to know 2"],
    "trendingInField": ["Trending tech 1", "Trending tech 2"]
  },
  "topics": [
    {
      "title": "Topic Name (e.g., React Fundamentals)",
      "description": "Why this topic is important for this role",
      "importance": "High",
      "keyConceptsToReview": ["Concept 1", "Concept 2", "Concept 3"],
      "commonMistakes": ["Common mistake 1", "Common mistake 2"],
      "resources": ["Resource or article to study"],
      "questions": [
        {
          "question": "Specific interview question?",
          "difficulty": "Medium",
          "type": "Technical",
          "topic": "Topic Name",
          "hints": ["Hint 1", "Hint 2"],
          "sampleAnswer": "A good answer would cover...",
          "whyAsked": "Why interviewers ask this question"
        }
      ]
    }
  ],
  "studyPlan": {
    "week1": ["Study task 1", "Study task 2", "Study task 3"],
    "week2": ["Study task 4", "Study task 5", "Study task 6"],
    "lastDays": ["Final prep task 1", "Final prep task 2"]
  },
  "tips": ["Interview tip 1", "Interview tip 2", "Interview tip 3"],
  "redFlags": ["Red flag to watch for 1", "Red flag 2"],
  "questionsToAsk": ["Question to ask interviewer 1", "Question 2", "Question 3"]
}

Generate at least 4-5 topics with 3-5 questions each. Make questions realistic and commonly asked in real interviews.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const prepData = JSON.parse(text);
    
    return {
      jobTitle: job.title,
      company: job.company,
      companyInsights: prepData.companyInsights,
      roleInsights: prepData.roleInsights,
      techStackAnalysis: prepData.techStackAnalysis,
      topics: prepData.topics,
      studyPlan: prepData.studyPlan,
      tips: prepData.tips,
      redFlags: prepData.redFlags,
      questionsToAsk: prepData.questionsToAsk,
    };
  } catch (error) {
    console.error("Error generating interview prep:", error);
    throw new Error("Failed to generate interview preparation materials");
  }
}

// Quick prep for when user doesn't have much time
export async function generateQuickPrep(
  job: JobDetails,
  userProfile: UserProfile
): Promise<{ topQuestions: InterviewQuestion[]; quickTips: string[]; mustKnow: string[] }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const experienceLevel = determineExperienceLevel(userProfile);
  const jobSkills = job.skills || [];
  
  const prompt = `Generate a quick interview prep (15-minute study guide) for:
Role: ${job.title} at ${job.company}
Skills needed: ${jobSkills.join(", ")}
Candidate level: ${experienceLevel}

Return ONLY valid JSON:
{
  "topQuestions": [
    {
      "question": "Most likely interview question",
      "difficulty": "Medium",
      "type": "Technical",
      "topic": "Topic",
      "hints": ["Quick hint"],
      "sampleAnswer": "Brief answer outline",
      "whyAsked": "Why this is asked"
    }
  ],
  "quickTips": ["Tip 1", "Tip 2", "Tip 3"],
  "mustKnow": ["Must know concept 1", "Must know concept 2", "Must know concept 3"]
}

Generate 5 top questions and 5 quick tips.`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quick prep:", error);
    throw new Error("Failed to generate quick prep");
  }
}
