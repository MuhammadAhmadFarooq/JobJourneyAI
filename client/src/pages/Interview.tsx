import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Search, BookOpen, BrainCircuit, Lightbulb, 
  Bookmark, Building2, MapPin, Sparkles, CheckCircle2, 
  AlertTriangle, Target, Calendar, ArrowLeft, Trash2,
  GraduationCap, MessageSquare, Code, Users, Star, Youtube, ExternalLink, RefreshCw, Layers, ShieldCheck, DollarSign, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  matchScore?: number;
  matchReasons?: string[];
  source?: string;
  sourceUrl?: string;
  savedAt: string;
}

interface InterviewPrepData {
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
  topics: Array<{
    title: string;
    description: string;
    importance: "High" | "Medium" | "Low";
    keyConceptsToReview: string[];
    commonMistakes: string[];
    resources: string[];
    youtubeVideo?: {
      title: string;
      channel: string;
      url: string;
      thumbnail?: string;
    };
    questions: Array<{
      question: string;
      difficulty: "Easy" | "Medium" | "Hard";
      type: string;
      topic: string;
      hints: string[];
      sampleAnswer?: string;
      whyAsked: string;
    }>;
  }>;
  studyPlan: {
    week1: string[];
    week2: string[];
    lastDays: string[];
  };
  tips: string[];
  redFlags: string[];
  questionsToAsk: string[];
}

export default function Interview() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [activeTab, setActiveTab] = useState("saved-jobs");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [savedPreps, setSavedPreps] = useState<Record<string, InterviewPrepData>>({});
  const { toast } = useToast();

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await fetch("/api/profile/saved-jobs", {
          credentials: "include",
        });
        
        if (response.ok) {
          const jobs = await response.json();
          const transformedJobs = jobs.map((job: any) => ({
            id: job.jobId,
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary,
            description: job.description,
            skills: [],
            matchScore: job.matchScore,
            matchReasons: job.matchReasons,
            source: job.source,
            sourceUrl: job.url,
            savedAt: job.savedAt,
          }));
          setSavedJobs(transformedJobs);
        }
        
        const prepsResponse = await fetch("/api/profile/interview-preps", {
          credentials: "include",
        });
        
        if (prepsResponse.ok) {
          const preps = await prepsResponse.json();
          const prepsMap: Record<string, InterviewPrepData> = {};
          preps.forEach((prep: any) => {
            prepsMap[prep.jobId] = prep;
          });
          setSavedPreps(prepsMap);
        }
      } catch (err) {
        console.error("Failed to load saved jobs:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadSavedJobs();
  }, []);

  const removeSavedJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/profile/saved-jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setSavedJobs(savedJobs.filter(j => j.id !== jobId));
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setPrepData(null);
        }
        toast({
          title: "Job Removed",
          description: "Job removed from saved list.",
        });
      }
    } catch (err) {
      console.error("Failed to remove job:", err);
    }
  };

  const generatePrep = async (job: SavedJob, forceRegenerate = false) => {
    setSelectedJob(job);
    setActiveTab("prep-results");
    setError(null);

    if (!forceRegenerate && savedPreps[job.id]) {
      setPrepData(savedPreps[job.id]);
      return;
    }

    setIsGenerating(true);
    setPrepData(null);

    const steps = [
      `Analyzing role requirements for ${job.title}...`,
      `Researching company culture for ${job.company}...`,
      `Mapping technical stack competencies...`,
      `Generating technical & behavioral interview questions...`,
      `Finding recommended learning resources & videos...`,
      `Building personalized 2-week study plan...`,
    ];

    let stepIndex = 0;
    setGenerationStep(steps[0]);

    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setGenerationStep(steps[stepIndex]);
      }
    }, 1800);

    try {
      let userProfile = { skills: [], experience: [] };
      try {
        const profileRes = await fetch("/api/profile", { credentials: "include" });
        if (profileRes.ok) {
          userProfile = await profileRes.json();
        }
      } catch (e) {
        console.warn("Could not fetch profile, using defaults");
      }

      const response = await fetch("/api/interview-prep/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          job: {
            title: job.title,
            company: job.company,
            description: job.description,
            requirements: job.requirements,
            skills: job.skills,
            location: job.location,
          },
          userProfile,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to generate interview prep");
      }

      const result = await response.json();
      setPrepData(result.data);
      
      try {
        const saveResponse = await fetch("/api/profile/interview-preps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            ...result.data,
          }),
        });
        
        if (saveResponse.ok) {
          setSavedPreps(prev => ({
            ...prev,
            [job.id]: result.data,
          }));
          toast({
            title: "Prep Kit Saved!",
            description: "Your customized interview preparation material has been saved.",
          });
        }
      } catch (saveErr) {
        console.error("Failed to save prep:", saveErr);
      }
    } catch (err: any) {
      console.error("Error generating prep:", err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Medium": return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "Hard": return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-400";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "High": return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case "Medium": return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "Low": return "bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Interview Simulator & Research Coach
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Interview Preparation Kit
          </h1>
          <p className="text-muted-foreground mt-1">
            Deep role research, technical questions, hints, sample answers, and structured study plans powered by Groq AI.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted rounded-xl">
          <TabsTrigger value="saved-jobs" className="flex items-center gap-2 rounded-lg text-xs font-semibold">
            <Bookmark className="w-3.5 h-3.5" />
            Saved Jobs ({savedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="prep-results" className="flex items-center gap-2 rounded-lg text-xs font-semibold" disabled={!selectedJob}>
            <GraduationCap className="w-3.5 h-3.5" />
            Prep Kit {selectedJob && `(${selectedJob.company})`}
          </TabsTrigger>
        </TabsList>

        {/* Saved Jobs Tab */}
        <TabsContent value="saved-jobs" className="mt-6">
          {isLoadingJobs ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedJobs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Saved Jobs Available</h3>
                <p className="text-muted-foreground text-sm max-w-md mb-4">
                  Bookmark job listings on the Job Discovery page to generate AI interview prep materials and study guides.
                </p>
                <Button onClick={() => window.location.href = "/jobs"} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  Discover Opportunities
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((job) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Card className="h-full flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-md group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold group-hover:text-primary transition-colors line-clamp-1">
                            {job.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium text-foreground">{job.company}</span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {job.matchScore && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                              {job.matchScore}% Match
                            </Badge>
                          )}
                          {savedPreps[job.id] && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-blue-500" /> Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {job.location || "Remote"}
                        {job.salary && <span className="ml-2 font-semibold text-foreground">💰 {job.salary}</span>}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>
                    </CardContent>
                    <CardFooter className="pt-3 border-t flex gap-2">
                      <Button 
                        className="flex-1 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                        onClick={() => generatePrep(job)} 
                        disabled={isGenerating}
                      >
                        {savedPreps[job.id] ? (
                          <>
                            <BookOpen className="w-3.5 h-3.5 mr-1.5" /> View Prep Kit
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" /> Generate Kit
                          </>
                        )}
                      </Button>
                      {savedPreps[job.id] && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => generatePrep(job, true)} 
                          disabled={isGenerating}
                          title="Regenerate interview kit"
                          className="h-9 w-9 shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeSavedJob(job.id)}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Prep Results Tab */}
        <TabsContent value="prep-results" className="mt-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-muted rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Analyzing Role & Company Insights</h3>
                  <p className="text-sm text-muted-foreground mt-1">Generating prep kit for {selectedJob?.title} at {selectedJob?.company}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-xs font-semibold text-primary animate-pulse max-w-sm">
                  {generationStep}
                </div>
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
                <h3 className="text-lg font-bold">Preparation Failed</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
                <Button onClick={() => selectedJob && generatePrep(selectedJob, true)}>Retry Generation</Button>
              </motion.div>
            ) : prepData ? (
              <motion.div key="results" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
                {/* Back Button & Job Title Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-1">
                      <Building2 className="w-3.5 h-3.5" /> {prepData.company}
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{prepData.jobTitle}</h2>
                    <p className="text-xs text-blue-100/80 mt-1">AI-Researched Technical & Behavioral Candidate Preparation Kit</p>
                  </div>

                  <Button variant="secondary" size="sm" onClick={() => setActiveTab("saved-jobs")} className="self-start sm:self-center gap-2 text-xs">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Saved Jobs
                  </Button>
                </div>

                {/* Company & Role Insights Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" /> Company Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <span className="font-semibold text-foreground block mb-0.5">Overview</span>
                        <p className="text-muted-foreground leading-relaxed">{prepData.companyInsights.overview}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-0.5">Culture & Values</span>
                        <p className="text-muted-foreground leading-relaxed">{prepData.companyInsights.culture}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-0.5">Interview Process</span>
                        <p className="text-muted-foreground leading-relaxed">{prepData.companyInsights.interviewProcess}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-500" /> Role Dynamics & Salary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <span className="font-semibold text-foreground block mb-0.5">Day-to-Day Responsibilities</span>
                        <p className="text-muted-foreground leading-relaxed">{prepData.roleInsights.dayToDay}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-0.5">Career Growth Path</span>
                        <p className="text-muted-foreground leading-relaxed">{prepData.roleInsights.growthPath}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-0.5 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Benchmark Compensation
                        </span>
                        <p className="text-emerald-700 dark:text-emerald-400 font-bold">{prepData.roleInsights.salaryRange}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tech Stack Analysis */}
                <Card className="border-border/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" /> Tech Stack & Key Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div>
                      <span className="font-semibold text-foreground block mb-2">Required Core Technologies</span>
                      <div className="flex flex-wrap gap-1.5">
                        {prepData.techStackAnalysis.requiredTechnologies.map((tech) => (
                          <Badge key={tech} className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {prepData.techStackAnalysis.niceToHave.length > 0 && (
                      <div>
                        <span className="font-semibold text-foreground block mb-2">Nice-to-Have Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {prepData.techStackAnalysis.niceToHave.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-muted-foreground">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Interview Questions & Study Modules Accordion */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" /> Key Question Modules & Topic Guides
                  </h3>

                  {prepData.topics.map((topic, topicIdx) => (
                    <Card key={topicIdx} className="border-border/80">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            {topic.title}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5">{topic.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getImportanceColor(topic.importance)}`}>
                          {topic.importance} Priority
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* YouTube Video Prep Tutorial */}
                        {(() => {
                          const video = topic.youtubeVideo || {
                            title: `${topic.title} Tutorial & Video Guide`,
                            channel: "YouTube Search",
                            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic.title} ${prepData.jobTitle} tutorial`)}`,
                          };

                          return (
                            <div className="p-3.5 bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
                                  <Youtube className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                                    Recommended YouTube Tutorial
                                  </span>
                                  <h4 className="text-xs font-bold text-foreground leading-snug break-words">
                                    {video.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground break-words">
                                    Channel: <span className="font-medium text-foreground/80">{video.channel}</span>
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" asChild className="w-full sm:w-auto shrink-0 text-xs border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 h-8">
                                <a href={video.url} target="_blank" rel="noopener noreferrer">
                                  Watch Tutorial <ExternalLink className="ml-1.5 w-3.5 h-3.5" />
                                </a>
                              </Button>
                            </div>
                          );
                        })()}

                        {/* Questions Accordion */}
                        <Accordion type="single" collapsible className="w-full">
                          {topic.questions.map((q, qIdx) => (
                            <AccordionItem key={qIdx} value={`item-${topicIdx}-${qIdx}`}>
                              <AccordionTrigger className="text-xs font-semibold hover:no-underline py-3">
                                <div className="flex items-center gap-2 text-left">
                                  <Badge variant="outline" className={`text-[10px] ${getDifficultyColor(q.difficulty)}`}>
                                    {q.difficulty}
                                  </Badge>
                                  <span>{q.question}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-3 pt-2 text-xs">
                                <div className="p-3 bg-muted/60 rounded-lg space-y-1.5">
                                  <span className="font-semibold text-foreground flex items-center gap-1">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Why This Is Asked
                                  </span>
                                  <p className="text-muted-foreground">{q.whyAsked}</p>
                                </div>

                                {q.hints.length > 0 && (
                                  <div>
                                    <span className="font-semibold text-foreground block mb-1">Key Strategy Hints</span>
                                    <ul className="space-y-1 text-muted-foreground">
                                      {q.hints.map((h, i) => (
                                        <li key={i} className="flex items-start gap-1.5">
                                          <span className="text-primary font-bold">•</span>
                                          <span>{h}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {q.sampleAnswer && (
                                  <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg space-y-1">
                                    <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Ideal Candidate Answer Framework
                                    </span>
                                    <p className="text-foreground/90 leading-relaxed pt-1">{q.sampleAnswer}</p>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 2-Week Study Plan */}
                {prepData.studyPlan && (
                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" /> Recommended Study Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3 text-xs">
                      <div className="p-3.5 bg-muted/50 rounded-xl space-y-2 border">
                        <span className="font-bold text-foreground block">Week 1: Core Fundamentals</span>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {prepData.studyPlan.week1.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3.5 bg-muted/50 rounded-xl space-y-2 border">
                        <span className="font-bold text-foreground block">Week 2: Applied & Mock Practice</span>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {prepData.studyPlan.week2.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Final 48 Hours</span>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {prepData.studyPlan.lastDays.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
