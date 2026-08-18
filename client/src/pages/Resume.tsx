import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, FileText, Check, Loader2, Sparkles, AlertCircle, Briefcase, 
  GraduationCap, FolderGit2, Award, Target, TrendingUp, RefreshCw, 
  CheckCircle2, ShieldCheck, Mail, Phone, MapPin, Copy, Download, 
  Wand2, Send, FileEdit, Star, ChevronRight, Layers, ArrowRight, FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: {
    name: string;
    level: number;
    category: string;
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    graduationDate?: string;
    gpa?: string;
    relevantCoursework: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  certifications: string[];
  profileSummary: string;
  suggestedRoles: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

const defaultData: ParsedResumeData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  profileSummary: "",
  suggestedRoles: [],
  strengthAreas: [],
  improvementAreas: [],
};

export default function Resume() {
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("tab") || "analysis";
  const queryTitle = params.get("title") || "";
  const queryCompany = params.get("company") || "";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ParsedResumeData>(defaultData);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);

  // Resume Tailor State
  const [tailorJobTitle, setTailorJobTitle] = useState(queryTitle);
  const [tailorCompany, setTailorCompany] = useState(queryCompany);
  const [tailorJobDescription, setTailorJobDescription] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<any>(null);

  // Cover Letter / Outreach State
  const [clJobTitle, setClJobTitle] = useState(queryTitle);
  const [clCompany, setClCompany] = useState(queryCompany);
  const [clJobDescription, setClJobDescription] = useState("");
  const [clRecruiterName, setClRecruiterName] = useState("");
  const [clMode, setClMode] = useState<"cover-letter" | "cold-email" | "linkedin-message">("cover-letter");
  const [clTone, setClTone] = useState<"professional" | "enthusiastic" | "executive" | "direct">("professional");
  const [isGeneratingCl, setIsGeneratingCl] = useState(false);
  const [clResult, setClResult] = useState<any>(null);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isParsingRef = useRef(false);
  const lastParsedFileRef = useRef<string | null>(null);

  // Load existing profile & saved jobs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/profile", { credentials: "include" });
        if (response.ok) {
          const profile = await response.json();
          if (profile.resumeFileName) {
            setFileName(profile.resumeFileName);
            setUploadDate(profile.resumeUploadedAt ? new Date(profile.resumeUploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null);
            setResumeData({
              name: profile.name || "",
              email: profile.email || "",
              phone: profile.phone || "",
              location: profile.location || "",
              summary: profile.summary || "",
              skills: profile.skills || [],
              experience: profile.experience || [],
              education: profile.education || [],
              projects: profile.projects || [],
              certifications: profile.certifications || [],
              profileSummary: profile.profileSummary || "",
              suggestedRoles: profile.suggestedRoles || [],
              strengthAreas: profile.strengthAreas || [],
              improvementAreas: [],
            });
            setIsAnalyzed(true);
          }
        }

        const savedResponse = await fetch("/api/profile/saved-jobs", { credentials: "include" });
        if (savedResponse.ok) {
          const saved = await savedResponse.json();
          setSavedJobs(saved);
        }
      } catch (err) {
        console.error("Failed to load profile/jobs:", err);
      }
    };

    loadData();
  }, []);

  const handleUploadClick = () => {
    if (isUploading || isParsingRef.current) return;
    fileInputRef.current?.click();
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      return fullText;
    } catch (err) {
      console.error("Error parsing PDF:", err);
      throw new Error("Failed to parse PDF file. Please ensure it contains selectable text.");
    }
  };

  const parseResumeWithAI = async (text: string, fileName: string): Promise<ParsedResumeData> => {
    const response = await fetch("/api/resumes/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rawText: text, fileName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to parse resume");
    }

    const result = await response.json();
    return result.data;
  };

  const processFile = async (file: File) => {
    const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
    if (isUploading || isParsingRef.current) return;

    if (lastParsedFileRef.current === fileKey && isAnalyzed) return;

    isParsingRef.current = true;

    setFileName(file.name);
    setUploadDate(new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }));
    setIsAnalyzed(false);
    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatus("Reading file content...");
    setError(null);

    try {
      setUploadProgress(35);
      setUploadStatus("Extracting text structure...");

      let text = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }

      if (!text || text.trim().length < 50) {
        throw new Error("Could not extract enough text from the file. Please upload a PDF or text file with selectable text.");
      }

      setUploadProgress(65);
      setUploadStatus("⚡ Groq AI is analyzing skills & experience...");

      const parsedData = await parseResumeWithAI(text, file.name);

      setUploadProgress(85);
      setUploadStatus("Saving your profile analysis...");
      setResumeData(parsedData);

      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            resumeFileName: file.name,
            resumeUploadedAt: new Date(),
            name: parsedData.name,
            email: parsedData.email,
            phone: parsedData.phone,
            location: parsedData.location,
            summary: parsedData.summary,
            skills: parsedData.skills,
            experience: parsedData.experience,
            education: parsedData.education,
            projects: parsedData.projects,
            certifications: parsedData.certifications,
            profileSummary: parsedData.profileSummary,
            suggestedRoles: parsedData.suggestedRoles,
            strengthAreas: parsedData.strengthAreas,
          }),
        });
      } catch (saveErr) {
        console.warn("Failed to save profile to server:", saveErr);
      }

      setUploadProgress(100);
      setUploadStatus("Analysis complete!");

      setTimeout(() => {
        setIsUploading(false);
        setIsAnalyzed(true);
        lastParsedFileRef.current = fileKey;
      }, 400);

    } catch (err: any) {
      console.error("Resume parsing error:", err);
      setError(err.message || "Could not parse file. Please try again.");
      setIsUploading(false);
    } finally {
      isParsingRef.current = false;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Generate Tailored Resume
  const generateTailoredResume = async () => {
    if (!tailorJobTitle || !tailorJobDescription) {
      toast({
        title: "Missing Information",
        description: "Please enter a target job title and job description.",
        variant: "destructive",
      });
      return;
    }

    setIsTailoring(true);
    try {
      const response = await fetch("/api/profile/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: tailorJobTitle,
          company: tailorCompany,
          jobDescription: tailorJobDescription,
          resumeData: resumeData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to tailor resume");
      }

      setTailorResult(data);
      toast({
        title: "Resume Tailored Successfully!",
        description: `Estimated ATS Score boosted to ${data.matchScoreAfter}% match!`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  // Generate Cover Letter or Outreach Message
  const generateCoverLetter = async () => {
    if (!clJobTitle || !clJobDescription) {
      toast({
        title: "Missing Information",
        description: "Please enter a target job title and job description.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCl(true);
    try {
      const response = await fetch("/api/profile/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobTitle: clJobTitle,
          company: clCompany,
          jobDescription: clJobDescription,
          recruiterName: clRecruiterName,
          mode: clMode,
          tone: clTone,
          resumeData: resumeData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate document");
      }

      setClResult(data);
      toast({
        title: "Document Generated!",
        description: `Personalized ${clMode.replace("-", " ")} ready.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCl(false);
    }
  };

  const copyToClipboard = (text: string, title = "Copied!") => {
    navigator.clipboard.writeText(text);
    toast({ title, description: "Copied to clipboard." });
  };

  const downloadAsTextFile = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const skillCategories = ["Frontend", "Backend", "Language", "Database", "Cloud", "DevOps", "Other"];

  const getSkillBadgeColor = (level: number) => {
    if (level >= 85) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (level >= 70) return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-1 sm:px-0">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Career Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Resume Intelligence & Document Studio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Parse master resumes, generate ATS-tailored job variants, and create custom cover letters or outreach emails.
          </p>
        </div>
      </div>

      {/* Main Feature Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-11 bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="analysis" className="text-xs sm:text-sm font-medium gap-2">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Master</span> Resume
          </TabsTrigger>
          <TabsTrigger value="tailor" className="text-xs sm:text-sm font-medium gap-2">
            <Wand2 className="w-4 h-4 shrink-0 text-indigo-500" />
            Resume Tailor
          </TabsTrigger>
          <TabsTrigger value="cover-letter" className="text-xs sm:text-sm font-medium gap-2">
            <Send className="w-4 h-4 shrink-0 text-emerald-500" />
            Cover Letter
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Master Resume Analysis */}
        <TabsContent value="analysis" className="mt-6 space-y-8">
          <div className="grid gap-8 md:grid-cols-12">
            {/* Upload Panel Left */}
            <div className="md:col-span-5 space-y-6">
              <Card 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
                  isDragOver 
                    ? "border-primary bg-primary/5 scale-[1.01]" 
                    : "border-border/80 hover:border-primary/50"
                }`}
                onClick={handleUploadClick}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt"
                  className="hidden"
                />
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                    {isUploading ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">
                      {isUploading ? "Processing Resume..." : "Upload Master Resume"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Drag & drop your PDF or TXT resume here, or click to browse files.
                    </p>
                  </div>

                  {isUploading ? (
                    <div className="space-y-2 pt-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-primary font-medium">{uploadStatus}</p>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs pointer-events-none">
                      Browse File
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Uploaded File Info Card */}
              {fileName && (
                <Card className="border-border/80 bg-muted/20">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">{fileName}</p>
                        <p className="text-[10px] text-muted-foreground">{uploadDate || "Uploaded"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                      Active Profile
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resume Breakdown Right */}
            <div className="md:col-span-7">
              <AnimatePresence mode="wait">
                {isAnalyzed ? (
                  <motion.div
                    key="analyzed"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    {/* Profile Header Card */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-bold text-foreground">{resumeData.name || "Candidate Profile"}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                              {resumeData.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {resumeData.email}</span>}
                              {resumeData.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {resumeData.location}</span>}
                            </div>
                          </div>
                          <Badge className="bg-primary text-primary-foreground font-bold self-start sm:self-center">
                            Master Resume
                          </Badge>
                        </div>
                        {resumeData.profileSummary && (
                          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
                            {resumeData.profileSummary}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Skill Matrix */}
                    <Card className="border-border/80">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" /> Skill Competency Matrix
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-1.5">
                          {resumeData.skills.map((skill, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className={`text-xs px-2.5 py-1 ${getSkillBadgeColor(skill.level || 80)}`}
                            >
                              {skill.name} {skill.level ? `(${skill.level}%)` : ""}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Experience Timeline */}
                    {resumeData.experience.length > 0 && (
                      <Card className="border-border/80">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-500" /> Work Experience
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {resumeData.experience.map((exp, idx) => (
                            <div key={idx} className="border-l-2 border-primary/30 pl-4 py-1 space-y-1.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-sm">{exp.role}</h4>
                                  <p className="text-xs text-muted-foreground font-medium">{exp.company}</p>
                                </div>
                                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">{exp.duration}</span>
                              </div>
                              {exp.description && <p className="text-xs text-muted-foreground leading-relaxed">{exp.description}</p>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Education */}
                    {resumeData.education && resumeData.education.length > 0 && (
                      <Card className="border-border/80">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-indigo-500" /> Education
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {resumeData.education.map((edu, idx) => (
                            <div key={idx} className="border-l-2 border-indigo-500/30 pl-4 py-1">
                              <h4 className="font-semibold text-sm">{edu.degree}</h4>
                              <p className="text-xs text-muted-foreground">{edu.institution} {edu.graduationDate ? `(${edu.graduationDate})` : ""}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Projects */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                      <Card className="border-border/80">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-emerald-500" /> Projects
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {resumeData.projects.map((proj, idx) => (
                            <div key={idx} className="border-l-2 border-emerald-500/30 pl-4 py-1 space-y-1">
                              <h4 className="font-semibold text-sm">{proj.name}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{proj.description}</p>
                              {proj.technologies?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {proj.technologies.map((tech, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px]">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Certifications */}
                    {resumeData.certifications && resumeData.certifications.length > 0 && (
                      <Card className="border-border/80">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" /> Certifications & Licenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {resumeData.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200">
                                🏆 {cert}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* AI Career Insights & Suggested Roles */}
                    {(resumeData.suggestedRoles?.length > 0 || resumeData.strengthAreas?.length > 0) && (
                      <Card className="border-border/80 bg-muted/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" /> AI Target Roles & Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                          {resumeData.suggestedRoles?.length > 0 && (
                            <div>
                              <span className="font-semibold text-foreground block mb-1.5">Suggested Target Roles</span>
                              <div className="flex flex-wrap gap-1.5">
                                {resumeData.suggestedRoles.map((role, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    🎯 {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {resumeData.strengthAreas?.length > 0 && (
                            <div>
                              <span className="font-semibold text-foreground block mb-1.5">Core Strength Areas</span>
                              <div className="flex flex-wrap gap-1.5">
                                {resumeData.strengthAreas.map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs border-primary/30 text-primary">
                                    ⚡ {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ) : (
                  <Card className="h-[360px] flex items-center justify-center border-dashed">
                    <CardContent className="text-center space-y-4 p-6">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                          <div>
                            <p className="font-medium text-base">Parsing resume structure...</p>
                            <p className="text-xs text-muted-foreground mt-1">{uploadStatus}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground/30" />
                          <div>
                            <p className="font-semibold text-base">No Resume Analyzed Yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                              Upload your PDF or TXT resume to extract skill matrix, job history, and personalize your applications.
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: AI Resume Tailor */}
        <TabsContent value="tailor" className="mt-6 space-y-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Input Form Panel */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/80">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Wand2 className="w-4.5 h-4.5 text-indigo-500" /> Target Job Parameters
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Paste the target job details or select one of your saved jobs to tailor your resume bullet points for ATS algorithms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Select from Saved Jobs */}
                  {savedJobs.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Pre-fill from Saved Jobs</Label>
                      <Select 
                        onValueChange={(jobId) => {
                          const job = savedJobs.find(j => j.jobId === jobId || j.id === jobId);
                          if (job) {
                            setTailorJobTitle(job.title || "");
                            setTailorCompany(job.company || "");
                            setTailorJobDescription(job.description || "");
                          }
                        }}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Choose a saved job..." />
                        </SelectTrigger>
                        <SelectContent>
                          {savedJobs.map((job, idx) => (
                            <SelectItem key={idx} value={job.jobId || job.id || `${idx}`} className="text-xs">
                              {job.title} at {job.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Job Title *</Label>
                    <Input 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={tailorJobTitle}
                      onChange={(e) => setTailorJobTitle(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Company Name</Label>
                    <Input 
                      placeholder="e.g. Acme Innovations" 
                      value={tailorCompany}
                      onChange={(e) => setTailorCompany(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Target Job Description *</Label>
                    <Textarea 
                      placeholder="Paste the key responsibilities, required skills, and qualifications from the job posting..." 
                      rows={7}
                      value={tailorJobDescription}
                      onChange={(e) => setTailorJobDescription(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <Button 
                    onClick={generateTailoredResume} 
                    disabled={isTailoring}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Tailoring Resume with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" /> Generate Tailored Resume Variant
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-7">
              {tailorResult ? (
                <div className="space-y-6">
                  {/* Score & Keyword Banner */}
                  <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-950/20 via-background to-blue-950/20">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <Badge variant="outline" className="border-indigo-500/40 text-indigo-600 dark:text-indigo-300 text-[10px]">
                            ATS Keyword Alignment
                          </Badge>
                          <h3 className="text-xl font-bold mt-1">{tailorResult.jobTitle} at {tailorResult.company}</h3>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center px-3 py-1.5 rounded-xl bg-background border shadow-2xs">
                            <span className="text-[10px] text-muted-foreground block">Before</span>
                            <span className="text-sm font-bold text-muted-foreground">{tailorResult.matchScoreBefore}%</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-indigo-500" />
                          <div className="text-center px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                            <span className="text-[10px] block font-semibold">Tailored</span>
                            <span className="text-base font-extrabold">{tailorResult.matchScoreAfter}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Keywords Breakdown */}
                      <div className="space-y-2 pt-3 border-t border-border/60 text-xs">
                        <span className="font-semibold text-foreground block">Matched ATS Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tailorResult.matchedKeywords?.map((kw: string, i: number) => (
                            <Badge key={i} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[11px]">
                              ✓ {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tailored Professional Summary */}
                  <Card className="border-border/80">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold">Tailored Professional Summary</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(tailorResult.tailoredSummary, "Summary Copied")}
                        className="text-xs h-7 gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-foreground/90 leading-relaxed p-3 bg-muted/40 rounded-lg">
                        {tailorResult.tailoredSummary}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Tailored Bullet Points */}
                  <Card className="border-border/80">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold">Tailored Experience Bullet Points</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const fullText = tailorResult.tailoredExperience.map((e: any) => `${e.role} at ${e.company}\n` + e.tailoredHighlights.map((h: string) => `• ${h}`).join("\n")).join("\n\n");
                          downloadAsTextFile(`${tailorResult.company}_Tailored_Experience.txt`, fullText);
                        }}
                        className="text-xs h-7 gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download TXT
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      {tailorResult.tailoredExperience?.map((exp: any, i: number) => (
                        <div key={i} className="border-l-2 border-indigo-500 pl-3 py-1 space-y-2">
                          <h4 className="text-xs font-bold text-foreground">{exp.role} <span className="font-medium text-muted-foreground">({exp.company})</span></h4>
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {exp.tailoredHighlights?.map((h: string, j: number) => (
                              <li key={j} className="flex items-start gap-1.5">
                                <span className="text-indigo-500 font-bold">•</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-[400px] flex items-center justify-center border-dashed">
                  <CardContent className="text-center space-y-3 p-6">
                    <Wand2 className="w-12 h-12 mx-auto text-indigo-400/40" />
                    <h3 className="font-semibold text-base">Ready to Tailor Your Resume?</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Enter a job title and description on the left to generate an ATS-optimized summary, bullet points, and keyword match rating.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: AI Cover Letter & Cold Outreach Generator */}
        <TabsContent value="cover-letter" className="mt-6 space-y-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Input Form Panel */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/80">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Send className="w-4.5 h-4.5 text-emerald-500" /> Outreach Document Generator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create personalized cover letters, recruiter cold emails, or LinkedIn connection notes tailored to your experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Select Document Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Document Mode</Label>
                    <Select value={clMode} onValueChange={(val: any) => setClMode(val)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover-letter" className="text-xs">📄 Full Cover Letter (Structured & Formal)</SelectItem>
                        <SelectItem value="cold-email" className="text-xs">✉️ Recruiter Cold Email (Short & High-Converting)</SelectItem>
                        <SelectItem value="linkedin-message" className="text-xs">💬 LinkedIn Connection Note (Punchy & Direct)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Tone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Writing Tone</Label>
                    <Select value={clTone} onValueChange={(val: any) => setClTone(val)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional" className="text-xs">👔 Professional & Polished</SelectItem>
                        <SelectItem value="enthusiastic" className="text-xs">🔥 Enthusiastic & Dynamic</SelectItem>
                        <SelectItem value="executive" className="text-xs">📈 Executive & Metric-Driven</SelectItem>
                        <SelectItem value="direct" className="text-xs">🎯 Direct & Concise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select from Saved Jobs */}
                  {savedJobs.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Pre-fill from Saved Jobs</Label>
                      <Select 
                        onValueChange={(jobId) => {
                          const job = savedJobs.find(j => j.jobId === jobId || j.id === jobId);
                          if (job) {
                            setClJobTitle(job.title || "");
                            setClCompany(job.company || "");
                            setClJobDescription(job.description || "");
                          }
                        }}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Choose a saved job..." />
                        </SelectTrigger>
                        <SelectContent>
                          {savedJobs.map((job, idx) => (
                            <SelectItem key={idx} value={job.jobId || job.id || `${idx}`} className="text-xs">
                              {job.title} at {job.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Job Title *</Label>
                    <Input 
                      placeholder="e.g. Product Manager" 
                      value={clJobTitle}
                      onChange={(e) => setClJobTitle(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Company Name</Label>
                    <Input 
                      placeholder="e.g. Stripe" 
                      value={clCompany}
                      onChange={(e) => setClCompany(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Recruiter / Contact Name (Optional)</Label>
                    <Input 
                      placeholder="e.g. Sarah Jenkins or Hiring Team" 
                      value={clRecruiterName}
                      onChange={(e) => setClRecruiterName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Job Description *</Label>
                    <Textarea 
                      placeholder="Paste job description requirements..." 
                      rows={5}
                      value={clJobDescription}
                      onChange={(e) => setClJobDescription(e.target.value)}
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  <Button 
                    onClick={generateCoverLetter} 
                    disabled={isGeneratingCl}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {isGeneratingCl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Document...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Generate {clMode === 'cover-letter' ? 'Cover Letter' : 'Outreach Message'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output Document Panel */}
            <div className="lg:col-span-7">
              {clResult ? (
                <div className="space-y-6">
                  <Card className="border-border/80">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/60">
                      <div>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase">
                          {clResult.mode} • {clResult.tone}
                        </Badge>
                        <CardTitle className="text-lg font-bold mt-1">{clResult.jobTitle} at {clResult.company}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(clResult.subjectLine ? `Subject: ${clResult.subjectLine}\n\n${clResult.content}` : clResult.content, "Full Document Copied")}
                          className="text-xs h-8 gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => downloadAsTextFile(`${clResult.company}_${clResult.mode}.txt`, clResult.subjectLine ? `Subject: ${clResult.subjectLine}\n\n${clResult.content}` : clResult.content)}
                          className="text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {clResult.subjectLine && (
                        <div className="p-3 bg-muted/60 rounded-lg flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">Subject: <span className="font-normal text-muted-foreground">{clResult.subjectLine}</span></span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(clResult.subjectLine, "Subject Line Copied")} className="h-6 px-2 text-[10px]">
                            Copy Subject
                          </Button>
                        </div>
                      )}

                      <div className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3 text-xs leading-relaxed font-sans whitespace-pre-line text-foreground/90">
                        {clResult.content}
                      </div>

                      {clResult.keyMatchHighlights?.length > 0 && (
                        <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase tracking-wider">
                            Why You Stand Out For This Role
                          </span>
                          <ul className="space-y-1 text-muted-foreground">
                            {clResult.keyMatchHighlights.map((h: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-[400px] flex items-center justify-center border-dashed">
                  <CardContent className="text-center space-y-3 p-6">
                    <Send className="w-12 h-12 mx-auto text-emerald-400/40" />
                    <h3 className="font-semibold text-base">Generate Personal Outreach</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Fill out the target position details on the left to instantly draft customized cover letters, cold outreach emails, or LinkedIn messages.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
