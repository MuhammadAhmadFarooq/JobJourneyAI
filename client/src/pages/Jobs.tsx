import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, DollarSign, Clock, Star, ArrowUpRight, Sparkles, Loader2, RefreshCw, AlertCircle, Briefcase, ExternalLink, BookmarkPlus, BookmarkCheck, Settings2, X, Plus, Check } from "lucide-react";
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

interface Job {
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
  const [hideExpired, setHideExpired] = useState(true);
  
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
          setSavedJobs([...savedJobs, { ...jobData, savedAt: new Date() }]);
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
      text.includes("expired")
    );
  };

  // Filter jobs based on selected filters
  const filteredJobs = jobs.filter(job => {
    const expired = checkIsJobExpired(job);
    if (minMatchScore > 0 && job.matchScore < minMatchScore) return false;
    if (showRemoteOnly && !job.location.toLowerCase().includes("remote")) return false;
    if (selectedJobTypes.length > 0 && !selectedJobTypes.some(t => t.toLowerCase() === job.jobType.toLowerCase())) return false;
    if (hideExpired && expired) return false;
    return true;
  });

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-900/50";
    if (score >= 60) return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/50";
    if (score >= 40) return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/50";
    return "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-100 dark:border-gray-900/50";
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Job Discovery</h1>
          <p className="text-muted-foreground">
            {userProfile 
              ? "Opportunities curated based on your profile analysis."
              : "Upload your resume first for personalized job matching."}
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center space-x-2">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles, skills..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchJobs()}
            />
          </div>
          <Button onClick={searchJobs} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Profile Status & Discover Button */}
      {userProfile && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Profile Loaded {userProfile.name && `- ${userProfile.name}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile.skills.length} skills • {userProfile.experience.length} experiences
                    {userProfile.location && ` • 📍 ${userProfile.location}`}
                  </p>
                  {(jobPreferences.targetRoles.length > 0 || userProfile.suggestedRoles?.length > 0) && (
                    <p className="text-sm text-muted-foreground">
                      Looking for: {(jobPreferences.targetRoles.length > 0 
                        ? jobPreferences.targetRoles 
                        : userProfile.suggestedRoles
                      ).slice(0, 3).join(", ")}
                      {jobPreferences.remotePreference !== "any" && ` • ${jobPreferences.remotePreference}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreferencesModal(true)}
                  className="shrink-0"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Preferences
                </Button>
                <Button onClick={discoverJobs} disabled={loading} className="shrink-0">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Discover Jobs
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
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">No Profile Found</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Go to the Resume page and upload your resume to get personalized job matches with compatibility scores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Filters Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Match Score</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={minMatchScore >= 80}
                      onChange={(e) => setMinMatchScore(e.target.checked ? 80 : 0)}
                      className="rounded border-gray-300" 
                    />
                    <span>80%+ Match</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={minMatchScore >= 60 && minMatchScore < 80}
                      onChange={(e) => setMinMatchScore(e.target.checked ? 60 : 0)}
                      className="rounded border-gray-300" 
                    />
                    <span>60%+ Match</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox"
                      checked={showRemoteOnly}
                      onChange={(e) => setShowRemoteOnly(e.target.checked)}
                      className="rounded border-gray-300" 
                    />
                    <span>Remote Only</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Type</label>
                <div className="flex flex-col gap-2">
                  {["Full-time", "Part-time", "Contract", "Internship", "Remote"].map((type) => (
                    <div key={type} className="flex items-center gap-2 text-sm">
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
                        className="rounded border-gray-300" 
                      />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox"
                      checked={hideExpired}
                      onChange={(e) => setHideExpired(e.target.checked)}
                      className="rounded border-gray-300" 
                    />
                    <span>Hide Expired Jobs</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          {jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Jobs</span>
                  <span className="font-medium">{jobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Showing</span>
                  <span className="font-medium">{filteredJobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">80%+ Match</span>
                  <span className="font-medium text-green-600">
                    {jobs.filter(j => j.matchScore >= 80).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job Feed */}
        <div className="lg:col-span-9 space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Searching for jobs...</p>
                <p className="text-sm text-muted-foreground">Scraping multiple job boards</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && hasSearched && filteredJobs.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground mb-4">
                  {jobs.length > 0 
                    ? "Try adjusting your filters to see more results."
                    : "Try a different search query or discover jobs based on your profile."}
                </p>
                {userProfile && (
                  <Button onClick={discoverJobs}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Discover Jobs for Me
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Initial State */}
          {!loading && !hasSearched && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Ready to Find Your Next Role?</h3>
                <p className="text-muted-foreground mb-4">
                  {userProfile 
                    ? 'Click "Discover Jobs for Me" to find opportunities matching your profile, or search for specific roles.'
                    : "Search for jobs or upload your resume for personalized matches."}
                </p>
                {userProfile && (
                  <Button onClick={discoverJobs}>
                    <Sparkles className="w-4 h-4 mr-2" />
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`overflow-hidden transition-all duration-300 group border-l-4 ${expired ? 'opacity-55 border-l-muted-foreground/30 bg-muted/30' : 'border-l-transparent hover:border-l-primary hover:shadow-md'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-secondary-foreground shrink-0">
                            {job.company.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                              {job.title}
                            </CardTitle>
                            <CardDescription className="text-base mt-1">
                              {job.company}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {job.matchScore > 0 && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border shadow-sm ${getMatchScoreColor(job.matchScore)}`}>
                              <Sparkles className="w-3.5 h-3.5" />
                              {job.matchScore}% Match
                            </div>
                          )}
                          {expired ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-red-200 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50">
                              <AlertCircle className="w-3 h-3" />
                              No Longer Accepting Applications
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40">
                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                              Accepting Applications
                            </div>
                          )}
                        <span className="text-xs text-muted-foreground">{formatDate(job.postedAt, job.postedAtText)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" /> {job.salary}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {job.jobType}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {job.experienceLevel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {job.sourcePlatform}
                      </Badge>
                    </div>
                    
                    <p className="text-sm line-clamp-2 mb-4 leading-relaxed">
                      {job.description.substring(0, 200)}...
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills.slice(0, 8).map((skill, i) => (
                        <Badge 
                          key={i} 
                          variant={job.matchedSkills.includes(skill) ? "default" : "outline"}
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {job.skills.length > 8 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.skills.length - 8} more
                        </Badge>
                      )}
                    </div>

                    {/* Why it matches */}
                    {job.matchReasons.length > 0 && (
                      <div className="bg-secondary/40 p-3 rounded-md space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why you're a match</p>
                        <div className="flex flex-wrap gap-2">
                          {job.matchReasons.map((reason, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs bg-background px-2 py-1 rounded shadow-sm border">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/20 pt-4 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      via {job.sourcePlatform}
                    </span>
                    <div className="flex gap-3">
                      <Button 
                        variant={isJobSaved(job) ? "default" : "outline"} 
                        size="sm"
                        onClick={() => saveJob(job)}
                      >
                        {isJobSaved(job) ? (
                          <>
                            <BookmarkCheck className="mr-2 w-3 h-3" /> Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="mr-2 w-3 h-3" /> Save
                          </>
                        )}
                      </Button>
                      <Button size="sm" asChild>
                        <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                          Apply <ExternalLink className="ml-2 w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
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
