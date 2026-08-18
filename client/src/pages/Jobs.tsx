import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, DollarSign, Clock, Star, ArrowUpRight, Sparkles, Loader2, RefreshCw, AlertCircle, Briefcase, ExternalLink, BookmarkPlus, BookmarkCheck, Settings2, X, Plus, Check, SlidersHorizontal, ChevronDown, ChevronUp, Wand2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";

interface Job {
  jobId?: string;
  savedAt?: Date | string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  skills: string[];
  jobType: string;
  experienceLevel: string;
  sourceUrl: string;
  sourcePlatform: string;
  matchScore: number;
  matchReasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  postedAt?: string | Date;
  postedAtText?: string;
  isExpired?: boolean;
}

interface UserProfile {
  skills: { name: string; level: number; category: string }[];
  experience: { role: string; company: string; duration: string; description: string }[];
  suggestedRoles: string[];
  location?: string;
  name?: string;
}

interface JobPreferences {
  targetRoles: string[];
  preferredLocations: string[];
  remotePreference: "any" | "remote" | "onsite" | "hybrid";
  experienceLevel: "any" | "entry" | "mid" | "senior" | "lead";
  jobTypes: string[];
  minSalary: number;
  industries: string[];
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const { toast } = useToast();
  
  // Filter states
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Job preferences
  const [jobPreferences, setJobPreferences] = useState<JobPreferences>({
    targetRoles: [],
    preferredLocations: [],
    remotePreference: "any",
    experienceLevel: "any",
    jobTypes: ["Full-time"],
    minSalary: 0,
    industries: [],
  });
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [newTargetRole, setNewTargetRole] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Load user profile, saved jobs, and preferences from MongoDB
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile from MongoDB
        const profileResponse = await fetch("/api/profile", {
          credentials: "include",
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          if (profile.skills && profile.skills.length > 0) {
            setUserProfile({
              skills: profile.skills,
              experience: profile.experience || [],
              suggestedRoles: profile.suggestedRoles || [],
              location: profile.location,
              name: profile.name,
            });
          }
        }

        // Load saved jobs from MongoDB
        const savedResponse = await fetch("/api/profile/saved-jobs", {
          credentials: "include",
        });
        
        if (savedResponse.ok) {
          const saved = await savedResponse.json();
          setSavedJobs(saved);
        }
        
        // Load job preferences from MongoDB
        const prefsResponse = await fetch("/api/profile/preferences", {
          credentials: "include",
        });
        
        if (prefsResponse.ok) {
          const prefs = await prefsResponse.json();
          setJobPreferences({
            targetRoles: prefs.targetRoles || [],
            preferredLocations: prefs.preferredLocations || [],
            remotePreference: prefs.remotePreference || "any",
            experienceLevel: prefs.experienceLevel || "any",
            jobTypes: prefs.jobTypes || ["Full-time"],
            minSalary: prefs.minSalary || 0,
            industries: prefs.industries || [],
          });
        }
      } catch (e) {
        console.error("Error loading data:", e);
      }
    };

    loadData();
  }, []);

  // Check if a job is already saved
  const isJobSaved = (job: Job) => {
    return savedJobs.some(
      (saved: any) => saved.title === job.title && saved.company === job.company
    );
  };

  // Save a job to MongoDB
  const saveJob = async (job: Job) => {
    if (isJobSaved(job)) {
      // Remove the job if already saved
      try {
        const jobId = savedJobs.find(
          (saved: any) => saved.title === job.title && saved.company === job.company
        )?.jobId;
        
        if (jobId) {
          await fetch(`/api/profile/saved-jobs/${jobId}`, {
            method: "DELETE",
            credentials: "include",
          });
        }
        
        const updatedJobs = savedJobs.filter(
          (saved: any) => !(saved.title === job.title && saved.company === job.company)
        );
        setSavedJobs(updatedJobs);
        
        toast({
          title: "Job Removed",
          description: `${job.title} at ${job.company} has been removed from saved jobs.`,
        });
      } catch (err) {
        console.error("Error removing job:", err);
      }
    } else {
      // Add the job to MongoDB
      try {
        const jobData = {
          jobId: `${job.company}-${job.title}-${Date.now()}`.replace(/\s+/g, '-').toLowerCase(),
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          url: job.sourceUrl,
          source: job.sourcePlatform,
          matchScore: job.matchScore,
          matchReasons: job.matchReasons,
        };

        const response = await fetch("/api/profile/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(jobData),
        });

        if (response.ok) {
          setSavedJobs([...savedJobs, { ...job, ...jobData, savedAt: new Date() }]);
          toast({
            title: "Job Saved!",
            description: `${job.title} at ${job.company} saved for interview prep.`,
          });
        }
      } catch (err) {
        console.error("Error saving job:", err);
        toast({
          title: "Error",
          description: "Failed to save job. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const discoverJobs = async () => {
    if (!userProfile || userProfile.skills.length === 0) {
      setError("Please upload your resume first to discover matching jobs.");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch("/api/jobs/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          skills: userProfile.skills,
          experience: userProfile.experience,
          suggestedRoles: userProfile.suggestedRoles,
          location: userProfile.location || "Remote",
          jobPreferences: jobPreferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to discover jobs");
      }

      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Save job preferences to MongoDB
  const saveJobPreferences = async () => {
    setSavingPreferences(true);
    try {
      const response = await fetch("/api/profile/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(jobPreferences),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }
      
      toast({
        title: "Preferences Saved!",
        description: "Your job preferences have been updated.",
      });
      setShowPreferencesModal(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingPreferences(false);
    }
  };
  
  // Add a target role
  const addTargetRole = () => {
    if (newTargetRole.trim() && !jobPreferences.targetRoles.includes(newTargetRole.trim())) {
      setJobPreferences({
        ...jobPreferences,
        targetRoles: [...jobPreferences.targetRoles, newTargetRole.trim()],
      });
      setNewTargetRole("");
    }
  };
  
  // Remove a target role
  const removeTargetRole = (role: string) => {
    setJobPreferences({
      ...jobPreferences,
      targetRoles: jobPreferences.targetRoles.filter(r => r !== role),
    });
  };
  
  // Add a preferred location
  const addLocation = () => {
    if (newLocation.trim() && !jobPreferences.preferredLocations.includes(newLocation.trim())) {
      setJobPreferences({
        ...jobPreferences,
        preferredLocations: [...jobPreferences.preferredLocations, newLocation.trim()],
      });
      setNewLocation("");
    }
  };
  
  // Remove a location
  const removeLocation = (location: string) => {
    setJobPreferences({
      ...jobPreferences,
      preferredLocations: jobPreferences.preferredLocations.filter(l => l !== location),
    });
  };

  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to search jobs");
      }

      // If we have user profile, calculate match scores
      if (userProfile) {
        const jobsWithScores = data.jobs.map((job: any) => {
          const matchedSkills = job.skills.filter((skill: string) =>
            userProfile.skills.some(us => us.name.toLowerCase() === skill.toLowerCase())
          );
          const score = Math.min(Math.round((matchedSkills.length / Math.max(job.skills.length, 1)) * 100), 100);
          
          return {
            ...job,
            matchScore: score,
            matchedSkills,
            missingSkills: job.skills.filter((s: string) => !matchedSkills.includes(s)),
            matchReasons: matchedSkills.length > 0 ? [`Skills match: ${matchedSkills.slice(0, 3).join(", ")}`] : [],
          };
        });
        jobsWithScores.sort((a: Job, b: Job) => {
          if (a.isExpired && !b.isExpired) return 1;
          if (!a.isExpired && b.isExpired) return -1;
          return b.matchScore - a.matchScore;
        });
        setJobs(jobsWithScores);
      } else {
        setJobs(data.jobs.map((job: any) => ({
          ...job,
          matchScore: 0,
          matchedSkills: [],
          missingSkills: job.skills,
          matchReasons: [],
        })));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIsJobExpired = (job: Job) => {
    if (job.isExpired) return true;

    const dateText = (job.postedAtText || "").toLowerCase();
    if (
      dateText.includes("month") ||
      dateText.includes("year") ||
      dateText.includes("3 weeks") ||
      dateText.includes("4 weeks") ||
      dateText.includes("2 weeks") ||
      dateText.includes("30+") ||
      dateText.includes("over 14")
    ) {
      return true;
    }

    if (job.postedAt) {
      const postedTime = new Date(job.postedAt).getTime();
      if (!isNaN(postedTime)) {
        const days = Math.floor((new Date().getTime() - postedTime) / (1000 * 60 * 60 * 24));
        if (days >= 14) return true;
      }
    }

    const text = `${job.title} ${job.description}`.toLowerCase();
    return (
      text.includes("no longer accepting") ||
      text.includes("not accepting applications") ||
      text.includes("applications are no longer") ||
      text.includes("position filled") ||
      text.includes("position has been filled") ||
      text.includes("this job is no longer") ||
      text.includes("job is closed") ||
      text.includes("job closed") ||
      text.includes("cirruscloud") ||
      text.includes("accurasofthire") ||
      text.includes("expired")
    );
  };

  const isJobRemote = (job: Job) => {
    const loc = (job.location || "").toLowerCase();
    const title = (job.title || "").toLowerCase();
    const desc = (job.description || "").toLowerCase();
    const type = (job.jobType || "").toLowerCase();

    return (
      loc.includes("remote") ||
      loc.includes("anywhere") ||
      loc.includes("work from home") ||
      loc.includes("wfh") ||
      type.includes("remote") ||
      title.includes("remote") ||
      desc.includes("remote")
    );
  };

  const matchesJobType = (job: Job, selectedTypes: string[]) => {
    if (selectedTypes.length === 0) return true;

    const typeLower = (job.jobType || "").toLowerCase();

    return selectedTypes.some(selected => {
      const s = selected.toLowerCase();

      if (s === "remote") {
        return isJobRemote(job);
      }
      if (s === "full-time" || s === "fulltime") {
        return typeLower.includes("full") || typeLower.includes("ft");
      }
      if (s === "part-time" || s === "parttime") {
        return typeLower.includes("part") || typeLower.includes("pt");
      }
      if (s === "contract") {
        return typeLower.includes("contract") || typeLower.includes("freelance") || typeLower.includes("temp");
      }
      if (s === "internship") {
        return typeLower.includes("intern") || typeLower.includes("trainee");
      }
      return typeLower.includes(s);
    });
  };

  // Filter jobs based on selected filters
  const filteredJobs = jobs.filter(job => {
    const expired = checkIsJobExpired(job);
    if (!showExpired && expired) return false;
    if (minMatchScore > 0 && (job.matchScore || 0) < minMatchScore) return false;
    if (showRemoteOnly && !isJobRemote(job)) return false;
    if (!matchesJobType(job, selectedJobTypes)) return false;
    return true;
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    if (score >= 60) return "bg-primary/10 text-primary border-primary/20";
    if (score >= 40) return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const formatDate = (date?: string | Date, postedAtText?: string) => {
    if (postedAtText) return postedAtText;
    if (!date) return "Recently";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  const activeFilterCount = (minMatchScore > 0 ? 1 : 0) + (showRemoteOnly ? 1 : 0) + selectedJobTypes.length + (showExpired ? 1 : 0);

  const FilterContent = () => (
    <CardContent className="space-y-4 p-4 text-xs">
      {/* Match Score */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Match Score</label>
        <div className="flex flex-col gap-1.5 text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input 
              type="radio" 
              name="matchScore"
              checked={minMatchScore === 0}
              onChange={() => setMinMatchScore(0)}
              className="accent-primary" 
            />
            <span>All Match Scores</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input 
              type="radio" 
              name="matchScore"
              checked={minMatchScore === 80}
              onChange={() => setMinMatchScore(80)}
              className="accent-primary" 
            />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">80%+ Match</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input 
              type="radio" 
              name="matchScore"
              checked={minMatchScore === 60}
              onChange={() => setMinMatchScore(60)}
              className="accent-primary" 
            />
            <span className="font-medium text-primary">60%+ Match</span>
          </label>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2 pt-3 border-t border-border/60">
        <label className="text-xs font-semibold text-foreground">Location</label>
        <div className="flex flex-col gap-1.5 text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input 
              type="checkbox" 
              checked={showRemoteOnly}
              onChange={(e) => setShowRemoteOnly(e.target.checked)}
              className="rounded accent-primary" 
            />
            <span>Remote Only</span>
          </label>
        </div>
      </div>

      {/* Job Type */}
      <div className="space-y-2 pt-3 border-t border-border/60">
        <label className="text-xs font-semibold text-foreground">Job Type</label>
        <div className="flex flex-col gap-1.5 text-muted-foreground">
          {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={selectedJobTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedJobTypes([...selectedJobTypes, type]);
                  } else {
                    setSelectedJobTypes(selectedJobTypes.filter(t => t !== type));
                  }
                }}
                className="rounded accent-primary" 
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2 pt-3 border-t border-border/60">
        <label className="text-xs font-semibold text-foreground">Status</label>
        <div className="flex flex-col gap-1.5 text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
            <input 
              type="checkbox" 
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="rounded accent-primary" 
            />
            <span>Show Closed / Expired Jobs</span>
          </label>
        </div>
      </div>
    </CardContent>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-0 pb-8 overflow-x-hidden">
      <SEO 
        title="Job Discovery & AI Matcher" 
        description="Search active tech and remote job listings with real-time Anti-Expired Shield verification, compatibility ratings, and 1-click resume tailoring." 
        canonical="/jobs"
        keywords="live job board, anti-expired jobs, verified tech jobs, remote engineering jobs, job compatibility score"
      />

      {/* Header Banner - Clean & Readable */}
      <div className="pb-5 border-b border-border/60">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground mb-3">
          <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" /> Live Opportunity Feed
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground break-words">
              Job Discovery
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-3xl leading-relaxed break-words">
              {userProfile 
                ? "Real-time verified opportunities matching your candidate profile & ATS compatibility."
                : "Upload your resume in Resume Studio for personalized job matching."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 shrink-0">
            <div className="relative flex-1 w-full sm:w-[240px] md:w-[300px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search roles, skills..."
                className="pl-9 bg-background text-xs sm:text-sm h-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchJobs()}
              />
            </div>
            <Button onClick={searchJobs} disabled={loading} size="default" className="shrink-0 text-xs sm:text-sm h-10 px-5 font-semibold w-full sm:w-auto">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Status & Discover Banner */}
      {userProfile && (
        <Card className="border-border/80 bg-card overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm sm:text-base text-foreground">Candidate Profile Loaded</p>
                    {userProfile.name && (
                      <Badge variant="outline" className="text-xs font-normal py-0.5">
                        {userProfile.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {userProfile.skills.length} skills • {userProfile.experience.length} experiences
                    {userProfile.location && ` • 📍 ${userProfile.location}`}
                  </p>
                  {(jobPreferences.targetRoles.length > 0 || userProfile.suggestedRoles?.length > 0) && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      <span className="font-medium text-foreground">Target:</span> {(jobPreferences.targetRoles.length > 0 
                        ? jobPreferences.targetRoles 
                        : userProfile.suggestedRoles
                      ).slice(0, 3).join(", ")}
                      {jobPreferences.remotePreference !== "any" && ` • ${jobPreferences.remotePreference}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2.5 w-full sm:w-auto shrink-0">
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => setShowPreferencesModal(true)}
                  className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 px-3"
                >
                  <Settings2 className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Preferences</span>
                </Button>
                <Button 
                  size="default"
                  onClick={discoverJobs} 
                  disabled={loading} 
                  className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10 px-4 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5 shrink-0" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1.5 shrink-0" />
                      <span>Discover Jobs</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Profile Warning */}
      {!userProfile && (
        <Card className="border-border/80 bg-muted/20">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3.5">
              <AlertCircle className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base text-foreground">No Profile Loaded</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Upload your resume in the Resume Studio to unlock automated role matching with compatibility scores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs sm:text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Collapsible Filter Toggle */}
      <div className="lg:hidden">
        <Card className="border-border/80 overflow-hidden">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer select-none" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs sm:text-sm font-semibold">Filter Jobs</CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {activeFilterCount} Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinMatchScore(0);
                    setShowRemoteOnly(false);
                    setSelectedJobTypes([]);
                    setShowExpired(false);
                  }}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
                {isMobileFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {isMobileFilterOpen && (
            <div className="pt-1 border-t border-border/40">
              <FilterContent />
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Filters Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className="border-border/80 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-3.5 px-5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Filters</CardTitle>
              </div>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setMinMatchScore(0);
                    setShowRemoteOnly(false);
                    setSelectedJobTypes([]);
                    setShowExpired(false);
                  }}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </CardHeader>
            <FilterContent />
          </Card>

          {/* Stats Card */}
          {jobs.length > 0 && (
            <Card className="border-border/80 overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-border/60">
                <CardTitle className="text-xs sm:text-sm font-semibold">Feed Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm p-5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Listings</span>
                  <span className="font-semibold text-foreground">{jobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Showing</span>
                  <span className="font-semibold text-foreground">{filteredJobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">80%+ Match</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {jobs.filter(j => j.matchScore >= 80).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job Feed */}
        <div className="lg:col-span-9 space-y-4 sm:space-y-5">
          {/* Loading State */}
          {loading && (
            <Card className="h-[280px] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">Searching active verified listings...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Applying Anti-Expired Shield & candidate matching filters</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && hasSearched && filteredJobs.length === 0 && (
            <Card className="h-[300px] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Briefcase className="w-9 h-9 text-muted-foreground/30 mx-auto" />
                <h3 className="font-semibold text-sm sm:text-base text-foreground">No Jobs Match Current Filters</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  {jobs.length > 0 
                    ? "Try adjusting your score thresholds or location filters."
                    : "Try a different search keyword or discover opportunities based on your profile."}
                </p>
                {userProfile && (
                  <Button size="default" onClick={discoverJobs} className="text-xs sm:text-sm h-9 mt-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Discover Jobs for Me
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Initial State */}
          {!loading && !hasSearched && (
            <Card className="h-[320px] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Search className="w-9 h-9 text-muted-foreground/30 mx-auto" />
                <h3 className="font-semibold text-sm sm:text-base text-foreground">Ready to Discover Active Opportunities</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  {userProfile 
                    ? 'Click "Discover Jobs for Me" to query verified positions tailored to your skill matrix.'
                    : "Search for job titles or upload your resume for tailored recommendations."}
                </p>
                {userProfile && (
                  <Button size="default" onClick={discoverJobs} className="text-xs sm:text-sm h-10 font-semibold px-5">
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    Discover Jobs for Me
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Cards */}
          <AnimatePresence>
            {!loading && filteredJobs.map((job, index) => {
              const expired = checkIsJobExpired(job);
              return (
                <motion.div
                  key={`${job.title}-${job.company}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`overflow-hidden border-border/80 bg-card hover:border-primary/40 transition-colors ${expired ? 'opacity-50' : ''}`}>
                    <CardHeader className="p-4 sm:p-5 pb-2.5 space-y-2.5">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0 w-full sm:w-auto">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary flex items-center justify-center text-base sm:text-lg font-bold text-secondary-foreground shrink-0">
                            {job.company.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <CardTitle className="text-base sm:text-lg md:text-xl font-bold hover:text-primary transition-colors leading-snug break-words">
                              {job.title}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate font-medium text-foreground/80">
                              {job.company}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between sm:justify-end w-full sm:w-auto gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-border/40">
                          {job.matchScore > 0 && (
                            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                              {job.matchScore}% Match
                            </Badge>
                          )}
                          {expired ? (
                            <Badge variant="outline" className="text-xs border-destructive/30 text-destructive px-2 py-0.5">
                              Closed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5">
                              <Check className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(job.postedAt, job.postedAtText)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-0 pb-4 space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="text-xs font-normal gap-1 px-2.5 py-0.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {job.location || "Remote"}
                        </Badge>
                        {job.salary && (
                          <Badge variant="outline" className="text-xs font-normal text-foreground px-2.5 py-0.5">
                            💰 {job.salary}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs font-normal px-2.5 py-0.5">
                          {job.jobType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-normal px-2.5 py-0.5">
                          {job.sourcePlatform}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-3 leading-relaxed break-words text-xs sm:text-sm">
                        {job.description.substring(0, 240)}...
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 8).map((skill, i) => (
                          <Badge 
                            key={i} 
                            variant={job.matchedSkills.includes(skill) ? "secondary" : "outline"}
                            className="text-xs font-normal px-2.5 py-0.5"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 8 && (
                          <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 text-muted-foreground">
                            +{job.skills.length - 8} more
                          </Badge>
                        )}
                      </div>

                      {/* Why it matches */}
                      {job.matchReasons.length > 0 && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/40 space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why you match</p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.matchReasons.map((reason, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground/90 bg-card px-2.5 py-1 rounded border border-border/50">
                                <Star className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-3.5 sm:p-5 pt-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-t border-border/60">
                      <span className="text-xs text-muted-foreground">
                        Source: <span className="font-medium text-foreground">{job.sourcePlatform}</span>
                      </span>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/resume?tab=tailor&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`;
                          }}
                          className="w-full sm:w-auto text-xs sm:text-sm h-9 px-2.5 justify-center"
                          title="Generate ATS-tailored resume variant for this role"
                        >
                          <Wand2 className="mr-1.5 w-3.5 h-3.5 text-primary shrink-0" /> 
                          <span className="truncate">Tailor Resume</span>
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/resume?tab=cover-letter&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`;
                          }}
                          className="w-full sm:w-auto text-xs sm:text-sm h-9 px-2.5 justify-center"
                          title="Generate Cover Letter or Outreach message"
                        >
                          <Send className="mr-1.5 w-3.5 h-3.5 text-primary shrink-0" /> 
                          <span className="truncate">Cover Letter</span>
                        </Button>
                        <Button 
                          variant={isJobSaved(job) ? "default" : "outline"} 
                          size="sm"
                          onClick={() => saveJob(job)}
                          className="w-full sm:w-auto text-xs sm:text-sm h-9 px-3 justify-center"
                        >
                          {isJobSaved(job) ? (
                            <>
                              <BookmarkCheck className="mr-1.5 w-3.5 h-3.5 shrink-0" /> 
                              <span className="truncate">Saved</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="mr-1.5 w-3.5 h-3.5 shrink-0" /> 
                              <span className="truncate">Save</span>
                            </>
                          )}
                        </Button>
                        <Button size="sm" asChild className="w-full sm:w-auto text-xs sm:text-sm h-9 px-3.5 justify-center">
                          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <span className="truncate">Apply</span> <ExternalLink className="ml-1.5 w-3.5 h-3.5 shrink-0" />
                          </a>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Job Preferences Modal */}
      <Dialog open={showPreferencesModal} onOpenChange={setShowPreferencesModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Job Preferences
            </DialogTitle>
            <DialogDescription>
              Customize what types of jobs you're looking for. These preferences will be used to find better matches.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Target Roles */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Target Roles</Label>
              <p className="text-xs text-muted-foreground">What job titles are you interested in?</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Software Engineer, Frontend Developer"
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTargetRole())}
                />
                <Button type="button" onClick={addTargetRole} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobPreferences.targetRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="pl-3 pr-1 py-1">
                    {role}
                    <button
                      onClick={() => removeTargetRole(role)}
                      className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {jobPreferences.targetRoles.length === 0 && (
                  <span className="text-sm text-muted-foreground">No roles added - will use AI suggestions from your resume</span>
                )}
              </div>
            </div>
            
            {/* Preferred Locations */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preferred Locations</Label>
              <p className="text-xs text-muted-foreground">Where do you want to work?</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., New York, San Francisco, London"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                />
                <Button type="button" onClick={addLocation} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobPreferences.preferredLocations.map((location) => (
                  <Badge key={location} variant="secondary" className="pl-3 pr-1 py-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {location}
                    <button
                      onClick={() => removeLocation(location)}
                      className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {jobPreferences.preferredLocations.length === 0 && (
                  <span className="text-sm text-muted-foreground">No locations specified</span>
                )}
              </div>
            </div>
            
            {/* Remote Preference */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Remote Work Preference</Label>
              <Select
                value={jobPreferences.remotePreference}
                onValueChange={(value: any) => setJobPreferences({ ...jobPreferences, remotePreference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (Remote, Hybrid, or On-site)</SelectItem>
                  <SelectItem value="remote">Remote Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Experience Level */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Experience Level</Label>
              <Select
                value={jobPreferences.experienceLevel}
                onValueChange={(value: any) => setJobPreferences({ ...jobPreferences, experienceLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Level</SelectItem>
                  <SelectItem value="Entry">Entry Level / Junior</SelectItem>
                  <SelectItem value="Mid">Mid Level</SelectItem>
                  <SelectItem value="Senior">Senior Level</SelectItem>
                  <SelectItem value="Lead">Lead / Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Job Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Job Types</Label>
              <div className="flex flex-wrap gap-3">
                {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jobPreferences.jobTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setJobPreferences({ ...jobPreferences, jobTypes: [...jobPreferences.jobTypes, type] });
                        } else {
                          setJobPreferences({ ...jobPreferences, jobTypes: jobPreferences.jobTypes.filter(t => t !== type) });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferencesModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveJobPreferences} disabled={savingPreferences}>
              {savingPreferences ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
