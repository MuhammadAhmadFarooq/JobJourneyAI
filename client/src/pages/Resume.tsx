import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Check, Loader2, Sparkles, AlertCircle, Briefcase, GraduationCap, FolderGit2, Award, Target, TrendingUp, RefreshCw, CheckCircle2, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ParsedResumeData>(defaultData);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isParsingRef = useRef(false);
  const lastParsedFileRef = useRef<string | null>(null);

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include",
        });

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
              certifications: [],
              profileSummary: profile.profileSummary || "",
              suggestedRoles: profile.suggestedRoles || [],
              strengthAreas: profile.strengthAreas || [],
              improvementAreas: [],
            });
            setIsAnalyzed(true);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadProfile();
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
      headers: {
        "Content-Type": "application/json",
      },
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
    if (file) {
      processFile(file);
    }
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
    if (file) {
      processFile(file);
    }
  };

  const skillCategories = ["Frontend", "Backend", "Language", "Database", "Cloud", "DevOps", "Other"];

  const getSkillBadgeColor = (level: number) => {
    if (level >= 85) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (level >= 70) return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Resume Intelligence
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Resume Analysis & Skill Matrix
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload your resume to extract key competencies, experience timelines, and AI job match scores.
          </p>
        </div>

        {isAnalyzed && (
          <Button
            onClick={handleUploadClick}
            variant="outline"
            className="self-start sm:self-center gap-2 border-primary/30 hover:bg-primary/5"
          >
            <RefreshCw className="w-4 h-4 text-primary" /> Update Resume
          </Button>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Upload Zone & Document Meta */}
        <div className="md:col-span-1 space-y-6">
          {/* Interactive Upload Box */}
          <Card
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-dashed border-2 transition-all duration-300 ${isDragOver
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-muted-foreground/30 hover:border-primary/60 bg-muted/5 hover:shadow-md"
              }`}
          >
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[260px] text-center gap-4">
              <div className={`p-4 rounded-full transition-transform ${isUploading ? 'bg-primary/10 text-primary animate-pulse' : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`}>
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base">
                  {isDragOver ? "Drop your file here" : "Upload your Resume"}
                </h3>
                <p className="text-xs text-muted-foreground px-4">
                  Drag and drop your PDF or TXT resume, or click to browse.
                </p>
              </div>

              <div className="flex gap-2">
                <Badge variant="outline" className="text-[10px]">PDF</Badge>
                <Badge variant="outline" className="text-[10px]">TXT</Badge>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />

              {isUploading ? (
                <div className="w-full max-w-[220px] space-y-3 pt-2">
                  <Progress value={uploadProgress} className="h-2 bg-secondary" />
                  <p className="text-xs font-medium text-primary flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadStatus}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleUploadClick}
                  variant="default"
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/10"
                >
                  Choose File
                </Button>
              )}

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 mt-2 px-4 p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Upload Meta */}
          {fileName && (
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Active Resume</CardTitle>
                {isAnalyzed && <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px]">Analyzed</Badge>}
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">{fileName}</p>
                  {uploadDate && <p className="text-xs text-muted-foreground">Uploaded: {uploadDate}</p>}
                </div>
                {isAnalyzed && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              </CardContent>
            </Card>
          )}

          {/* Suggested Roles */}
          {isAnalyzed && resumeData.suggestedRoles.length > 0 && (
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-sm font-semibold">Suggested Roles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {resumeData.suggestedRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs py-1 px-2.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900">
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Improvements */}
          {isAnalyzed && (resumeData.strengthAreas.length > 0 || resumeData.improvementAreas.length > 0) && (
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-sm font-semibold">AI Profile Assessment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeData.strengthAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Key Strengths
                    </p>
                    <ul className="text-xs space-y-1.5 text-muted-foreground">
                      {resumeData.strengthAreas.map((s) => (
                        <li key={s} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Parsed Resume Output */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {isAnalyzed ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Profile Contact Header */}
                {resumeData.name && (
                  <Card className="border-primary/20 bg-gradient-to-r from-blue-50/50 via-background to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight text-foreground">{resumeData.name}</h2>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {resumeData.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-primary" /> {resumeData.email}
                              </span>
                            )}
                            {resumeData.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-primary" /> {resumeData.phone}
                              </span>
                            )}
                            {resumeData.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-primary" /> {resumeData.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-center border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 gap-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resume Verified
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Executive Summary */}
                {resumeData.profileSummary && (
                  <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <CardTitle className="text-sm font-semibold text-primary">Executive Summary</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-foreground/90">{resumeData.profileSummary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Technical Skills Breakdown */}
                {resumeData.skills.length > 0 && (
                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Extracted Skill Matrix</CardTitle>
                      <CardDescription>Technical stack competencies extracted and categorized from your resume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-5">
                        {skillCategories.map((category) => {
                          const categorySkills = resumeData.skills.filter(s => s.category === category);
                          if (categorySkills.length === 0) return null;

                          return (
                            <div key={category} className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {category}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {categorySkills.map((skill) => (
                                  <Badge
                                    key={`${category}-${skill.name}`}
                                    variant="outline"
                                    className={`px-3 py-1.5 text-xs font-medium border ${getSkillBadgeColor(skill.level)}`}
                                  >
                                    {skill.name}
                                    <span className="ml-1.5 text-[10px] font-bold opacity-80">{skill.level}%</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Work Experience Timeline */}
                {resumeData.experience.length > 0 && (
                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <CardTitle className="text-lg">Professional Experience</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {resumeData.experience.map((exp, idx) => (
                        <div key={`${exp.role}-${exp.company}-${idx}`} className="flex gap-4 items-start border-l-2 border-blue-500/30 pl-4 py-1 hover:border-blue-500 transition-colors">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className="font-semibold text-base text-foreground">{exp.role}</h4>
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                {exp.duration}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-primary">{exp.company}</p>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                            )}
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="text-xs space-y-1 mt-2 text-foreground/80">
                                {exp.highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary font-bold mt-0.5">•</span>
                                    <span>{h}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {resumeData.education.length > 0 && (
                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <CardTitle className="text-lg">Education</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.education.map((edu, idx) => (
                        <div key={`${edu.degree}-${idx}`} className="border-l-2 border-purple-500/30 pl-4 py-1">
                          <h4 className="font-semibold text-sm">{edu.degree}</h4>
                          <p className="text-xs font-medium text-primary">{edu.institution}</p>
                          {edu.graduationDate && (
                            <p className="text-xs text-muted-foreground mt-0.5">Graduated: {edu.graduationDate}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Projects */}
                {resumeData.projects.length > 0 && (
                  <Card className="border-border/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <CardTitle className="text-lg">Key Projects</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.projects.map((project, idx) => (
                        <div key={`${project.name}-${idx}`} className="border-l-2 border-emerald-500/30 pl-4 py-1">
                          <h4 className="font-semibold text-sm">{project.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{project.description}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
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
              </motion.div>
            ) : (
              <Card className="h-[360px] flex items-center justify-center border-dashed">
                <CardContent className="text-center space-y-4">
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
                          Upload your PDF or TXT resume using the panel on the left to view skill ratings and AI match insights.
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
    </div>
  );
}
