import axios from "axios";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export interface SerperJobResult {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  sourceUrl: string;
  sourcePlatform: string;
  postedAt?: string;
  jobType?: string;
  highlights?: string[];
  isExpired?: boolean;
}

// Common tech skills to extract
const TECH_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
  "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt", "HTML", "CSS", "Tailwind", "SASS", "Redux",
  "Node.js", "Express", "Django", "Flask", "Spring", "Laravel", "Rails", "FastAPI", "NestJS",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "DynamoDB", "Firebase", "Prisma",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "Terraform",
  "Git", "REST API", "GraphQL", "Microservices", "Machine Learning", "AI", "Deep Learning"
];

function extractSkillsFromText(text: string): string[] {
  const foundSkills: string[] = [];
  const textLower = text.toLowerCase();
  
  for (const skill of TECH_SKILLS) {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }
  
  return Array.from(new Set(foundSkills));
}

function determineExperienceLevel(text: string): "Entry" | "Mid" | "Senior" | "Lead" {
  const textLower = text.toLowerCase();
  
  if (textLower.includes("lead") || textLower.includes("principal") || textLower.includes("staff") || textLower.includes("director")) {
    return "Lead";
  }
  if (textLower.includes("senior") || textLower.includes("sr.") || textLower.includes("sr ") || 
      textLower.includes("5+ years") || textLower.includes("7+ years") || textLower.includes("10+ years")) {
    return "Senior";
  }
  if (textLower.includes("junior") || textLower.includes("jr.") || textLower.includes("entry") || 
      textLower.includes("graduate") || textLower.includes("new grad") || textLower.includes("intern") || 
      textLower.includes("0-2 years") || textLower.includes("1-2 years") || textLower.includes("fresher")) {
    return "Entry";
  }
  return "Mid";
}

function determineJobType(text: string): "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote" {
  const textLower = text.toLowerCase();
  
  if (textLower.includes("internship") || textLower.includes("intern ")) {
    return "Internship";
  }
  if (textLower.includes("contract") || textLower.includes("contractor") || textLower.includes("freelance")) {
    return "Contract";
  }
  if (textLower.includes("part-time") || textLower.includes("part time")) {
    return "Part-time";
  }
  if (textLower.includes("remote only") || textLower.includes("fully remote") || textLower.includes("work from home")) {
    return "Remote";
  }
  return "Full-time";
}

function extractSourcePlatform(url: string): string {
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("glassdoor.com")) return "Glassdoor";
  if (url.includes("monster.com")) return "Monster";
  if (url.includes("ziprecruiter.com")) return "ZipRecruiter";
  if (url.includes("dice.com")) return "Dice";
  if (url.includes("stackoverflow.com") || url.includes("stackoverflowjobs")) return "Stack Overflow";
  if (url.includes("wellfound.com") || url.includes("angel.co")) return "Wellfound";
  if (url.includes("lever.co")) return "Lever";
  if (url.includes("greenhouse.io")) return "Greenhouse";
  if (url.includes("workday.com")) return "Workday";
  if (url.includes("careers.google.com")) return "Google Careers";
  if (url.includes("amazon.jobs")) return "Amazon Jobs";
  if (url.includes("microsoft.com/careers")) return "Microsoft Careers";
  if (url.includes("meta.com/careers") || url.includes("facebook.com/careers")) return "Meta Careers";
  if (url.includes("jobs.apple.com")) return "Apple Jobs";
  if (url.includes("rozee.pk")) return "Rozee.pk";
  if (url.includes("mustakbil.com")) return "Mustakbil";
  if (url.includes("bayrozgar.com")) return "Bayrozgar";
  return "Job Board";
}

// Search for jobs using Serper API
export async function searchJobsWithSerper(
  skills: string[],
  location: string,
  experienceLevel: string = "Entry",
  limit: number = 30
): Promise<SerperJobResult[]> {
  if (!SERPER_API_KEY) {
    console.error("❌ SERPER_API_KEY not configured");
    throw new Error("Serper API key not configured. Please add SERPER_API_KEY to your .env file.");
  }

  const allJobs: SerperJobResult[] = [];
  
  // Build search queries based on skills and location
  const topSkills = skills.slice(0, 5); // Use top 5 skills
  const searchQueries = buildSearchQueries(topSkills, location, experienceLevel);
  
  console.log(`🔍 Searching jobs with ${searchQueries.length} queries for location: ${location}`);

  for (const query of searchQueries) {
    try {
      console.log(`  → Searching: "${query}"`);
      
      const response = await axios.post(
        "https://google.serper.dev/search",
        {
          q: query,
          gl: getCountryCode(location),
          num: 10,
        },
        {
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const results = response.data.organic || [];
      
      for (const result of results) {
        // Filter to only job-related results
        if (isJobListing(result)) {
          const job = parseSerperResult(result, location);
          if (job && !isDuplicateJob(allJobs, job)) {
            allJobs.push(job);
          }
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error: any) {
      console.error(`Error searching for "${query}":`, error.message);
    }

    // Stop if we have enough jobs
    if (allJobs.length >= limit) break;
  }

  console.log(`✅ Found ${allJobs.length} jobs from Serper search`);
  return allJobs.slice(0, limit);
}

// Search specifically for jobs on major platforms
export async function searchJobsOnPlatform(
  platform: "linkedin" | "indeed" | "glassdoor" | "all",
  skills: string[],
  location: string,
  limit: number = 15
): Promise<SerperJobResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error("Serper API key not configured");
  }

  const allJobs: SerperJobResult[] = [];
  const topSkills = skills.slice(0, 3);
  
  const siteFilters: Record<string, string> = {
    linkedin: "site:linkedin.com/jobs",
    indeed: "site:indeed.com",
    glassdoor: "site:glassdoor.com/job-listing",
    all: "",
  };

  const siteFilter = siteFilters[platform] || "";
  
  for (const skill of topSkills) {
    const query = `${skill} developer jobs ${location} ${siteFilter}`.trim();
    
    try {
      console.log(`🔍 Searching ${platform}: "${query}"`);
      
      const response = await axios.post(
        "https://google.serper.dev/search",
        {
          q: query,
          gl: getCountryCode(location),
          num: 10,
        },
        {
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const results = response.data.organic || [];
      
      for (const result of results) {
        if (isJobListing(result)) {
          const job = parseSerperResult(result, location);
          if (job && !isDuplicateJob(allJobs, job)) {
            allJobs.push(job);
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error: any) {
      console.error(`Error searching ${platform}:`, error.message);
    }

    if (allJobs.length >= limit) break;
  }

  return allJobs.slice(0, limit);
}

// Build varied search queries for better coverage
function buildSearchQueries(skills: string[], location: string, experienceLevel: string): string[] {
  const queries: string[] = [];
  const levelTerms: Record<string, string[]> = {
    Entry: ["junior", "entry level", "graduate"],
    Mid: [""],
    Senior: ["senior"],
    Lead: ["lead", "principal"],
  };

  const levels = levelTerms[experienceLevel] || [""];
  
  // Platform-specific queries that return actual job postings
  // LinkedIn job view pages
  queries.push(`site:linkedin.com/jobs/view ${skills[0]} ${location}`);
  if (skills[1]) {
    queries.push(`site:linkedin.com/jobs/view ${skills[1]} developer ${location}`);
  }
  
  // Indeed specific job pages
  queries.push(`site:indeed.com/viewjob ${skills[0]} ${location}`);
  
  // Lever job boards (startups)
  queries.push(`site:lever.co ${skills[0]} developer`);
  
  // Greenhouse job boards
  queries.push(`site:boards.greenhouse.io ${skills[0]} engineer`);
  
  // Glassdoor specific job listings
  queries.push(`site:glassdoor.com/job-listing ${skills[0]} ${location}`);
  
  // Company career pages
  queries.push(`"${skills[0]} developer" "${location}" careers hiring`);
  
  // Experience level specific
  const level = levels[0];
  if (level) {
    queries.push(`site:linkedin.com/jobs/view ${level} ${skills[0]} developer`);
  }
  
  // Remote jobs
  queries.push(`site:linkedin.com/jobs/view ${skills[0]} remote developer`);

  return queries.slice(0, 8); // Limit to 8 queries to save API calls
}

// Get country code for better localized results
function getCountryCode(location: string): string {
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes("pakistan") || locationLower.includes("karachi") || 
      locationLower.includes("lahore") || locationLower.includes("islamabad")) {
    return "pk";
  }
  if (locationLower.includes("india") || locationLower.includes("bangalore") || 
      locationLower.includes("mumbai") || locationLower.includes("delhi")) {
    return "in";
  }
  if (locationLower.includes("uk") || locationLower.includes("london") || 
      locationLower.includes("england") || locationLower.includes("united kingdom")) {
    return "uk";
  }
  if (locationLower.includes("canada") || locationLower.includes("toronto") || 
      locationLower.includes("vancouver")) {
    return "ca";
  }
  if (locationLower.includes("australia") || locationLower.includes("sydney") || 
      locationLower.includes("melbourne")) {
    return "au";
  }
  if (locationLower.includes("germany") || locationLower.includes("berlin") || 
      locationLower.includes("munich")) {
    return "de";
  }
  if (locationLower.includes("uae") || locationLower.includes("dubai") || 
      locationLower.includes("abu dhabi")) {
    return "ae";
  }
  // Default to US
  return "us";
}

// Check if a search result is likely a job listing
function isJobListing(result: any): boolean {
  const url = (result.link || "").toLowerCase();
  const title = (result.title || "").toLowerCase();
  const snippet = (result.snippet || "").toLowerCase();
  
  // REJECT aggregated job search result pages (e.g., "35 Frontend Developer jobs in...")
  const aggregatedPatterns = [
    /^\d+\+?\s+[\w\s]+\s+jobs?\s+in/i,           // "35 Frontend Developer jobs in..."
    /^\d+\+?\s+[\w\s]+\s+positions?\s+in/i,      // "60 Backend positions in..."
    /^jobs?\s+for\s+[\w\s]+\s+in/i,              // "Jobs for developers in..."
    /search results|job search|find jobs/i,      // Generic search page titles
    /^\d+\s+new\s+[\w\s]+\s+jobs/i,              // "10 new developer jobs"
  ];
  
  for (const pattern of aggregatedPatterns) {
    if (pattern.test(title)) {
      return false;
    }
  }
  
  // REJECT if URL is a job search results page (not a specific job)
  const searchPagePatterns = [
    /\/jobs\?/,                    // /jobs?q=...
    /\/search\?/,                  // /search?...
    /\/jobs\/search/,              // /jobs/search
    /q=|query=|keyword=/,          // Query parameters
    /indeed\.com\/jobs\?/,         // Indeed search page
    /linkedin\.com\/jobs\/search/, // LinkedIn search page
    /glassdoor\.com\/Job\/.*jobs/i, // Glassdoor search page
  ];
  
  for (const pattern of searchPagePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Job platform URLs that point to SPECIFIC jobs
  const specificJobPatterns = [
    /linkedin\.com\/jobs\/view/,           // LinkedIn specific job
    /indeed\.com\/viewjob/,                // Indeed specific job
    /indeed\.com\/rc\/clk/,                // Indeed job click
    /glassdoor\.com\/job-listing/,         // Glassdoor specific job
    /lever\.co\/[\w-]+\/[\w-]+/,           // Lever job posting
    /greenhouse\.io\/[\w-]+\/jobs/,        // Greenhouse job
    /boards\.greenhouse\.io/,              // Greenhouse boards
    /workday\.com\/.*\/job/,               // Workday job
    /careers\.[\w]+\.com\/.*job/i,         // Company career pages
    /\/careers\/.*\d+/,                    // Career pages with job IDs
    /\/job\/\d+/,                          // Job with numeric ID
    /\/jobs\/\d+/,                         // Jobs with numeric ID
    /rozee\.pk\/job/,                      // Rozee.pk job
    /mustakbil\.com\/job/,                 // Mustakbil job
  ];
  
  const isSpecificJobUrl = specificJobPatterns.some(pattern => pattern.test(url));
  
  // Must be either a specific job URL OR have strong job indicators in content
  if (isSpecificJobUrl) {
    return true;
  }
  
  // Check for specific job indicators in title (real job titles, not aggregates)
  const specificJobIndicators = [
    /engineer\s+at\s+/i,
    /developer\s+at\s+/i,
    /at\s+[\w\s]+(?:inc|llc|ltd|corp|company)/i,
    /hiring\s+[\w\s]+engineer/i,
    /[\w\s]+\s+-\s+[\w\s]+(?:inc|llc|ltd|corp)/i,
  ];
  
  const hasSpecificTitle = specificJobIndicators.some(pattern => pattern.test(title));
  
  if (hasSpecificTitle) {
    return true;
  }
  
  // For other URLs, require strong job-related content
  const strongJobKeywords = [
    "we are hiring", "join our team", "apply now", "immediate opening",
    "looking for a", "seeking a", "responsibilities include", "requirements:"
  ];
  
  const hasStrongKeywords = strongJobKeywords.some(keyword => 
    snippet.includes(keyword)
  );
  
  return hasStrongKeywords;
}

// Parse Serper result into job format
function parseSerperResult(result: any, defaultLocation: string): SerperJobResult | null {
  const title = result.title || "";
  const snippet = result.snippet || "";
  const url = result.link || "";
  
  // Final validation - reject aggregated listings that slipped through
  const aggregatedPatterns = [
    /^\d+\+?\s+[\w\s]+\s+jobs?\s+in/i,
    /^\d+\+?\s+[\w\s]+\s+positions?\s+in/i,
    /^\d+\s+new\s+/i,
    /jobs\s+available/i,
    /search results/i,
  ];
  
  for (const pattern of aggregatedPatterns) {
    if (pattern.test(title)) {
      return null;
    }
  }
  
  // Try to extract company name from title
  // Common patterns: "Job Title at Company", "Job Title - Company", "Company: Job Title"
  let company = "";
  let jobTitle = title;
  
  if (title.includes(" at ")) {
    const parts = title.split(" at ");
    jobTitle = parts[0].trim();
    company = parts[1]?.split(" - ")[0]?.split("|")[0]?.trim() || "";
  } else if (title.includes(" - ")) {
    const parts = title.split(" - ");
    jobTitle = parts[0].trim();
    company = parts[1]?.split("|")[0]?.trim() || "";
  } else if (title.includes(" | ")) {
    const parts = title.split(" | ");
    jobTitle = parts[0].trim();
    company = parts[1]?.trim() || "";
  }
  
  // Clean up common suffixes from company name
  company = company
    .replace(/\s*LinkedIn.*$/i, "")
    .replace(/\s*Indeed.*$/i, "")
    .replace(/\s*Glassdoor.*$/i, "")
    .replace(/\s*Careers?$/i, "")
    .replace(/\s*Jobs?$/i, "")
    .replace(/\s*Hiring.*$/i, "")
    .replace(/\s*\(.*\)$/, "") // Remove parenthetical content
    .trim();
  
  // Try to extract company from snippet if not found in title
  if (!company || company.length < 2) {
    company = extractCompanyFromSnippet(snippet) || "";
  }
  
  // Try to extract from URL for known platforms
  if (!company || company.length < 2) {
    company = extractCompanyFromUrl(url) || "Company";
  }

  // Skip if job title is too generic or looks like a search result
  const cleanedTitle = cleanJobTitle(jobTitle);
  if (cleanedTitle.length < 5 || /^\d+\s+/.test(cleanedTitle)) {
    return null;
  }
  
  // Extract location from snippet if possible
  let location = defaultLocation;
  const locationMatch = snippet.match(/(?:in|at|location:?)\s+([A-Za-z\s,]+?)(?:\.|,|\s-|\s\||$)/i);
  if (locationMatch) {
    const extractedLoc = locationMatch[1].trim();
    // Only use if it looks like a valid location (not too long, not a sentence)
    if (extractedLoc.length < 40 && !extractedLoc.includes(" is ") && !extractedLoc.includes(" are ")) {
      location = extractedLoc;
    }
  }
  
  // Extract salary if mentioned
  let salary: string | undefined;
  const salaryPatterns = [
    /\$[\d,]+(?:k)?(?:\s*-\s*\$[\d,]+(?:k)?)?(?:\s*(?:per|\/|a)\s*(?:year|yr|hour|hr|month|annum))?/i,
    /(?:PKR|Rs\.?)\s*[\d,]+(?:\s*-\s*[\d,]+)?(?:\s*(?:per|\/)\s*(?:month|year))?/i,
    /[\d,]+(?:\s*-\s*[\d,]+)?\s*(?:LPA|lakh)/i,
  ];
  
  for (const pattern of salaryPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      salary = match[0];
      break;
    }
  }
  
  // Check for expired keywords in raw title, snippet, and link
  const rawTextLower = `${title} ${snippet} ${url}`.toLowerCase();
  const isExpired = [
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
    "no longer hiring",
    "[closed]",
    "(closed)",
    "job closed",
    "expired",
  ].some(phrase => rawTextLower.includes(phrase));

  return {
    title: cleanedTitle,
    company: company || "Company",
    location: location,
    salary,
    description: snippet,
    sourceUrl: url,
    sourcePlatform: extractSourcePlatform(url),
    postedAt: result.date,
    jobType: determineJobType(`${title} ${snippet}`),
    highlights: result.sitelinks?.map((s: any) => s.title) || [],
    isExpired,
  };
}

function extractCompanyFromSnippet(snippet: string): string | null {
  // Try to find company patterns
  const patterns = [
    /(?:at|with|for)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+is|\s+are|\.|,)/,
    /([A-Z][A-Za-z0-9\s&]+?)\s+(?:is hiring|is looking|seeks)/,
  ];
  
  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function extractCompanyFromUrl(url: string): string | null {
  // Try to extract company name from URL patterns
  const patterns = [
    /linkedin\.com\/company\/([^\/]+)/i,
    /glassdoor\.com\/Overview\/Working-at-([^-]+)/i,
    /lever\.co\/([^\/]+)/i,
    /boards\.greenhouse\.io\/([^\/]+)/i,
    /careers\.([^.]+)\.com/i,
    /([^.]+)\.workday\.com/i,
    /jobs\.([^.]+)\.com/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Convert slug to readable name
      return match[1]
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return null;
}

function cleanJobTitle(title: string): string {
  return title
    .replace(/\s*\|.*$/, "") // Remove anything after |
    .replace(/\s*-\s*(?:LinkedIn|Indeed|Glassdoor|Apply).*$/i, "") // Remove platform suffixes
    .replace(/\(\d+\)$/, "") // Remove numbers in parentheses
    .trim();
}

// Check for duplicate jobs
function isDuplicateJob(jobs: SerperJobResult[], newJob: SerperJobResult): boolean {
  return jobs.some(job => 
    job.sourceUrl === newJob.sourceUrl ||
    (job.title.toLowerCase() === newJob.title.toLowerCase() && 
     job.company.toLowerCase() === newJob.company.toLowerCase())
  );
}

// Export helper functions for use in other modules
export {
  extractSkillsFromText,
  determineExperienceLevel,
  determineJobType,
  extractSourcePlatform,
};
