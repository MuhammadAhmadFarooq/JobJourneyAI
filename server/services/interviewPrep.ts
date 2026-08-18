import { generateContentWithAI } from "./aiProvider";
import axios from "axios";

const SERPER_API_KEY = process.env.SERPER_API_KEY || "";
const interviewPrepCooldownUntil = new Map<string, number>();

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

type ExperienceLevel = "Entry" | "Mid" | "Senior";

interface InterviewQuestion {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "Technical" | "Behavioral" | "System Design" | "Coding" | "Situational";
  topic: string;
  hints: string[];
  sampleAnswer?: string;
  whyAsked: string;
}

interface YouTubeVideo {
  title: string;
  channel: string;
  url: string;
  thumbnail?: string;
}

interface InterviewTopic {
  title: string;
  description: string;
  importance: "High" | "Medium" | "Low";
  keyConceptsToReview: string[];
  commonMistakes: string[];
  resources: string[];
  youtubeVideo?: YouTubeVideo;
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

// Search YouTube for the best tutorial/explanation video
async function searchYouTubeVideo(topic: string, context: string): Promise<YouTubeVideo | null> {
  const searchQuery = `${topic} ${context} tutorial interview`;
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  const fallbackVideo: YouTubeVideo = {
    title: `${topic} - Tutorial & Interview Guide`,
    channel: "YouTube Search",
    url: fallbackUrl,
  };

  if (!SERPER_API_KEY) {
    return fallbackVideo;
  }

  try {
    // Use Serper to search YouTube
    const response = await axios.post(
      "https://google.serper.dev/videos",
      {
        q: searchQuery,
        num: 5,
      },
      {
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const videos = response.data.videos || [];
    
    // Find the best video (prefer longer, educational content)
    for (const video of videos) {
      const link = video.link || "";
      
      // Only return YouTube videos
      if (link.includes("youtube.com") || link.includes("youtu.be")) {
        return {
          title: video.title || `${topic} Tutorial Video`,
          channel: video.channel || "YouTube",
          url: link,
          thumbnail: video.imageUrl || video.thumbnail,
        };
      }
    }

    return fallbackVideo;
  } catch (error) {
    console.error("YouTube search error:", error);
    return fallbackVideo;
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
function determineExperienceLevel(profile: UserProfile): ExperienceLevel {
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
  
  // Step 3: Use AI to generate comprehensive prep materials
  console.log("🤖 Generating interview preparation with AI...");
  
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
    let text = await generateContentWithAI(prompt);
    
    // Clean up the response
    text = text.replaceAll("```json\n", "").replaceAll("```\n", "").replaceAll("```", "").trim();
    
    const prepData = JSON.parse(text);
    
    // Step 4: Search YouTube videos for each topic
    console.log("🎬 Finding YouTube tutorials for each topic...");
    const topicsWithVideos = await Promise.all(
      prepData.topics.map(async (topic: InterviewTopic) => {
        const video = await searchYouTubeVideo(topic.title, job.title);
        return {
          ...topic,
          youtubeVideo: video,
        };
      })
    );
    
    return {
      jobTitle: job.title,
      company: job.company,
      companyInsights: prepData.companyInsights,
      roleInsights: prepData.roleInsights,
      techStackAnalysis: prepData.techStackAnalysis,
      topics: topicsWithVideos,
      studyPlan: prepData.studyPlan,
      tips: prepData.tips,
      redFlags: prepData.redFlags,
      questionsToAsk: prepData.questionsToAsk,
    };
  } catch (error: any) {
    console.error("Error generating interview prep with AI:", error?.message || error);
    console.warn("Falling back to local interview prep generator.");
    return buildFallbackInterviewPrep(job, userProfile, experienceLevel, jobSkills, companyResearch, roleResearch);
  }
}

// Quick prep for when user doesn't have much time
export async function generateQuickPrep(
  job: JobDetails,
  userProfile: UserProfile
): Promise<{ topQuestions: InterviewQuestion[]; quickTips: string[]; mustKnow: string[] }> {
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
    let text = await generateContentWithAI(prompt);
    text = text.replaceAll("```json\n", "").replaceAll("```\n", "").replaceAll("```", "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error generating quick prep with AI:", error?.message || error);
    console.warn("Falling back to local quick prep generator.");
    return buildFallbackQuickPrep(job, userProfile);
  }
}

function buildFallbackInterviewPrep(
  job: JobDetails,
  userProfile: UserProfile,
  experienceLevel: "Entry" | "Mid" | "Senior",
  jobSkills: string[],
  companyResearch: string[],
  roleResearch: string[]
): InterviewPrepResult {
  const topSkills = userProfile.skills.map((s) => s.name).slice(0, 5);
  const requiredTechnologies = jobSkills.length > 0 ? jobSkills : topSkills.slice(0, 3);
  const topicSeed = requiredTechnologies[0] || job.title || "Interview Prep";

  return {
    jobTitle: job.title,
    company: job.company,
    companyInsights: {
      overview: summarizeResearch(companyResearch, `${job.company} is a company hiring for ${job.title}.`),
      culture: "Focus on teamwork, product thinking, and demonstrating practical impact.",
      interviewProcess: "Expect an initial screen, technical discussion, and behavioral round.",
      recentNews: takeResearchItems(companyResearch, 3),
    },
    roleInsights: {
      overview: `This ${job.title} role focuses on delivering reliable, maintainable solutions aligned with ${job.company}'s needs.`,
      dayToDay: "Building features, debugging issues, reviewing code, and collaborating with teammates.",
      growthPath: "Grow into senior ownership, technical leadership, or architecture-focused roles.",
      salaryRange: `Varies by region and experience level; benchmark against similar ${experienceLevel.toLowerCase()} roles.`,
    },
    techStackAnalysis: {
      requiredTechnologies,
      niceToHave: topSkills.filter((skill) => !requiredTechnologies.includes(skill)).slice(0, 4),
      trendingInField: uniqueList(["TypeScript", "Automation", "Testing", "Cloud-native tooling", "AI-assisted workflows"]),
    },
    topics: buildFallbackTopics(requiredTechnologies, topicSeed, experienceLevel, roleResearch),
    studyPlan: {
      week1: [
        `Review ${requiredTechnologies.join(", ") || job.title} fundamentals`,
        `Practice 2-3 behavioral questions for a ${experienceLevel.toLowerCase()} candidate`,
        "Prepare a concise 'tell me about yourself' answer",
      ],
      week2: [
        "Solve common role-specific interview questions",
        "Do a mock interview with timed answers",
        "Review the company and questions to ask the interviewer",
      ],
      lastDays: [
        "Rehearse your strongest project stories",
        "Review weak areas and quick facts",
      ],
    },
    tips: [
      "Answer with structure: situation, action, result.",
      "Show impact with metrics whenever possible.",
      "If you do not know an answer, explain your reasoning clearly.",
    ],
    redFlags: [
      "Overly vague answers with no examples.",
      "Not being able to explain your own projects.",
      "Ignoring fundamentals in favor of buzzwords.",
    ],
    questionsToAsk: [
      `What does success look like for this ${job.title} role in the first 90 days?`,
      `How does ${job.company} support learning and growth on the team?`,
      "What are the biggest challenges the team is facing right now?",
    ],
  };
}

function buildFallbackQuickPrep(job: JobDetails, userProfile: UserProfile): {
  topQuestions: InterviewQuestion[];
  quickTips: string[];
  mustKnow: string[];
} {
  const skills = userProfile.skills.map((s) => s.name).slice(0, 4);
  const primarySkill = skills[0] || job.skills?.[0] || job.title;

  return {
    topQuestions: [
      createQuestion(`Tell me about yourself for a ${job.title} role.`, primarySkill),
      createQuestion(`Explain a project where you used ${primarySkill}.`, primarySkill, "Technical"),
      createQuestion(`How do you handle conflict or disagreement on a team?`, "teamwork", "Behavioral"),
      createQuestion(`What would you do if you had to learn ${job.title} skills quickly?`, primarySkill, "Situational"),
      createQuestion(`Describe a challenge you solved end-to-end.`, "problem-solving", "Behavioral"),
    ],
    quickTips: [
      "Use short structured answers.",
      "Have one project story ready.",
      "Mention tradeoffs and lessons learned.",
      "Review the job description before the interview.",
      "Ask one thoughtful question at the end.",
    ],
    mustKnow: uniqueList([
      ...skills,
      ...(job.skills || []),
      "core responsibilities",
      "company basics",
      "your own resume stories",
    ]),
  };
}

function buildFallbackTopics(
  requiredTechnologies: string[],
  topicSeed: string,
  experienceLevel: "Entry" | "Mid" | "Senior",
  roleResearch: string[]
): InterviewTopic[] {
  const techTopics = uniqueList(requiredTechnologies.length > 0 ? requiredTechnologies : [topicSeed]).slice(0, 4);

  const techBasedTopics: InterviewTopic[] = techTopics.map((tech) => ({
      title: `${tech} Fundamentals`,
      description: `Core knowledge you should know for a ${experienceLevel.toLowerCase()} role.`,
      importance: "High",
      keyConceptsToReview: [
        `${tech} syntax and core ideas`,
        `${tech} best practices`,
        `Common ${tech} interview pitfalls`,
      ],
      commonMistakes: [
        `Not explaining why you chose ${tech}`,
        `Skipping fundamentals and jumping to advanced details`,
      ],
      resources: takeResearchItems(roleResearch, 2),
      questions: [
        createQuestion(`What are the core concepts of ${tech}?`, tech, "Technical"),
        createQuestion(`How have you used ${tech} in a real project?`, tech, "Technical"),
        createQuestion(`What is one challenge you faced with ${tech} and how did you solve it?`, tech, "Technical"),
      ],
    }));

  const behavioralTopic: InterviewTopic = {
    title: "Behavioral Interview",
    description: "Questions about teamwork, conflict, ownership, and communication.",
    importance: "High",
    keyConceptsToReview: ["STAR method", "Conflict resolution", "Ownership", "Communication"],
    commonMistakes: ["Rambling without structure", "No real examples", "Blaming others"],
    resources: ["Use STAR stories from your own experience"],
    questions: [
      createQuestion("Tell me about a time you handled a difficult teammate.", "behavioral", "Behavioral"),
      createQuestion("Tell me about a time you failed and what you learned.", "behavioral", "Behavioral"),
      createQuestion("Tell me about a time you took ownership of a problem.", "behavioral", "Behavioral"),
    ],
  };

  const problemSolvingTopic: InterviewTopic = {
    title: "Problem Solving",
    description: "How you think through ambiguous problems and debugging tasks.",
    importance: "High",
    keyConceptsToReview: ["Breaking down problems", "Debugging", "Tradeoffs", "Communication"],
    commonMistakes: ["Jumping to conclusions", "Not clarifying requirements", "No structure"],
    resources: ["Practice explaining your thinking out loud"],
    questions: [
      createQuestion("How would you approach a system or code issue you have never seen before?", "problem-solving", "Situational"),
      createQuestion("Walk me through how you debug production issues.", "problem-solving", "Situational"),
      createQuestion("How do you prioritize tasks when everything feels urgent?", "problem-solving", "Situational"),
    ],
  };

  return [...techBasedTopics, behavioralTopic, problemSolvingTopic];
}

function createQuestion(
  question: string,
  topic: string,
  type: InterviewQuestion["type"] = "Technical"
): InterviewQuestion {
  return {
    question,
    difficulty: "Medium",
    type,
    topic,
    hints: ["Explain your reasoning", "Use a real example if possible"],
    sampleAnswer: "Start with a short explanation, then give a concrete example and finish with the result.",
    whyAsked: "Interviewers want to see your understanding, communication, and practical experience.",
  };
}

function summarizeResearch(items: string[], fallback: string): string {
  const firstTwo = takeResearchItems(items, 2);
  return firstTwo.length > 0 ? firstTwo.join(" ") : fallback;
}

function takeResearchItems(items: string[], count: number): string[] {
  return items.slice(0, count).map((item) => item.trim()).filter(Boolean);
}

function uniqueList(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}
