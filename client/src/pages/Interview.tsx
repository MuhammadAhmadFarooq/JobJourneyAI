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
  GraduationCap, MessageSquare, Code, Users, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Load saved jobs from MongoDB
  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await fetch("/api/profile/saved-jobs", {
          credentials: "include",
        });
        
        if (response.ok) {
          const jobs = await response.json();
          // Transform the data to match SavedJob interface
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
      await fetch(`/api/profile/saved-jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      const updated = savedJobs.filter(j => j.id !== jobId);
      setSavedJobs(updated);
      
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
        setPrepData(null);
      }
    } catch (err) {
      console.error("Failed to remove job:", err);
    }
  };

  const generatePrep = async (job: SavedJob) => {
    setSelectedJob(job);
    setIsGenerating(true);
    setError(null);
    setPrepData(null);
    setActiveTab("prep-results");

    const steps = [
      "Researching company culture and interview process...",
      "Analyzing role requirements and tech stack...",
      "Searching for recent interview experiences...",
      "Identifying trending topics and best practices...",
      "Generating personalized interview questions...",
      "Creating your study guide..."
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setGenerationStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 2000);

    try {
      // Fetch user profile from MongoDB
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
      case "Easy": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Hard": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "High": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Low": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Technical": return <Code className="w-3 h-3" />;
      case "Behavioral": return <Users className="w-3 h-3" />;
      case "System Design": return <Target className="w-3 h-3" />;
      case "Coding": return <Code className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-primary" />
          Interview Preparation
        </h1>
        <p className="text-muted-foreground">
          AI-powered deep research to help you ace your interviews. Select a saved job to generate personalized prep materials.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="saved-jobs" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Saved Jobs ({savedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="prep-results" className="flex items-center gap-2" disabled={!selectedJob}>
            <GraduationCap className="w-4 h-4" />
            Prep Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved-jobs" className="mt-6">
          {savedJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Saved Jobs Yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Save jobs from the Job Discovery page to prepare for interviews. 
                  Click the "Save" button on any job listing to add it here.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/jobs"}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((job) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {job.company}
                          </CardDescription>
                        </div>
                        {job.matchScore && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {job.matchScore}%
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        {job.salary && <span>💰 {job.salary}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.skills.slice(0, 4).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                          {job.skills.length > 4 && <Badge variant="outline" className="text-xs">+{job.skills.length - 4}</Badge>}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex gap-2">
                      <Button className="flex-1" onClick={() => generatePrep(job)} disabled={isGenerating}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Prepare
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => removeSavedJob(job.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prep-results" className="mt-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 border-4 border-muted rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <Search className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Preparing for {selectedJob?.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">at {selectedJob?.company}</p>
                <div className="h-6 text-sm text-primary animate-pulse">{generationStep}</div>
                <Progress value={33} className="w-64 mt-4" />
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => selectedJob && generatePrep(selectedJob)}>Try Again</Button>
              </motion.div>
            ) : prepData ? (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => { setActiveTab("saved-jobs"); setPrepData(null); }}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Saved Jobs
                  </Button>
                  <div className="text-right">
                    <h2 className="font-semibold">{prepData.jobTitle}</h2>
                    <p className="text-sm text-muted-foreground">{prepData.company}</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          Company Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div><h4 className="font-medium mb-1">Overview</h4><p className="text-muted-foreground">{prepData.companyInsights.overview}</p></div>
                        <div><h4 className="font-medium mb-1">Culture</h4><p className="text-muted-foreground">{prepData.companyInsights.culture}</p></div>
                        <div><h4 className="font-medium mb-1">Interview Process</h4><p className="text-muted-foreground">{prepData.companyInsights.interviewProcess}</p></div>
                        {prepData.companyInsights.recentNews.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-1">Recent News</h4>
                            <ul className="text-muted-foreground space-y-1">
                              {prepData.companyInsights.recentNews.map((news, i) => (
                                <li key={i} className="flex items-start gap-2"><span className="text-primary">•</span>{news}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          Role Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div><h4 className="font-medium mb-1">What You'll Do</h4><p className="text-muted-foreground">{prepData.roleInsights.overview}</p></div>
                        <div><h4 className="font-medium mb-1">Day-to-Day</h4><p className="text-muted-foreground">{prepData.roleInsights.dayToDay}</p></div>
                        <div><h4 className="font-medium mb-1">Growth Path</h4><p className="text-muted-foreground">{prepData.roleInsights.growthPath}</p></div>
                        <div><h4 className="font-medium mb-1">Expected Salary</h4><p className="text-muted-foreground">{prepData.roleInsights.salaryRange}</p></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="w-4 h-4 text-primary" />
                          Tech Stack Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Must Know</h4>
                          <div className="flex flex-wrap gap-1">
                            {prepData.techStackAnalysis.requiredTechnologies.map((tech, i) => (
                              <Badge key={i} variant="default" className="text-xs">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Nice to Have</h4>
                          <div className="flex flex-wrap gap-1">
                            {prepData.techStackAnalysis.niceToHave.map((tech, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Trending</h4>
                          <div className="flex flex-wrap gap-1">
                            {prepData.techStackAnalysis.trendingInField.map((tech, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Study Plan
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                            Week 1
                          </h4>
                          <ul className="text-muted-foreground space-y-1 ml-7">
                            {prepData.studyPlan.week1.map((task, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-1 text-muted-foreground/50" />{task}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                            Week 2
                          </h4>
                          <ul className="text-muted-foreground space-y-1 ml-7">
                            {prepData.studyPlan.week2.map((task, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-1 text-muted-foreground/50" />{task}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">!</span>
                            Final Days
                          </h4>
                          <ul className="text-muted-foreground space-y-1 ml-7">
                            {prepData.studyPlan.lastDays.map((task, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 mt-1 text-muted-foreground/50" />{task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          Interview Topics & Questions
                        </CardTitle>
                        <CardDescription>
                          {prepData.topics.reduce((acc, t) => acc + t.questions.length, 0)} questions across {prepData.topics.length} topics
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {prepData.topics.map((topic, topicIdx) => (
                            <AccordionItem key={topicIdx} value={`topic-${topicIdx}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3 flex-1 text-left">
                                  <span className="font-semibold">{topic.title}</span>
                                  <Badge className={`text-xs ${getImportanceColor(topic.importance)}`}>{topic.importance}</Badge>
                                  <span className="text-xs text-muted-foreground ml-auto mr-2">{topic.questions.length} questions</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-2">
                                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                                    <div>
                                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Concepts</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {topic.keyConceptsToReview.map((concept, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">{concept}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    {topic.commonMistakes.length > 0 && (
                                      <div>
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" />Common Mistakes
                                        </h5>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                          {topic.commonMistakes.map((mistake, i) => (
                                            <li key={i} className="flex items-start gap-2"><span className="text-destructive">•</span>{mistake}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-3">
                                    {topic.questions.map((q, qIdx) => (
                                      <Card key={qIdx} className="border-l-4 border-l-primary/50">
                                        <CardContent className="pt-4">
                                          <div className="flex items-start justify-between gap-4 mb-3">
                                            <h4 className="font-medium text-sm flex-1">{q.question}</h4>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                {getTypeIcon(q.type)}{q.type}
                                              </Badge>
                                              <Badge className={`text-xs ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>
                                            </div>
                                          </div>
                                          <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="hints" className="border-none">
                                              <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
                                                <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" />Show hints & answer guide</span>
                                              </AccordionTrigger>
                                              <AccordionContent>
                                                <div className="space-y-3 pt-2">
                                                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-3">
                                                    <h5 className="text-xs font-semibold mb-2 flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                                                      <Lightbulb className="w-3 h-3" />Hints
                                                    </h5>
                                                    <ul className="text-sm space-y-1">
                                                      {q.hints.map((hint, i) => (<li key={i} className="text-muted-foreground">• {hint}</li>))}
                                                    </ul>
                                                  </div>
                                                  {q.sampleAnswer && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
                                                      <h5 className="text-xs font-semibold mb-2 text-green-700 dark:text-green-400">Sample Answer Approach</h5>
                                                      <p className="text-sm text-muted-foreground">{q.sampleAnswer}</p>
                                                    </div>
                                                  )}
                                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
                                                    <h5 className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-400">Why This is Asked</h5>
                                                    <p className="text-sm text-muted-foreground">{q.whyAsked}</p>
                                                  </div>
                                                </div>
                                              </AccordionContent>
                                            </AccordionItem>
                                          </Accordion>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />Pro Tips
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {prepData.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-destructive" />Red Flags to Watch
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {prepData.redFlags.map((flag, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />Questions to Ask Your Interviewer
                        </CardTitle>
                        <CardDescription>Asking thoughtful questions shows your interest and helps you evaluate the role</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 md:grid-cols-2">
                          {prepData.questionsToAsk.map((question, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                              <span className="text-sm">{question}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : selectedJob ? (
              <div className="text-center py-16 text-muted-foreground">Click "Prepare" to generate interview materials for {selectedJob.title}</div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">Select a saved job to start preparing</div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
