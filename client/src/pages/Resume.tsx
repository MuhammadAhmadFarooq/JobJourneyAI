import { useState, useRef } from "react";
import { mockUser } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Check, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function Resume() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(true);
  const [fileName, setFileName] = useState("Alex_Chen_Resume_2024.pdf");
  const [uploadDate, setUploadDate] = useState("Parsed 2 days ago");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploadDate("Just now");
      setIsAnalyzed(false);
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload and analysis delay
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsAnalyzed(true);
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resume Intelligence</h1>
        <p className="text-muted-foreground">
          Manage your profile and see how our AI interprets your experience.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Upload Section */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Upload new resume</h3>
                <p className="text-sm text-muted-foreground px-4">
                  Drag and drop your PDF here, or click to select.
                </p>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              {isUploading ? (
                 <div className="w-full max-w-[200px] space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Analyzing structure...</p>
                 </div>
              ) : (
                <Button onClick={handleUploadClick} variant="outline">Select File</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
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
               <Check className="w-4 h-4 text-green-500" />
            </CardContent>
          </Card>
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
                {/* Profile Summary */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base text-primary">AI Profile Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">
                      Strong candidate for <span className="font-semibold">Frontend and Full Stack Engineering</span> roles. 
                      Demonstrated proficiency in the React ecosystem with solid academic foundations in Computer Science. 
                      Experience indicates a self-starter capable of delivering production-ready UI components.
                    </p>
                  </CardContent>
                </Card>

                {/* Extracted Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Expertise</CardTitle>
                    <CardDescription>Skills extracted and graded by relevance.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {['Frontend', 'Backend', 'Language', 'Database', 'Cloud'].map((category) => (
                        <div key={category} className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">
                            {category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {mockUser.skills
                              .filter(s => s.category === category)
                              .map((skill) => (
                                <Badge 
                                  key={skill.name} 
                                  variant="secondary" 
                                  className="px-3 py-1.5 text-sm font-normal bg-secondary hover:bg-secondary/80"
                                >
                                  {skill.name} 
                                  <span className={`ml-2 w-2 h-2 rounded-full inline-block ${
                                    skill.level > 80 ? "bg-green-500" : skill.level > 60 ? "bg-yellow-500" : "bg-gray-300"
                                  }`} />
                                </Badge>
                              ))}
                              {mockUser.skills.filter(s => s.category === category).length === 0 && (
                                <span className="text-sm text-muted-foreground italic">No skills detected in this category</span>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Experience Parsing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Experience & Projects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {mockUser.experience.map((exp, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                        <div className="space-y-1">
                           <h4 className="font-medium text-base">{exp.role} <span className="text-muted-foreground font-normal">at {exp.company}</span></h4>
                           <p className="text-sm text-muted-foreground">{exp.duration}</p>
                           <p className="text-sm mt-2">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-50" />
                  <p>Waiting for resume...</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
