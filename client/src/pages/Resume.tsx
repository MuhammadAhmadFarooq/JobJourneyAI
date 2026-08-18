import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import SEO from "@/components/SEO";

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

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-1 sm:px-0 pb-8 overflow-x-hidden">
      <SEO 
        title="Resume Studio & AI Tailor" 
        description="Extract resume competencies, optimize bullet points for ATS scanners with target job descriptions, and generate customized cover letters with AI." 
        canonical="/resume"
        keywords="resume parser, resume tailor, ATS score optimizer, AI cover letter generator, cold outreach email writer"
      />
      {/* Header Banner - Clean & Readable */}
      <div className="pb-5 border-b border-border/60">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Career Suite
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground break-words">
          Resume Studio & Application Suite
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-3xl leading-relaxed break-words">
          Parse master resumes, generate ATS-targeted variants, and draft tailored cover letters or cold outreach messages.
        </p>
      </div>

      {/* Main Feature Navigation Tabs - Responsive Scroll/Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto justify-start sm:justify-center max-w-2xl mx-auto h-11 sm:h-12 bg-muted/50 p-1 rounded-lg space-x-1 sm:space-x-0 no-scrollbar">
          <TabsTrigger value="analysis" className="flex-1 min-w-[110px] text-xs sm:text-sm font-medium gap-2 px-3 sm:px-4 whitespace-nowrap">
            <FileText className="w-4 h-4 shrink-0" />
            <span>Master Resume</span>
          </TabsTrigger>
          <TabsTrigger value="tailor" className="flex-1 min-w-[110px] text-xs sm:text-sm font-medium gap-2 px-3 sm:px-4 whitespace-nowrap">
            <Wand2 className="w-4 h-4 shrink-0 text-primary" />
            <span>Resume Tailor</span>
          </TabsTrigger>
          <TabsTrigger value="cover-letter" className="flex-1 min-w-[110px] text-xs sm:text-sm font-medium gap-2 px-3 sm:px-4 whitespace-nowrap">
            <Send className="w-4 h-4 shrink-0 text-primary" />
            <span>Cover Letter</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Master Resume Analysis */}
        <TabsContent value="analysis" className="mt-6 sm:mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Upload Panel Left */}
            <div className="md:col-span-5 space-y-4 min-w-0">
              <Card 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden bg-card ${
                  isDragOver 
                    ? "border-primary bg-primary/5" 
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
                <CardContent className="p-5 sm:p-8 text-center space-y-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto border border-border/50">
                    {isUploading ? (
                      <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    ) : (
                      <Upload className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg text-foreground break-words">
                      {isUploading ? "Processing Resume..." : "Upload Master Resume"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto break-words">
                      Drag & drop your PDF or TXT resume here, or click to browse.
                    </p>
                  </div>

                  {isUploading ? (
                    <div className="space-y-2 pt-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-primary font-medium break-words">{uploadStatus}</p>
                    </div>
                  ) : (
                    <Button variant="outline" size="default" className="text-xs sm:text-sm pointer-events-none h-9 px-4">
                      Browse File
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Uploaded File Info Card */}
              {fileName && (
                <Card className="border-border/60 bg-muted/30">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate text-foreground">{fileName}</p>
                        <p className="text-xs text-muted-foreground">{uploadDate || "Uploaded"}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal shrink-0 px-2.5 py-0.5">
                      Active Profile
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resume Breakdown Right */}
            <div className="md:col-span-7 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                {isAnalyzed ? (
                  <motion.div
                    key="analyzed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* Profile Header Card */}
                    <Card className="border-border/80 bg-card overflow-hidden">
                      <CardContent className="p-5 sm:p-6 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <h2 className="text-lg sm:text-2xl font-bold text-foreground break-words">{resumeData.name || "Candidate Profile"}</h2>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              {resumeData.email && <span className="flex items-center gap-1.5 break-all"><Mail className="w-4 h-4 shrink-0" /> {resumeData.email}</span>}
                              {resumeData.location && <span className="flex items-center gap-1.5 break-words"><MapPin className="w-4 h-4 shrink-0" /> {resumeData.location}</span>}
                            </div>
                          </div>
                          <Badge variant="outline" className="self-start sm:self-center text-xs uppercase font-semibold shrink-0 px-2.5 py-0.5">
                            Master Resume
                          </Badge>
                        </div>
                        {resumeData.profileSummary && (
                          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/60 break-words">
                            {resumeData.profileSummary}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Skill Matrix */}
                    <Card className="border-border/80 overflow-hidden">
                      <CardHeader className="p-3 sm:p-4 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary shrink-0" /> Skill Competency Matrix
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {resumeData.skills.map((skill, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary" 
                              className="text-[11px] font-normal px-2.5 py-0.5 break-words"
                            >
                              {skill.name} {skill.level ? `(${skill.level}%)` : ""}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Experience Timeline */}
                    {resumeData.experience.length > 0 && (
                      <Card className="border-border/80 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary shrink-0" /> Work Experience
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-1 space-y-3">
                          {resumeData.experience.map((exp, idx) => (
                            <div key={idx} className="border-l-2 border-primary/40 pl-3.5 py-1 space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-xs sm:text-sm text-foreground break-words">{exp.role}</h4>
                                  <p className="text-xs text-muted-foreground break-words">{exp.company}</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded self-start sm:self-auto shrink-0">{exp.duration}</span>
                              </div>
                              {exp.description && <p className="text-xs text-muted-foreground leading-relaxed pt-1 break-words">{exp.description}</p>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Education */}
                    {resumeData.education && resumeData.education.length > 0 && (
                      <Card className="border-border/80 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-primary shrink-0" /> Education
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-1 space-y-2.5">
                          {resumeData.education.map((edu, idx) => (
                            <div key={idx} className="border-l-2 border-border pl-3.5 py-0.5">
                              <h4 className="font-semibold text-xs sm:text-sm text-foreground break-words">{edu.degree}</h4>
                              <p className="text-xs text-muted-foreground break-words">{edu.institution} {edu.graduationDate ? `(${edu.graduationDate})` : ""}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Projects */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                      <Card className="border-border/80 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-primary shrink-0" /> Projects
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-1 space-y-3">
                          {resumeData.projects.map((proj, idx) => (
                            <div key={idx} className="border-l-2 border-border pl-3.5 py-0.5 space-y-1">
                              <h4 className="font-semibold text-xs sm:text-sm text-foreground break-words">{proj.name}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed break-words">{proj.description}</p>
                              {proj.technologies?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {proj.technologies.map((tech, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] font-normal px-2 break-words">
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
                      <Card className="border-border/80 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary shrink-0" /> Certifications & Licenses
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {resumeData.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[11px] font-normal px-2.5 py-1 break-words">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* AI Career Insights & Suggested Roles */}
                    {(resumeData.suggestedRoles?.length > 0 || resumeData.strengthAreas?.length > 0) && (
                      <Card className="border-border/80 bg-muted/20 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary shrink-0" /> AI Target Roles & Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-1 space-y-3 text-xs">
                          {resumeData.suggestedRoles?.length > 0 && (
                            <div>
                              <span className="font-semibold text-foreground block mb-1.5">Suggested Target Roles</span>
                              <div className="flex flex-wrap gap-1.5">
                                {resumeData.suggestedRoles.map((role, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[11px] break-words">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {resumeData.strengthAreas?.length > 0 && (
                            <div>
                              <span className="font-semibold text-foreground block mb-1.5">Core Strengths</span>
                              <div className="flex flex-wrap gap-1.5">
                                {resumeData.strengthAreas.map((strength, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[11px] break-words">
                                    {strength}
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
                  <Card className="h-[300px] sm:h-[360px] flex items-center justify-center border-dashed">
                    <CardContent className="text-center space-y-3 p-4 sm:p-6">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                          <div>
                            <p className="font-medium text-sm sm:text-base break-words">Parsing resume structure...</p>
                            <p className="text-xs text-muted-foreground mt-1 break-words">{uploadStatus}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto text-muted-foreground/30" />
                          <div>
                            <p className="font-semibold text-sm sm:text-base">No Resume Analyzed Yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto break-words">
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
        <TabsContent value="tailor" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Input Form Panel */}
            <div className="lg:col-span-5 space-y-4 min-w-0">
              <Card className="border-border/80 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary shrink-0" /> Target Job Parameters
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Provide target job details or choose a saved job to generate ATS-optimized summaries and bullet points.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-3.5 text-xs">
                  {/* Select from Saved Jobs */}
                  {savedJobs.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Pre-fill from Saved Jobs</Label>
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
                        <SelectTrigger className="text-xs h-9 w-full">
                          <SelectValue placeholder="Choose a saved job..." />
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px] sm:max-w-none">
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
                    <Label className="text-xs font-medium text-foreground">Job Title *</Label>
                    <Input 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={tailorJobTitle}
                      onChange={(e) => setTailorJobTitle(e.target.value)}
                      className="text-xs h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Company Name</Label>
                    <Input 
                      placeholder="e.g. Acme Innovations" 
                      value={tailorCompany}
                      onChange={(e) => setTailorCompany(e.target.value)}
                      className="text-xs h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Target Job Description *</Label>
                    <Textarea 
                      placeholder="Paste key responsibilities and required skills from the job posting..." 
                      rows={6}
                      value={tailorJobDescription}
                      onChange={(e) => setTailorJobDescription(e.target.value)}
                      className="text-xs leading-relaxed min-h-[120px] w-full"
                    />
                  </div>

                  <Button 
                    onClick={generateTailoredResume} 
                    disabled={isTailoring}
                    className="w-full text-xs font-semibold h-10 mt-2"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" /> Tailoring Resume with AI...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2 shrink-0" /> Generate Tailored Resume Variant
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-7 min-w-0 overflow-hidden">
              {tailorResult ? (
                <div className="space-y-4">
                  {/* Score & Keyword Banner */}
                  <Card className="border-border/80 bg-card overflow-hidden">
                    <CardContent className="p-3 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Badge variant="outline" className="text-[10px] font-normal uppercase shrink-0">
                            ATS Alignment Score
                          </Badge>
                          <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 break-words">
                            {tailorResult.jobTitle} <span className="font-normal text-muted-foreground">at {tailorResult.company}</span>
                          </h3>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start sm:self-auto shrink-0">
                          <div className="text-center px-2.5 py-1 rounded-md bg-muted text-xs">
                            <span className="text-[10px] text-muted-foreground block">Before</span>
                            <span className="font-bold text-muted-foreground">{tailorResult.matchScoreBefore}%</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div className="text-center px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs">
                            <span className="text-[10px] block font-medium">Tailored</span>
                            <span className="font-bold">{tailorResult.matchScoreAfter}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Keywords Breakdown */}
                      <div className="space-y-1.5 pt-2.5 border-t border-border/60 text-xs">
                        <span className="font-medium text-foreground block">Matched ATS Keywords</span>
                        <div className="flex flex-wrap gap-1">
                          {tailorResult.matchedKeywords?.map((kw: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[11px] font-normal break-words">
                              ✓ {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tailored Professional Summary */}
                  <Card className="border-border/80 overflow-hidden">
                    <CardHeader className="p-3 sm:p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-xs sm:text-sm font-semibold">Tailored Professional Summary</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(tailorResult.tailoredSummary, "Summary Copied")}
                        className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <p className="text-xs text-foreground/90 leading-relaxed p-2.5 sm:p-3 bg-muted/30 rounded-md border border-border/40 whitespace-pre-wrap break-words overflow-hidden">
                        {tailorResult.tailoredSummary}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Tailored Bullet Points */}
                  <Card className="border-border/80 overflow-hidden">
                    <CardHeader className="p-3 sm:p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-xs sm:text-sm font-semibold">Tailored Experience Bullet Points</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const fullText = tailorResult.tailoredExperience.map((e: any) => `${e.role} at ${e.company}\n` + e.tailoredHighlights.map((h: string) => `• ${h}`).join("\n")).join("\n\n");
                          downloadAsTextFile(`${tailorResult.company}_Tailored_Experience.txt`, fullText);
                        }}
                        className="text-xs h-8 sm:h-7 px-2.5 gap-1 w-full sm:w-auto"
                      >
                        <Download className="w-3.5 h-3.5" /> Download TXT
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 space-y-3.5">
                      {tailorResult.tailoredExperience?.map((exp: any, i: number) => (
                        <div key={i} className="border-l-2 border-primary/40 pl-3 py-0.5 space-y-1.5">
                          <h4 className="text-xs font-semibold text-foreground break-words">{exp.role} <span className="font-normal text-muted-foreground">({exp.company})</span></h4>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {exp.tailoredHighlights?.map((h: string, j: number) => (
                              <li key={j} className="flex items-start gap-1.5">
                                <span className="text-primary font-bold shrink-0">•</span>
                                <span className="leading-relaxed break-words">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-[300px] sm:h-[400px] flex items-center justify-center border-dashed">
                  <CardContent className="text-center space-y-3 p-4 sm:p-6">
                    <Wand2 className="w-10 h-10 mx-auto text-muted-foreground/30" />
                    <h3 className="font-semibold text-sm sm:text-base">Ready to Tailor Your Resume?</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto break-words">
                      Enter a job title and description on the left to generate an ATS-optimized summary, bullet points, and keyword match rating.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: AI Cover Letter & Cold Outreach Generator */}
        <TabsContent value="cover-letter" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Input Form Panel */}
            <div className="lg:col-span-5 space-y-4 min-w-0">
              <Card className="border-border/80 overflow-hidden">
                <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary shrink-0" /> Outreach Generator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create personalized cover letters, recruiter cold emails, or LinkedIn connection notes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-2 space-y-3 text-xs">
                  {/* Select Document Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Document Mode</Label>
                    <Select value={clMode} onValueChange={(val: any) => setClMode(val)}>
                      <SelectTrigger className="text-xs h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover-letter" className="text-xs">📄 Full Cover Letter (Formal & Structured)</SelectItem>
                        <SelectItem value="cold-email" className="text-xs">✉️ Recruiter Cold Email (Short & High-Converting)</SelectItem>
                        <SelectItem value="linkedin-message" className="text-xs">💬 LinkedIn Connection Note (Punchy & Direct)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Tone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Writing Tone</Label>
                    <Select value={clTone} onValueChange={(val: any) => setClTone(val)}>
                      <SelectTrigger className="text-xs h-9 w-full">
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
                      <Label className="text-xs font-medium text-foreground">Pre-fill from Saved Jobs</Label>
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
                        <SelectTrigger className="text-xs h-9 w-full">
                          <SelectValue placeholder="Choose a saved job..." />
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px] sm:max-w-none">
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
                    <Label className="text-xs font-medium text-foreground">Job Title *</Label>
                    <Input 
                      placeholder="e.g. Product Manager" 
                      value={clJobTitle}
                      onChange={(e) => setClJobTitle(e.target.value)}
                      className="text-xs h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Company Name</Label>
                    <Input 
                      placeholder="e.g. Stripe" 
                      value={clCompany}
                      onChange={(e) => setClCompany(e.target.value)}
                      className="text-xs h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Recruiter / Contact Name (Optional)</Label>
                    <Input 
                      placeholder="e.g. Sarah Jenkins or Hiring Team" 
                      value={clRecruiterName}
                      onChange={(e) => setClRecruiterName(e.target.value)}
                      className="text-xs h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Job Description *</Label>
                    <Textarea 
                      placeholder="Paste job description requirements..." 
                      rows={5}
                      value={clJobDescription}
                      onChange={(e) => setClJobDescription(e.target.value)}
                      className="text-xs leading-relaxed min-h-[100px] w-full"
                    />
                  </div>

                  <Button 
                    onClick={generateCoverLetter} 
                    disabled={isGeneratingCl}
                    className="w-full text-xs font-semibold h-10 mt-2"
                  >
                    {isGeneratingCl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2 shrink-0" /> Generating Document...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2 shrink-0" /> Generate {clMode === 'cover-letter' ? 'Cover Letter' : 'Outreach Message'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output Document Panel */}
            <div className="lg:col-span-7 min-w-0 overflow-hidden">
              {clResult ? (
                <div className="space-y-4">
                  <Card className="border-border/80 overflow-hidden">
                    <CardHeader className="p-3 sm:p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
                      <div className="min-w-0">
                        <Badge variant="outline" className="text-[10px] font-normal uppercase shrink-0">
                          {clResult.mode} • {clResult.tone}
                        </Badge>
                        <CardTitle className="text-base sm:text-lg font-bold mt-1 text-foreground break-words">
                          {clResult.jobTitle} <span className="font-normal text-muted-foreground">at {clResult.company}</span>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(clResult.subjectLine ? `Subject: ${clResult.subjectLine}\n\n${clResult.content}` : clResult.content, "Full Document Copied")}
                          className="text-xs h-8 px-2.5 gap-1 flex-1 sm:flex-none"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => downloadAsTextFile(`${clResult.company}_${clResult.mode}.txt`, clResult.subjectLine ? `Subject: ${clResult.subjectLine}\n\n${clResult.content}` : clResult.content)}
                          className="text-xs h-8 px-2.5 gap-1 flex-1 sm:flex-none"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 space-y-4">
                      {clResult.subjectLine && (
                        <div className="p-3 bg-muted/40 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border border-border/40">
                          <span className="font-medium text-foreground break-words">Subject: <span className="font-normal text-muted-foreground">{clResult.subjectLine}</span></span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(clResult.subjectLine, "Subject Line Copied")} className="h-6 px-2 text-[10px] self-end sm:self-auto shrink-0">
                            Copy Subject
                          </Button>
                        </div>
                      )}

                      <div className="p-3 sm:p-5 bg-card border border-border/60 rounded-lg space-y-3 text-xs sm:text-sm leading-relaxed font-sans whitespace-pre-wrap break-words overflow-hidden text-foreground/90">
                        {clResult.content}
                      </div>

                      {clResult.keyMatchHighlights?.length > 0 && (
                        <div className="p-3 sm:p-3.5 bg-muted/30 border border-border/50 rounded-lg space-y-2 text-xs">
                          <span className="font-semibold text-foreground block text-[11px] uppercase tracking-wider">
                            Key Match Highlights
                          </span>
                          <ul className="space-y-1 text-muted-foreground">
                            {clResult.keyMatchHighlights.map((h: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-primary font-bold shrink-0">•</span>
                                <span className="leading-relaxed break-words">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-[300px] sm:h-[400px] flex items-center justify-center border-dashed">
                  <CardContent className="text-center space-y-3 p-4 sm:p-6">
                    <Send className="w-10 h-10 mx-auto text-muted-foreground/30" />
                    <h3 className="font-semibold text-sm sm:text-base">Generate Personal Outreach</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto break-words">
                      Fill out target position details on the left to instantly draft customized cover letters, cold emails, or LinkedIn messages.
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
