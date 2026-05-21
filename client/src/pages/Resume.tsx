import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Check, Loader2, Sparkles, AlertCircle, Briefcase, GraduationCap, FolderGit2, Award, Target, TrendingUp } from "lucide-react";
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
          
          // Check if profile has resume data
          if (profile.resumeFileName) {
            setFileName(profile.resumeFileName);
            setUploadDate(profile.resumeUploadedAt ? new Date(profile.resumeUploadedAt).toLocaleString() : null);
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
      throw new Error("Failed to parse PDF file");
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
    if (isUploading || isParsingRef.current) {
      event.target.value = "";
      return;
    }

    if (lastParsedFileRef.current === fileKey && isAnalyzed) {
      event.target.value = "";
      return;
    }

    isParsingRef.current = true;

    setFileName(file.name);
    setUploadDate(new Date().toLocaleString());
    setIsAnalyzed(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Reading file...");
    setError(null);
    
    try {
      // Step 1: Extract text from PDF
      setUploadProgress(20);
      setUploadStatus("Extracting text from PDF...");
      
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }
      
      if (!text || text.trim().length < 50) {
        throw new Error("Could not extract enough text from the file. Please ensure your PDF contains selectable text.");
      }

      // Step 2: Send to AI for parsing
      setUploadProgress(50);
      setUploadStatus("🤖 AI is analyzing your resume...");
      
      const parsedData = await parseResumeWithAI(text, file.name);
      
      setUploadProgress(80);
      setUploadStatus("Saving profile...");
      setResumeData(parsedData);
      
      // Save profile to MongoDB
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
      }, 500);

    } catch (err: any) {
      console.error("Resume parsing error:", err);
      setError(err.message || "Could not parse file. Please try again.");
      setIsUploading(false);
    } finally {
      isParsingRef.current = false;
      event.target.value = "";
    }
  };

  const skillCategories = ["Frontend", "Backend", "Language", "Database", "Cloud", "DevOps", "Other"];

  const getSkillDotClass = (level: number) => {
    if (level > 80) return "bg-green-500";
    if (level > 60) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resume Intelligence</h1>
        <p className="text-muted-foreground">
          Upload your resume and let our AI extract and analyze your professional profile.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Upload Section */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[280px] text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Upload your resume</h3>
                <p className="text-sm text-muted-foreground px-4">
                  PDF or text file supported. AI will extract all details.
                </p>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />

              {isUploading ? (
                 <div className="w-full max-w-[220px] space-y-3">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{uploadStatus}</p>
                 </div>
              ) : (
                <Button onClick={handleUploadClick} variant="outline" disabled={isUploading}>Select File</Button>
              )}
              
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-500 mt-2 px-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {fileName && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Current File</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{uploadDate}</p>
                </div>
                {isAnalyzed && <Check className="w-4 h-4 text-green-500" />}
              </CardContent>
            </Card>
          )}

          {/* Suggested Roles */}
          {isAnalyzed && resumeData.suggestedRoles.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Suggested Roles</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resumeData.suggestedRoles.map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Improvements */}
          {isAnalyzed && (resumeData.strengthAreas.length > 0 || resumeData.improvementAreas.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeData.strengthAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2">💪 Strengths</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {resumeData.strengthAreas.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {resumeData.improvementAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-orange-600 mb-2">📈 Areas to Improve</p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {resumeData.improvementAreas.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Result */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {isAnalyzed ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Profile Header */}
                {resumeData.name && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">{resumeData.name}</h2>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            {resumeData.email && <span>📧 {resumeData.email}</span>}
                            {resumeData.phone && <span>📱 {resumeData.phone}</span>}
                            {resumeData.location && <span>📍 {resumeData.location}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Profile Summary */}
                {resumeData.profileSummary && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base text-primary">AI Profile Summary</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{resumeData.profileSummary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Skills */}
                {resumeData.skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detected Expertise</CardTitle>
                      <CardDescription>Skills extracted and graded by AI based on your resume content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {skillCategories.map((category) => {
                          const categorySkills = resumeData.skills.filter(s => s.category === category);
                          if (categorySkills.length === 0) return null;
                          
                          return (
                            <div key={category} className="space-y-3">
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {category}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {categorySkills.map((skill) => (
                                  <Badge 
                                    key={`${category}-${skill.name}`} 
                                    variant="secondary" 
                                    className="px-3 py-1.5 text-sm font-normal bg-secondary hover:bg-secondary/80"
                                  >
                                    {skill.name} 
                                    <span className={`ml-2 w-2 h-2 rounded-full inline-block ${getSkillDotClass(skill.level)}`} />
                                    <span className="ml-1 text-xs text-muted-foreground">{skill.level}%</span>
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

                {/* Experience */}
                {resumeData.experience.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        <CardTitle>Work Experience</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {resumeData.experience.map((exp) => (
                        <div key={`${exp.role}-${exp.company}-${exp.duration}`} className="flex gap-4 items-start group border-l-2 border-primary/20 pl-4 hover:border-primary transition-colors">
                          <div className="space-y-2 flex-1">
                            <div>
                              <h4 className="font-semibold text-base">{exp.role}</h4>
                              <p className="text-sm text-primary">{exp.company}</p>
                              <p className="text-xs text-muted-foreground">{exp.duration}</p>
                            </div>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground">{exp.description}</p>
                            )}
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="text-sm space-y-1 mt-2">
                                {exp.highlights.map((h) => (
                                  <li key={h} className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
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
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        <CardTitle>Education</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.education.map((edu) => (
                        <div key={`${edu.degree}-${edu.institution}`} className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-sm text-primary">{edu.institution}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            {edu.graduationDate && <span>🎓 {edu.graduationDate}</span>}
                            {edu.gpa && <span>GPA: {edu.gpa}</span>}
                          </div>
                          {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">Relevant Coursework:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {edu.relevantCoursework.map((course) => (
                                  <Badge key={course} variant="outline" className="text-xs">
                                    {course}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Projects */}
                {resumeData.projects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-primary" />
                        <CardTitle>Projects</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resumeData.projects.map((project) => (
                        <div key={project.name} className="border-l-2 border-primary/20 pl-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{project.name}</h4>
                            {project.link && (
                              <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                🔗 Link
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-xs">
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
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        <CardTitle>Certifications</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.certifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="px-3 py-1.5">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-4">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                      <div>
                        <p className="font-medium">Analyzing your resume...</p>
                        <p className="text-sm">{uploadStatus}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto opacity-30" />
                      <div>
                        <p className="font-medium">No resume uploaded</p>
                        <p className="text-sm">Upload your resume to get AI-powered analysis</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
