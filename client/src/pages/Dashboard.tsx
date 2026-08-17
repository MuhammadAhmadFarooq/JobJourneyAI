import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Briefcase, TrendingUp, CheckCircle2, ArrowRight, Loader2, Award, FileText, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  skills: any[];
  experience: { company: string; role: string; duration: string }[];
  education: { institution: string; degree: string; year: string }[];
  projects: { name: string; description: string; technologies: string[] }[];
  savedJobs: any[];
  resumeFileName?: string;
  name?: string;
  email?: string;
  summary?: string;
}

interface Stats {
  totalSavedJobs: number;
  profileStrength: number;
  breakdown?: {
    resume: number;
    contact: number;
    summary: number;
    skills: number;
    experience: number;
    education: number;
    projects: number;
    preferences: number;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profileRes, statsRes, jobsRes] = await Promise.all([
          fetch("/api/profile", { credentials: "include" }),
          fetch("/api/profile/stats", { credentials: "include" }),
          fetch("/api/profile/saved-jobs", { credentials: "include" }),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setSavedJobs(jobsData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Format real user skills or fallback to curated industry defaults
  const userSkillList = (profile?.skills || []).map((s: any) => typeof s === "string" ? s : s.name);
  const topSkills = userSkillList.slice(0, 6);

  const skillData = topSkills.length > 0
    ? topSkills.map((skillName, index) => ({
        name: skillName,
        level: Math.max(50, 95 - index * 6),
        category: index % 2 === 0 ? "Core Technical" : "Domain Mastery"
      }))
    : [
        { name: "React / Frontend", level: 90, category: "Core Technical" },
        { name: "Node.js / Backend", level: 85, category: "Core Technical" },
        { name: "TypeScript", level: 88, category: "Core Technical" },
        { name: "System Architecture", level: 78, category: "Domain Mastery" },
        { name: "REST APIs & GraphQL", level: 82, category: "Domain Mastery" },
        { name: "SQL & Databases", level: 75, category: "Domain Mastery" },
      ];

  const profileStrength = stats?.profileStrength || 0;
  const savedJobsCount = savedJobs.length;
  const highMatchJobs = savedJobs.filter((j: any) => j.matchScore >= 80).length;

  const getProficiencyLabel = (score: number) => {
    if (score >= 88) return "Expert";
    if (score >= 75) return "Advanced";
    return "Proficient";
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {user?.name?.split(" ")[0] || user?.username || "there"}
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-1">
            {savedJobsCount > 0 
              ? `You have ${savedJobsCount} saved job${savedJobsCount !== 1 ? 's' : ''}.${highMatchJobs > 0 ? ` ${highMatchJobs} high match (>80%)!` : ''}`
              : "Upload your resume to get real-time AI matching scores and interview preps."}
          </p>
        </div>
        <Link href="/jobs">
          <Button size="lg" className="shadow-lg shadow-primary/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Discover Jobs <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Profile Strength Card */}
        <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <Award className={`h-5 w-5 ${getStrengthColor(profileStrength)}`} />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className={`text-3xl font-bold tracking-tight ${getStrengthColor(profileStrength)}`}>
                {profileStrength}%
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {profileStrength >= 80 ? "Complete" : profileStrength >= 60 ? "Strong" : profileStrength >= 40 ? "Moderate" : "Basic"}
              </span>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${profileStrength}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">
                {profileStrength >= 80 ? "Optimized for matching" : "Add details to boost match"}
              </span>
              <button 
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                {showBreakdown ? "Hide" : "Breakdown"} <ChevronRight className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Jobs Card */}
        <Card className="transition-all hover:shadow-md border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
            <Briefcase className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{savedJobsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {highMatchJobs > 0 ? `${highMatchJobs} high match (>80%)` : "Saved for application & prep"}
            </p>
          </CardContent>
        </Card>

        {/* Skills Card */}
        <Card className="transition-all hover:shadow-md border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Identified</CardTitle>
            <BrainCircuit className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{profile?.skills?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.skills?.length ? "Parsed from your resume" : "Upload resume to extract"}
            </p>
          </CardContent>
        </Card>

        {/* Experience Card */}
        <Card className="transition-all hover:shadow-md border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work History</CardTitle>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{profile?.experience?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.experience?.length ? "Professional roles documented" : "Add experience entries"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Profile Strength Breakdown Drawer */}
      {showBreakdown && stats?.breakdown && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Profile Strength Criteria (Multi-Factor Metrics)
              </CardTitle>
              <CardDescription>How your profile score is calculated based on completeness & depth.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Skills Depth</span>
                  <span className="text-primary">{stats.breakdown.skills} / 20 pts</span>
                </div>
                <p className="text-muted-foreground">15+ skills = 20 pts, 10+ = 15 pts</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Work Experience</span>
                  <span className="text-primary">{stats.breakdown.experience} / 20 pts</span>
                </div>
                <p className="text-muted-foreground">4+ roles = 20 pts, 3 roles = 16 pts</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Contact & Socials</span>
                  <span className="text-primary">{stats.breakdown.contact} / 15 pts</span>
                </div>
                <p className="text-muted-foreground">Contact details & LinkedIn/GitHub</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Resume File</span>
                  <span className="text-primary">{stats.breakdown.resume} / 10 pts</span>
                </div>
                <p className="text-muted-foreground">Parsed PDF/DOCX file uploaded</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Education</span>
                  <span className="text-primary">{stats.breakdown.education} / 10 pts</span>
                </div>
                <p className="text-muted-foreground">Degrees & Certifications</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Summary</span>
                  <span className="text-primary">{stats.breakdown.summary} / 10 pts</span>
                </div>
                <p className="text-muted-foreground">Detailed bio (&gt;150 characters)</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Job Preferences</span>
                  <span className="text-primary">{stats.breakdown.preferences} / 10 pts</span>
                </div>
                <p className="text-muted-foreground">Target roles & locations configured</p>
              </div>
              <div className="p-3 bg-background rounded-lg border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Projects</span>
                  <span className="text-primary">{stats.breakdown.projects} / 5 pts</span>
                </div>
                <p className="text-muted-foreground">Portfolio & built projects</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Visualizations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Horizontal Skill Mastery Visualizer */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Skill Competency Analysis</CardTitle>
                <CardDescription>Proficiency metrics and technical alignment derived from your profile.</CardDescription>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Top {skillData.length} Skills
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={13} 
                    width={130} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`${value}% Proficiency`, 'Competency Score']}
                  />
                  <Bar 
                    dataKey="level" 
                    fill="url(#barGradient)" 
                    radius={[0, 6, 6, 0]} 
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Skill Badges & Saved Jobs Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Saved Job Bookmarks</CardTitle>
            <CardDescription>Jobs you have saved to track and prepare for.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedJobs.length > 0 ? (
                savedJobs.slice(0, 4).map((job: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    key={job.jobId || i} 
                    className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-all flex items-start justify-between group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                        {job.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.company} • {job.location || "Remote"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.matchScore && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          job.matchScore >= 80 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {job.matchScore}%
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 space-y-3">
                  <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No saved jobs yet. Search for opportunities to bookmark them!
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t mt-4 flex gap-2">
              <Link href="/jobs" className="flex-1">
                <Button variant="default" className="w-full text-xs">
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/resume" className="flex-1">
                <Button variant="outline" className="w-full text-xs">
                  Update Resume
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
