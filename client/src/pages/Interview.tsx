import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Loader2, Search, BookOpen, BrainCircuit, Lightbulb, 
  Bookmark, Building2, MapPin, Sparkles, CheckCircle2, 
  AlertTriangle, Target, Calendar, ArrowLeft, Trash2,
  GraduationCap, Youtube, ExternalLink, RefreshCw, Layers, ShieldCheck, DollarSign, HelpCircle, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

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
        toast({
          title: "Job Removed",
          description: "Removed from saved opportunities.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove job.",
        variant: "destructive",
      });
    }
  };

  const generatePrep = async (job: SavedJob, forceRegenerate = false) => {
    setSelectedJob(job);
    setError(null);

    if (!forceRegenerate && savedPreps[job.id]) {
      setPrepData(savedPreps[job.id]);
      setActiveTab("prep-results");
      return;
    }

    setIsGenerating(true);
    setActiveTab("prep-results");
    setGenerationStep("Analyzing target role & company requirements...");

    try {
      const stepTimer1 = setTimeout(() => {
        setGenerationStep("Synthesizing core technical questions & framework answers...");
      }, 1500);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep("Indexing curated YouTube tutorial video masterclasses...");
      }, 3000);

      const stepTimer3 = setTimeout(() => {
        setGenerationStep("Structuring 2-week personalized study plan...");
      }, 4500);

      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          description: job.description,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok) {
        let errorMsg = "Failed to generate interview prep kit";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch {
          const errorText = await response.text();
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      let result: any;
      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid response format received from server.");
      }

      const generatedPrep = result.prepData || result.data || result;
      setPrepData(generatedPrep);
      setSavedPreps(prev => ({ ...prev, [job.id]: generatedPrep }));

      toast({
        title: "Prep Kit Ready!",
        description: `Generated research & question guides for ${job.title}.`,
      });
    } catch (err: any) {
      console.error("Interview prep error:", err);
      setError(err.message || "Failed to generate interview kit. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Hard": return "text-destructive border-destructive/30";
      case "Medium": return "text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "Easy": return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default: return "";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "High": return "border-destructive/40 text-destructive";
      case "Medium": return "border-primary/40 text-primary";
      case "Low": return "border-border text-muted-foreground";
      default: return "border-border text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-0 pb-8 overflow-x-hidden">
      <SEO 
        title="AI Interview Preparation & Practice Kit" 
        description="Master your upcoming tech interviews with AI-generated behavioral questions, coding hints, sample answers, curated YouTube tutorial videos, and 2-week study schedules." 
        canonical="/interview"
        keywords="interview prep, mock interview questions, behavioral interview questions, tech interview tutorial, coding interview practice"
      />

      {/* Header Banner - Clean & Readable */}
      <div className="pb-5 border-b border-border/60">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground mb-3">
          <BrainCircuit className="w-3.5 h-3.5 text-primary shrink-0" /> AI Interview Simulator & Coach
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground break-words">
          Interview Preparation Kit
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-3xl leading-relaxed break-words">
          Deep role research, technical questions, hints, sample answers, YouTube tutorials, and structured study plans powered by Groq AI.
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-11 sm:h-12 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="saved-jobs" className="text-xs sm:text-sm font-medium gap-2 px-3 sm:px-4">
            <Bookmark className="w-4 h-4 shrink-0" />
            <span>Saved Jobs ({savedJobs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="prep-results" className="text-xs sm:text-sm font-medium gap-2 px-3 sm:px-4" disabled={!selectedJob && !prepData}>
            <GraduationCap className="w-4 h-4 shrink-0 text-primary" />
            <span className="truncate">Prep Kit {selectedJob && `(${selectedJob.company})`}</span>
          </TabsTrigger>
        </TabsList>

        {/* Saved Jobs Tab */}
        <TabsContent value="saved-jobs" className="mt-6 sm:mt-8 space-y-6">
          {isLoadingJobs ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedJobs.length === 0 ? (
            <Card className="h-[300px] sm:h-[360px] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-base sm:text-lg font-semibold">No Saved Jobs Available</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Bookmark target opportunities on the Job Discovery page to generate customized interview preparation kits and study plans.
                </p>
                <Button onClick={() => window.location.href = "/jobs"} size="default" className="text-xs sm:text-sm h-10 mt-1 px-5">
                  Discover Opportunities <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((job) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <Card className="h-full flex flex-col justify-between border-border/80 bg-card hover:border-primary/40 transition-colors overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 pb-2.5 space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2.5">
                        <div className="min-w-0 flex-1 space-y-1 w-full sm:w-auto">
                          <CardTitle className="text-base sm:text-lg font-bold break-words hover:text-primary transition-colors leading-snug">
                            {job.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-xs sm:text-sm break-words">
                            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">{job.company}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {job.matchScore && (
                            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                              {job.matchScore}% Match
                            </Badge>
                          )}
                          {savedPreps[job.id] && (
                            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-1 flex-1 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> {job.location || "Remote"}</span>
                        {job.salary && <span className="ml-auto font-medium text-foreground">{job.salary}</span>}
                      </div>
                      <p className="text-muted-foreground line-clamp-3 leading-relaxed break-words">{job.description}</p>
                    </CardContent>
                    <CardFooter className="p-4 sm:p-5 pt-3 border-t border-border/60 flex items-center gap-2">
                      <Button 
                        size="sm"
                        className="flex-1 min-w-0 text-xs sm:text-sm font-semibold h-9" 
                        onClick={() => generatePrep(job)} 
                        disabled={isGenerating}
                      >
                        {savedPreps[job.id] ? (
                          <>
                            <BookOpen className="w-3.5 h-3.5 mr-1.5 shrink-0" /> <span className="truncate">View Prep Kit</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" /> <span className="truncate">Generate Kit</span>
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
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
        <TabsContent value="prep-results" className="mt-6 sm:mt-8 space-y-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <Card className="h-[320px] sm:h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Analyzing Role & Company Insights</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Generating customized kit for {selectedJob?.title} at {selectedJob?.company}</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg text-xs sm:text-sm text-primary font-medium border border-border/50 max-w-md">
                    {generationStep}
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Preparation Failed</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md">{error}</p>
                  <Button size="default" onClick={() => selectedJob && generatePrep(selectedJob, true)} className="text-xs sm:text-sm h-9">Retry Generation</Button>
                </CardContent>
              </Card>
            ) : prepData ? (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                {/* Header Card - Minimal SaaS */}
                <Card className="border-border/80 bg-card overflow-hidden">
                  <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <Badge variant="outline" className="text-xs font-normal uppercase shrink-0 px-2.5 py-0.5">
                        Interview Prep Kit
                      </Badge>
                      <h2 className="text-lg sm:text-2xl font-bold text-foreground break-words">
                        {prepData.jobTitle} <span className="font-normal text-muted-foreground">at {prepData.company}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        AI-Researched Technical & Behavioral Candidate Preparation Kit
                      </p>
                    </div>

                    <Button variant="outline" size="default" onClick={() => setActiveTab("saved-jobs")} className="self-start sm:self-auto gap-2 text-xs sm:text-sm h-9 shrink-0">
                      <ArrowLeft className="w-4 h-4" /> Back to Saved Jobs
                    </Button>
                  </CardContent>
                </Card>

                {/* Company & Role Insights Grid */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <Card className="border-border/80 overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-border/60">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary shrink-0" /> Company Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3.5 text-xs sm:text-sm">
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Overview</span>
                        <p className="text-muted-foreground leading-relaxed break-words">{prepData.companyInsights.overview}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Culture & Values</span>
                        <p className="text-muted-foreground leading-relaxed break-words">{prepData.companyInsights.culture}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Interview Process</span>
                        <p className="text-muted-foreground leading-relaxed break-words">{prepData.companyInsights.interviewProcess}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/80 overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-border/60">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary shrink-0" /> Role Dynamics & Salary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3.5 text-xs sm:text-sm">
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Day-to-Day Responsibilities</span>
                        <p className="text-muted-foreground leading-relaxed break-words">{prepData.roleInsights.dayToDay}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Career Growth Path</span>
                        <p className="text-muted-foreground leading-relaxed break-words">{prepData.roleInsights.growthPath}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Benchmark Compensation</span>
                        <p className="text-foreground font-semibold">{prepData.roleInsights.salaryRange}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tech Stack Analysis */}
                <Card className="border-border/80 overflow-hidden">
                  <CardHeader className="p-5 pb-3 border-b border-border/60">
                    <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary shrink-0" /> Tech Stack & Key Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-foreground block mb-2">Required Core Technologies</span>
                      <div className="flex flex-wrap gap-2">
                        {prepData.techStackAnalysis.requiredTechnologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs font-normal px-3 py-1 break-words">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {prepData.techStackAnalysis.niceToHave.length > 0 && (
                      <div>
                        <span className="font-semibold text-foreground block mb-2">Nice-to-Have Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {prepData.techStackAnalysis.niceToHave.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs font-normal px-3 py-1 break-words">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Interview Questions & Study Modules Accordion */}
                <div className="space-y-4 sm:space-y-5">
                  <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0" /> Key Question Modules & Topic Guides
                  </h3>

                  {prepData.topics.map((topic, topicIdx) => (
                    <Card key={topicIdx} className="border-border/80 overflow-hidden">
                      <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60">
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base font-bold break-words">
                            {topic.title}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-0.5 break-words">{topic.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className={`text-xs shrink-0 self-start sm:self-auto font-medium px-2.5 py-0.5 ${getImportanceColor(topic.importance)}`}>
                          {topic.importance} Priority
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        {/* YouTube Video Prep Tutorial */}
                        {(() => {
                          const video = topic.youtubeVideo || {
                            title: `${topic.title} Tutorial & Video Guide`,
                            channel: "YouTube Search",
                            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic.title} ${prepData.jobTitle} tutorial`)}`,
                          };

                          return (
                            <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                  <Youtube className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                                    Recommended YouTube Tutorial
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                                    {video.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground break-words">
                                    Channel: <span className="font-medium text-foreground/80">{video.channel}</span>
                                  </p>
                                </div>
                              </div>
                              <Button size="default" variant="outline" asChild className="w-full sm:w-auto shrink-0 text-xs sm:text-sm border-border/80 hover:bg-muted h-9 px-4">
                                <a href={video.url} target="_blank" rel="noopener noreferrer">
                                  Watch Tutorial <ExternalLink className="ml-2 w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          );
                        })()}

                        {/* Questions Accordion */}
                        <Accordion type="single" collapsible className="w-full space-y-2">
                          {topic.questions.map((q, qIdx) => (
                            <AccordionItem key={qIdx} value={`item-${topicIdx}-${qIdx}`} className="border border-border/60 rounded-lg px-4">
                              <AccordionTrigger className="text-xs sm:text-sm font-semibold hover:no-underline py-3.5">
                                <div className="flex items-start gap-2.5 text-left min-w-0">
                                  <Badge variant="outline" className={`text-xs shrink-0 mt-0.5 font-normal px-2 py-0.5 ${getDifficultyColor(q.difficulty)}`}>
                                    {q.difficulty}
                                  </Badge>
                                  <span className="break-words leading-relaxed">{q.question}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-3.5 pt-2 pb-4 text-xs sm:text-sm overflow-hidden">
                                <div className="p-3.5 bg-muted/40 rounded-lg space-y-1 overflow-hidden border border-border/40">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> Why This Is Asked
                                  </span>
                                  <p className="text-muted-foreground break-words leading-relaxed">{q.whyAsked}</p>
                                </div>

                                {q.hints.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="font-semibold text-foreground block">Key Strategy Hints</span>
                                    <ul className="space-y-1.5 text-muted-foreground">
                                      {q.hints.map((h, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-primary font-bold shrink-0">•</span>
                                          <span className="break-words leading-relaxed">{h}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {q.sampleAnswer && (
                                  <div className="p-4 bg-muted/30 border border-border/60 rounded-lg space-y-1.5">
                                    <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Ideal Candidate Answer Framework
                                    </span>
                                    <p className="text-foreground/90 leading-relaxed pt-1 break-words">{q.sampleAnswer}</p>
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
                  <Card className="border-border/80 overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-border/60">
                      <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary shrink-0" /> Recommended Study Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 grid gap-4 md:grid-cols-3 text-xs sm:text-sm">
                      <div className="p-4 bg-muted/30 rounded-lg space-y-2 border border-border/40">
                        <span className="font-semibold text-foreground block text-sm">Week 1: Core Fundamentals</span>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {prepData.studyPlan.week1.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold shrink-0">•</span>
                              <span className="break-words leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg space-y-2 border border-border/40">
                        <span className="font-semibold text-foreground block text-sm">Week 2: Applied & Mock Practice</span>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {prepData.studyPlan.week2.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold shrink-0">•</span>
                              <span className="break-words leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg space-y-2 border border-border/40">
                        <span className="font-semibold text-foreground block text-sm">Final 48 Hours</span>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {prepData.studyPlan.lastDays.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold shrink-0">•</span>
                              <span className="break-words leading-relaxed">{item}</span>
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
