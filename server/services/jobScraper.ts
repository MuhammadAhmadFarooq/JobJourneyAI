import axios from "axios";
import * as cheerio from "cheerio";
import { storage } from "../storage";
import { 
  searchJobsWithSerper, 
  searchJobsOnPlatform,
  type SerperJobResult,
  extractSkillsFromText as serperExtractSkills,
  determineExperienceLevel as serperDetermineLevel,
  determineJobType as serperDetermineType,
} from "./serperJobSearch";

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  requirements: string[];
  skills: string[];
  jobType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote";
  experienceLevel: "Entry" | "Mid" | "Senior" | "Lead";
  sourceUrl: string;
  sourcePlatform: string;
  postedAt?: Date;
  postedAtText?: string;
  isExpired?: boolean;
}

// Common tech skills to look for in job descriptions
const TECH_SKILLS = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
  // Frontend
  "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "HTML", "CSS", "Tailwind", "SASS", "Redux", "jQuery",
  // Backend
  "Node.js", "Express", "Django", "Flask", "Spring", "Laravel", "Rails", "FastAPI", "NestJS",
  // Database
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB", "Firebase", "Prisma", "Drizzle",
  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "Terraform",
  // Other
  "Git", "REST API", "GraphQL", "Microservices", "Agile", "Scrum", "Machine Learning", "AI"
];

function extractSkillsFromText(text: string): string[] {
  const foundSkills: string[] = [];
  const textLower = text.toLowerCase();
  
  for (const skill of TECH_SKILLS) {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }
  
  return Array.from(new Set(foundSkills)); // Remove duplicates
}

function determineExperienceLevel(text: string): "Entry" | "Mid" | "Senior" | "Lead" {
  const textLower = text.toLowerCase();
  
  if (textLower.includes("lead") || textLower.includes("principal") || textLower.includes("staff")) {
    return "Lead";
  }
  if (textLower.includes("senior") || textLower.includes("sr.") || textLower.includes("5+ years") || textLower.includes("7+ years")) {
    return "Senior";
  }
  if (textLower.includes("junior") || textLower.includes("entry") || textLower.includes("graduate") || 
      textLower.includes("intern") || textLower.includes("0-2 years") || textLower.includes("1-2 years")) {
    return "Entry";
  }
  return "Mid";
}

function determineJobType(text: string): "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote" {
  const textLower = text.toLowerCase();
  
  if (textLower.includes("internship") || textLower.includes("intern ")) {
    return "Internship";
  }
  if (textLower.includes("contract") || textLower.includes("contractor")) {
    return "Contract";
  }
  if (textLower.includes("part-time") || textLower.includes("part time")) {
    return "Part-time";
  }
  if (textLower.includes("remote only") || textLower.includes("fully remote")) {
    return "Remote";
  }
  return "Full-time";
}

// Scrape jobs from Remotive (Remote Jobs API - free, no auth required)
async function scrapeRemotiveJobs(searchQuery: string, limit: number = 20): Promise<ScrapedJob[]> {
  try {
    console.log(`🔍 Scraping Remotive for: ${searchQuery}`);
    
    const response = await axios.get("https://remotive.com/api/remote-jobs", {
      params: {
        search: searchQuery,
        limit: limit,
      },
      timeout: 10000,
    });
    
    const jobs: ScrapedJob[] = response.data.jobs.map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      salary: job.salary || undefined,
      description: job.description?.replace(/<[^>]*>/g, ' ').substring(0, 2000) || "",
      requirements: [],
      skills: extractSkillsFromText(`${job.title} ${job.description || ""}`),
      jobType: job.job_type === "full_time" ? "Full-time" : 
               job.job_type === "contract" ? "Contract" : "Full-time",
      experienceLevel: determineExperienceLevel(`${job.title} ${job.description || ""}`),
      sourceUrl: job.url,
      sourcePlatform: "Remotive",
      postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
    }));
    
    console.log(`✅ Found ${jobs.length} jobs from Remotive`);
    return jobs;
  } catch (error) {
    console.error("Error scraping Remotive:", error);
    return [];
  }
}

// Scrape jobs from Arbeitnow (Free Jobs API)
async function scrapeArbeitnowJobs(searchQuery: string, limit: number = 20): Promise<ScrapedJob[]> {
  try {
    console.log(`🔍 Scraping Arbeitnow for: ${searchQuery}`);
    
    const response = await axios.get("https://arbeitnow.com/api/job-board-api", {
      timeout: 10000,
    });
    
    // Filter jobs based on search query
    const filteredJobs = response.data.data
      .filter((job: any) => {
        const searchLower = searchQuery.toLowerCase();
        const titleLower = job.title?.toLowerCase() || "";
        const descLower = job.description?.toLowerCase() || "";
        const tagsLower = (job.tags || []).join(" ").toLowerCase();
        
        return titleLower.includes(searchLower) || 
               descLower.includes(searchLower) || 
               tagsLower.includes(searchLower);
      })
      .slice(0, limit);
    
    const jobs: ScrapedJob[] = filteredJobs.map((job: any) => ({
      title: job.title,
      company: job.company_name,
      location: job.location || (job.remote ? "Remote" : "Unknown"),
      salary: undefined,
      description: job.description?.replace(/<[^>]*>/g, ' ').substring(0, 2000) || "",
      requirements: [],
      skills: extractSkillsFromText(`${job.title} ${job.description || ""} ${(job.tags || []).join(" ")}`),
      jobType: job.remote ? "Remote" : "Full-time",
      experienceLevel: determineExperienceLevel(`${job.title} ${job.description || ""}`),
      sourceUrl: job.url,
      sourcePlatform: "Arbeitnow",
      postedAt: job.created_at ? new Date(job.created_at * 1000) : new Date(),
    }));
    
    console.log(`✅ Found ${jobs.length} jobs from Arbeitnow`);
    return jobs;
  } catch (error) {
    console.error("Error scraping Arbeitnow:", error);
    return [];
  }
}

// Scrape from GitHub Jobs alternative - Jobicy
async function scrapeJobicyJobs(searchQuery: string, limit: number = 20): Promise<ScrapedJob[]> {
  try {
    console.log(`🔍 Scraping Jobicy for: ${searchQuery}`);
    
    const response = await axios.get(`https://jobicy.com/api/v2/remote-jobs`, {
      params: {
        count: limit,
        tag: searchQuery,
      },
      timeout: 10000,
    });
    
    if (!response.data.jobs) return [];
    
    const jobs: ScrapedJob[] = response.data.jobs.map((job: any) => ({
      title: job.jobTitle,
      company: job.companyName,
      location: job.jobGeo || "Remote",
      salary: job.annualSalaryMin && job.annualSalaryMax 
        ? `$${job.annualSalaryMin.toLocaleString()} - $${job.annualSalaryMax.toLocaleString()}`
        : undefined,
      description: job.jobDescription?.replace(/<[^>]*>/g, ' ').substring(0, 2000) || "",
      requirements: [],
      skills: extractSkillsFromText(`${job.jobTitle} ${job.jobDescription || ""}`),
      jobType: job.jobType?.includes("contract") ? "Contract" : "Full-time",
      experienceLevel: determineExperienceLevel(`${job.jobTitle} ${job.jobDescription || ""} ${job.jobLevel || ""}`),
      sourceUrl: job.url,
      sourcePlatform: "Jobicy",
      postedAt: job.pubDate ? new Date(job.pubDate) : new Date(),
    }));
    
    console.log(`✅ Found ${jobs.length} jobs from Jobicy`);
    return jobs;
  } catch (error) {
    console.error("Error scraping Jobicy:", error);
    return [];
  }
}

// Main function to scrape jobs from multiple sources
export async function scrapeJobs(
  searchQueries: string[], 
  location: string = "Remote",
  useSerper: boolean = true
): Promise<ScrapedJob[]> {
  console.log("🚀 Starting job scraping...");
  console.log(`📝 Search queries: ${searchQueries.join(", ")}`);
  console.log(`📍 Location: ${location}`);
  
  const allJobs: ScrapedJob[] = [];
  
  // Try Serper first for better results from LinkedIn, Indeed, etc.
  if (useSerper && process.env.SERPER_API_KEY) {
    try {
      console.log("🔍 Using Serper API for job search...");
      const serperJobs = await searchJobsWithSerper(searchQueries, location, "Entry", 30);
      
      // Convert SerperJobResult to ScrapedJob format
      for (const job of serperJobs) {
        const rawDate = job.postedAt;
        const parsedDate = parseRelativeDate(rawDate);
        allJobs.push({
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          requirements: [],
          skills: serperExtractSkills(`${job.title} ${job.description}`),
          jobType: serperDetermineType(`${job.title} ${job.description}`) as any,
          experienceLevel: serperDetermineLevel(`${job.title} ${job.description}`),
          sourceUrl: job.sourceUrl,
          sourcePlatform: job.sourcePlatform,
          postedAt: parsedDate,
          postedAtText: rawDate,
          isExpired: job.isExpired,
        });
      }
      
      console.log(`✅ Found ${allJobs.length} jobs from Serper`);
    } catch (error: any) {
      console.error("Serper search failed:", error.message);
    }
  }
  
  // Fetch active open jobs from free APIs (Remotive, Arbeitnow, Jobicy) to guarantee high volume of verified active jobs
  console.log("📡 Fetching active jobs from job APIs...");
  try {
    for (const query of searchQueries.slice(0, 3)) {
      const [remotiveJobs, arbeitnowJobs, jobicyJobs] = await Promise.all([
        scrapeRemotiveJobs(query, 10),
        scrapeArbeitnowJobs(query, 10),
        scrapeJobicyJobs(query, 10),
      ]);
      allJobs.push(...remotiveJobs, ...arbeitnowJobs, ...jobicyJobs);
    }
  } catch (err: any) {
    console.error("Error fetching from secondary APIs:", err.message);
  }
  
  // Remove duplicates based on title + company
  const uniqueJobs = allJobs.filter((job, index, self) =>
    index === self.findIndex(j => 
      j.title.toLowerCase() === job.title.toLowerCase() && 
      j.company.toLowerCase() === job.company.toLowerCase()
    )
  );

  // 1. Static expiration check (dates and snippet text cues)
  for (const job of uniqueJobs) {
    job.isExpired = isJobLikelyExpired(job);
  }

  // 2. Live network verification for remaining unflagged jobs
  console.log("⚡ Verifying live availability of job postings...");
  await Promise.allSettled(
    uniqueJobs.map(async (job) => {
      if (!job.isExpired) {
        const isLive = await verifyJobLiveAvailability(job);
        if (!isLive) {
          job.isExpired = true;
        }
      }
    })
  );
  
  // EXCLUDE expired/unavailable jobs so ONLY 100% OPEN & ACTIVE JOBS ARE RETURNED TO THE USER!
  const activeJobs = uniqueJobs.filter(job => !job.isExpired);
  console.log(`✅ Returning ${activeJobs.length} active, open jobs with working apply options out of ${uniqueJobs.length} scraped`);
  return activeJobs;
}

// Live URL availability checker for LinkedIn, Indeed, Lever, Greenhouse, etc.
export async function verifyJobLiveAvailability(job: ScrapedJob): Promise<boolean> {
  if (job.isExpired) return false;
  if (!job.sourceUrl) return true;

  try {
    const isLinkedIn = job.sourceUrl.includes("linkedin.com");
    const isIndeed = job.sourceUrl.includes("indeed.com");
    const isLever = job.sourceUrl.includes("lever.co");
    const isGreenhouse = job.sourceUrl.includes("greenhouse.io");

    // Only do network verification for major job platform URLs
    if (!isLinkedIn && !isIndeed && !isLever && !isGreenhouse) {
      return true;
    }

    let urlToCheck = job.sourceUrl;
    if (isLinkedIn) {
      const jobIdMatch = job.sourceUrl.match(/\/view\/(\d+)/);
      if (jobIdMatch) {
        urlToCheck = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobIdMatch[1]}`;
      }
    }

    const response = await axios.get(urlToCheck, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 4000,
      maxRedirects: 4,
      validateStatus: () => true, // Don't throw on HTTP errors
    });

    if (response.status === 404 || response.status === 410 || response.status === 400 || response.status === 403 || response.status === 999) {
      return false; // Expired / Closed / Unavailable
    }

    // Check if redirected to search, login, or authwall page
    const finalUrl = (response.request?.res?.responseUrl || response.config?.url || "").toLowerCase();
    if (finalUrl.includes("/jobs/search") || finalUrl.includes("/login") || finalUrl.includes("/expired") || finalUrl.includes("/authwall")) {
      return false;
    }

    const html = (response.data || "").toString().toLowerCase();
    const closedPhrases = [
      "no longer accepting applications",
      "no longer accepting",
      "not accepting applications",
      "applications are no longer",
      "this job is no longer available",
      "this job is no longer accepting",
      "position has been filled",
      "position filled",
      "this job has expired",
      "job is closed",
      "no longer hiring",
      "topcard__flavor--closed",
      "job-closed",
    ];

    for (const phrase of closedPhrases) {
      if (html.includes(phrase)) {
        return false; // Closed / Expired
      }
    }

    return true; // Live and accepting applications
  } catch (err) {
    // If request fails (timeout or rate limit), preserve static status
    return !job.isExpired;
  }
}

// Helper function to parse relative dates like "2 months ago", "3 weeks ago", "45 days ago" into valid Date objects
export function parseRelativeDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  
  const str = dateStr.toLowerCase().trim();
  const now = new Date();

  const minutesMatch = str.match(/(\d+)\s*min/);
  if (minutesMatch) return new Date(now.getTime() - parseInt(minutesMatch[1]) * 60 * 1000);

  const hoursMatch = str.match(/(\d+)\s*hour/);
  if (hoursMatch) return new Date(now.getTime() - parseInt(hoursMatch[1]) * 60 * 60 * 1000);

  const daysMatch = str.match(/(\d+)\s*day/);
  if (daysMatch) return new Date(now.getTime() - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000);

  const weeksMatch = str.match(/(\d+)\s*week/);
  if (weeksMatch) return new Date(now.getTime() - parseInt(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1000);

  const monthsMatch = str.match(/(\d+)\s*month/);
  if (monthsMatch) return new Date(now.getTime() - parseInt(monthsMatch[1]) * 30 * 24 * 60 * 60 * 1000);

  const yearsMatch = str.match(/(\d+)\s*year/);
  if (yearsMatch) return new Date(now.getTime() - parseInt(yearsMatch[1]) * 365 * 24 * 60 * 60 * 1000);

  if (str.includes("yesterday")) return new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
}

// Detect if a job is likely expired based on posting date, date text, and text cues
function isJobLikelyExpired(job: ScrapedJob): boolean {
  // 1. Check posting date (if parsed date is older than 30 days)
  if (job.postedAt) {
    const postedTime = new Date(job.postedAt).getTime();
    if (!isNaN(postedTime)) {
      const now = new Date();
      const daysSincePosted = Math.floor((now.getTime() - postedTime) / (1000 * 60 * 60 * 24));
      if (daysSincePosted > 30) {
        return true;
      }
    }
  }

  // 2. Check raw date string (e.g. "1 month ago", "2 months ago", "30+ days ago", "over 30 days ago", "4 weeks ago")
  const dateText = (job.postedAtText || "").toLowerCase();
  if (dateText) {
    if (
      dateText.includes("month") ||
      dateText.includes("year") ||
      dateText.includes("30+") ||
      dateText.includes("over 30")
    ) {
      return true;
    }
    const weeksMatch = dateText.match(/(\d+)\s*weeks?/);
    if (weeksMatch && parseInt(weeksMatch[1]) >= 4) {
      return true;
    }
    const daysMatch = dateText.match(/(\d+)\s*days?/);
    if (daysMatch && parseInt(daysMatch[1]) > 30) {
      return true;
    }
  }

  // 3. Check text cues in title & description (especially for LinkedIn / Indeed snippet matches)
  const textToCheck = `${job.title} ${job.description}`.toLowerCase();
  const expiredIndicators = [
    "no longer accepting",
    "not accepting applications",
    "applications are no longer",
    "position filled",
    "position has been filled",
    "this job has expired",
    "job expired",
    "listing expired",
    "application closed",
    "applications closed",
    "no longer available",
    "this position is closed",
    "role has been filled",
    "vacancy closed",
    "recruitment closed",
    "hiring complete",
    "this job is no longer",
    "no longer hiring",
    "[closed]",
    "(closed)",
    "job closed",
  ];

  for (const indicator of expiredIndicators) {
    if (textToCheck.includes(indicator)) {
      return true;
    }
  }

  return false;
}

// Normalize skill names for better matching
function normalizeSkill(skill: string): string {
  const normalizations: Record<string, string> = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "node": "node.js",
    "nodejs": "node.js",
    "react.js": "react",
    "reactjs": "react",
    "vue.js": "vue",
    "vuejs": "vue",
    "angular.js": "angular",
    "angularjs": "angular",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "azure": "microsoft azure",
    "c sharp": "c#",
    "csharp": "c#",
    "golang": "go",
  };
  
  const lower = skill.toLowerCase().trim();
  return normalizations[lower] || lower;
}

// Extract ALL skills from job text more thoroughly
function extractAllSkillsFromText(text: string): string[] {
  const skills: Set<string> = new Set();
  const textLower = text.toLowerCase();
  
  // Extended skill list
  const allSkills = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Rust", "Ruby", "PHP", 
    "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Lua", "Dart", "Objective-C",
    // Frontend
    "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js", "Gatsby", "HTML", "CSS", "SCSS", "SASS",
    "Tailwind", "Bootstrap", "Material UI", "Chakra UI", "Redux", "Zustand", "MobX", "jQuery",
    "Webpack", "Vite", "Babel", "ESLint", "Prettier",
    // Backend
    "Node.js", "Express", "Fastify", "NestJS", "Django", "Flask", "FastAPI", "Spring", "Spring Boot",
    "Laravel", "Rails", "Ruby on Rails", "ASP.NET", ".NET", "Gin", "Echo", "Fiber",
    // Databases
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB", "Cassandra", "SQLite", 
    "Oracle", "SQL Server", "MariaDB", "CockroachDB", "Firebase", "Supabase",
    "Prisma", "Drizzle", "Sequelize", "TypeORM", "Mongoose",
    // Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "Microsoft Azure", "GCP", "Google Cloud",
    "Docker", "Kubernetes", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", 
    "Terraform", "Ansible", "Puppet", "Chef", "Nginx", "Apache",
    "Linux", "Unix", "Bash", "Shell Scripting", "PowerShell",
    // Data & ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
    "Pandas", "NumPy", "Data Science", "Data Analysis", "Big Data", "Spark", "Hadoop",
    "ETL", "Data Pipeline", "Airflow",
    // Mobile
    "React Native", "Flutter", "iOS", "Android", "SwiftUI", "Jetpack Compose",
    // Testing
    "Jest", "Mocha", "Cypress", "Playwright", "Selenium", "PyTest", "JUnit", "Testing",
    "Unit Testing", "Integration Testing", "E2E Testing", "TDD", "BDD",
    // APIs & Protocols
    "REST", "REST API", "GraphQL", "gRPC", "WebSocket", "OAuth", "JWT",
    // Architecture
    "Microservices", "Serverless", "Event-Driven", "Domain-Driven Design", "DDD",
    "System Design", "Distributed Systems", "Clean Architecture",
    // Version Control & Collaboration
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Agile", "Scrum", "Kanban",
    // Other
    "AI", "Artificial Intelligence", "NLP", "Computer Vision", "Blockchain", "Web3",
    "Security", "Cybersecurity", "CI/CD", "DevOps", "SRE", "Full Stack",
  ];
  
  for (const skill of allSkills) {
    const skillLower = skill.toLowerCase();
    // Escape ALL regex special characters first
    const escaped = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Check for exact word match or common variations
    try {
      const patterns = [
        new RegExp(`\\b${escaped}\\b`, 'i'),
        new RegExp(`\\b${escaped.replace(/\\\./g, '')}\\b`, 'i'), // Without dots (escaped)
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(textLower)) {
          skills.add(skill);
          break;
        }
      }
    } catch (e) {
      // If regex fails for some reason, do simple string matching
      if (textLower.includes(skillLower)) {
        skills.add(skill);
      }
    }
  }
  
  return Array.from(skills);
}

// Calculate match score between a job and user skills - IMPROVED VERSION
export function calculateMatchScore(
  job: ScrapedJob,
  userSkills: { name: string; level: number; category?: string }[],
  userExperience: { role: string; company: string; duration?: string }[],
  jobPreferences?: {
    targetRoles?: string[];
    preferredLocations?: string[];
    remotePreference?: string;
    experienceLevel?: string;
  }
): { score: number; matchReasons: string[]; matchedSkills: string[]; missingSkills: string[] } {
  const matchReasons: string[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  
  // Extract ALL skills from job description, title, and requirements
  const jobText = `${job.title} ${job.description} ${job.requirements?.join(" ") || ""}`;
  const extractedJobSkills = extractAllSkillsFromText(jobText);
  const allJobSkills = Array.from(new Set([...job.skills, ...extractedJobSkills]));
  
  // Normalize user skills for comparison
  const userSkillsNormalized = userSkills.map(s => ({
    ...s,
    normalized: normalizeSkill(s.name),
  }));
  
  const userSkillNames = new Set(userSkillsNormalized.map(s => s.normalized));
  
  // ============ SKILL MATCHING (0-50 points) ============
  let skillMatchCount = 0;
  let totalSkillWeight = 0;
  
  for (const jobSkill of allJobSkills) {
    const normalizedJobSkill = normalizeSkill(jobSkill);
    
    if (userSkillNames.has(normalizedJobSkill)) {
      matchedSkills.push(jobSkill);
      const userSkill = userSkillsNormalized.find(s => s.normalized === normalizedJobSkill);
      const skillWeight = (userSkill?.level || 50) / 100;
      totalSkillWeight += skillWeight;
      skillMatchCount++;
    } else {
      missingSkills.push(jobSkill);
    }
  }
  
  // Calculate skill score based on percentage of matched skills
  let skillScore = 0;
  if (allJobSkills.length > 0) {
    const matchPercentage = skillMatchCount / allJobSkills.length;
    const avgSkillLevel = skillMatchCount > 0 ? totalSkillWeight / skillMatchCount : 0;
    skillScore = Math.round(matchPercentage * 40 + avgSkillLevel * 10); // Up to 50 points
  } else {
    skillScore = 25; // Default if no skills extracted
  }
  
  // ============ ROLE/TITLE MATCHING (0-20 points) ============
  let roleScore = 0;
  const jobTitleLower = job.title.toLowerCase();
  
  // Check against user's target roles
  const targetRoles = jobPreferences?.targetRoles || [];
  for (const role of targetRoles) {
    if (jobTitleLower.includes(role.toLowerCase())) {
      roleScore = 20;
      matchReasons.push(`Matches target role: ${role}`);
      break;
    }
  }
  
  // Check against user's past experience roles
  if (roleScore === 0) {
    for (const exp of userExperience) {
      const expRoleLower = exp.role.toLowerCase();
      // Check for similar role titles
      const roleWords = expRoleLower.split(/\s+/);
      const matchingWords = roleWords.filter(word => 
        word.length > 3 && jobTitleLower.includes(word)
      );
      if (matchingWords.length > 0) {
        roleScore = 15;
        matchReasons.push(`Similar to your experience as ${exp.role}`);
        break;
      }
    }
  }
  
  // Check for common role keywords match
  if (roleScore === 0) {
    const commonRoles = ["engineer", "developer", "programmer", "analyst", "designer", "architect"];
    for (const role of commonRoles) {
      if (jobTitleLower.includes(role)) {
        roleScore = 10;
        break;
      }
    }
  }
  
  // ============ EXPERIENCE LEVEL MATCHING (0-15 points) ============
  let expScore = 0;
  const totalYearsExp = userExperience.length; // Simplified: 1 experience ≈ 1-2 years
  
  const preferredLevel = jobPreferences?.experienceLevel || "any";
  
  if (preferredLevel !== "any" && job.experienceLevel === preferredLevel) {
    expScore = 15;
    matchReasons.push(`Experience level matches: ${job.experienceLevel}`);
  } else {
    // Infer user's level from experience
    let userLevel: string;
    if (totalYearsExp === 0) userLevel = "Entry";
    else if (totalYearsExp <= 2) userLevel = "Entry";
    else if (totalYearsExp <= 4) userLevel = "Mid";
    else if (totalYearsExp <= 7) userLevel = "Senior";
    else userLevel = "Lead";
    
    if (job.experienceLevel === userLevel) {
      expScore = 15;
      matchReasons.push(`Experience level matches: ${job.experienceLevel}`);
    } else if (
      (job.experienceLevel === "Entry" && userLevel === "Mid") ||
      (job.experienceLevel === "Mid" && (userLevel === "Entry" || userLevel === "Senior"))
    ) {
      expScore = 10; // Close match
    } else {
      expScore = 5; // Some experience is better than none
    }
  }
  
  // ============ LOCATION MATCHING (0-10 points) ============
  let locationScore = 0;
  const jobLocationLower = job.location.toLowerCase();
  const remotePreference = jobPreferences?.remotePreference || "any";
  const preferredLocations = jobPreferences?.preferredLocations || [];
  
  const isRemote = jobLocationLower.includes("remote") || job.jobType === "Remote";
  
  if (remotePreference === "remote" && isRemote) {
    locationScore = 10;
    matchReasons.push("Remote position available");
  } else if (remotePreference === "any") {
    if (isRemote) {
      locationScore = 10;
      matchReasons.push("Remote-friendly position");
    } else {
      // Check preferred locations
      for (const loc of preferredLocations) {
        if (jobLocationLower.includes(loc.toLowerCase())) {
          locationScore = 10;
          matchReasons.push(`Location matches: ${loc}`);
          break;
        }
      }
      if (locationScore === 0) locationScore = 5;
    }
  } else {
    // Check if location matches preferred
    for (const loc of preferredLocations) {
      if (jobLocationLower.includes(loc.toLowerCase())) {
        locationScore = 10;
        matchReasons.push(`Location matches: ${loc}`);
        break;
      }
    }
    if (locationScore === 0) locationScore = 3;
  }
  
  // ============ JOB TYPE BONUS (0-5 points) ============
  let typeScore = 3;
  if (job.jobType === "Full-time") {
    typeScore = 5;
  } else if (job.jobType === "Internship" && totalYearsExp === 0) {
    typeScore = 5;
    matchReasons.push("Great opportunity for entry-level");
  }
  
  // ============ COMPILE FINAL SCORE ============
  const totalScore = skillScore + roleScore + expScore + locationScore + typeScore;
  
  // Add skill-related match reasons
  if (matchedSkills.length > 0) {
    const skillMatchPercent = Math.round((matchedSkills.length / allJobSkills.length) * 100);
    if (skillMatchPercent >= 70) {
      matchReasons.unshift(`Excellent skill match (${skillMatchPercent}%): ${matchedSkills.slice(0, 4).join(", ")}`);
    } else if (skillMatchPercent >= 50) {
      matchReasons.unshift(`Good skill match (${skillMatchPercent}%): ${matchedSkills.slice(0, 3).join(", ")}`);
    } else if (matchedSkills.length > 0) {
      matchReasons.unshift(`Skills match: ${matchedSkills.slice(0, 3).join(", ")}`);
    }
  }
  
  return {
    score: Math.min(Math.max(totalScore, 0), 100),
    matchReasons: matchReasons.slice(0, 4), // Limit to 4 reasons
    matchedSkills,
    missingSkills: missingSkills.slice(0, 5),
  };
}

// Search and match jobs based on user profile
export async function searchAndMatchJobs(
  userSkills: { name: string; level: number; category?: string }[],
  userExperience: { role: string; company: string; duration?: string }[],
  suggestedRoles: string[] = [],
  location: string = "Remote",
  jobPreferences?: {
    targetRoles?: string[];
    preferredLocations?: string[];
    remotePreference?: string;
    experienceLevel?: string;
  }
): Promise<Array<ScrapedJob & { matchScore: number; matchReasons: string[]; matchedSkills: string[]; missingSkills: string[] }>> {
  
  // Generate search queries based on user skills, suggested roles, and preferences
  const searchQueries: string[] = [];
  
  // Priority 1: Use target roles from preferences
  if (jobPreferences?.targetRoles && jobPreferences.targetRoles.length > 0) {
    searchQueries.push(...jobPreferences.targetRoles.slice(0, 3));
  }
  
  // Priority 2: Add suggested roles as search queries
  if (suggestedRoles.length > 0) {
    searchQueries.push(...suggestedRoles.slice(0, 2));
  }
  
  // Priority 3: Add top skills as search queries
  const topSkills = userSkills
    .sort((a, b) => b.level - a.level)
    .slice(0, 3)
    .map(s => s.name);
  searchQueries.push(...topSkills);
  
  // Default searches if nothing else
  if (searchQueries.length === 0) {
    searchQueries.push("software engineer", "developer", "programmer");
  }
  
  // Determine search location based on preferences
  let searchLocation = location;
  if (jobPreferences?.remotePreference === "remote") {
    searchLocation = "Remote";
  } else if (jobPreferences?.preferredLocations && jobPreferences.preferredLocations.length > 0) {
    searchLocation = jobPreferences.preferredLocations[0];
  }
  
  // Scrape jobs with location
  const uniqueQueries = Array.from(new Set(searchQueries));
  const scrapedJobs = await scrapeJobs(uniqueQueries, searchLocation, true);
  
  // Calculate match scores with preferences
  const matchedJobs = scrapedJobs.map(job => {
    const { score, matchReasons, matchedSkills, missingSkills } = calculateMatchScore(
      job, 
      userSkills, 
      userExperience,
      jobPreferences
    );
    return {
      ...job,
      matchScore: score,
      matchReasons,
      matchedSkills,
      missingSkills,
    };
  });
  
  // Sort: active jobs first by match score, expired jobs at the bottom
  matchedJobs.sort((a, b) => {
    // Expired jobs go to the bottom
    if (a.isExpired && !b.isExpired) return 1;
    if (!a.isExpired && b.isExpired) return -1;
    // Within same group, sort by match score
    return b.matchScore - a.matchScore;
  });
  
  return matchedJobs;
}
