import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Briefcase, TrendingUp, CheckCircle2, ArrowRight, Loader2, Award, FileText, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";

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
    const fetchDashboardData = async () => {
      try {
        const [profileRes, statsRes, savedJobsRes] = await Promise.all([
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

        if (savedJobsRes.ok) {
          const savedJobsData = await savedJobsRes.json();
          setSavedJobs(savedJobsData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const skillData = profile?.skills?.slice(0, 7).map((s: any) => ({
    name: s.name || s,
    level: s.level ? Math.round((s.level / 5) * 100) : 80,
  })) || [];

  const profileStrength = stats?.profileStrength || 0;
  const savedJobsCount = savedJobs.length;
  const highMatchJobs = savedJobs.filter((j: any) => j.matchScore >= 80).length;

  const getStrengthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4 pb-8 overflow-x-hidden">
      <SEO 
        title="Career Dashboard" 
        description="Monitor your job application pipeline, resume ATS strength score, skill breakdown, and personalized matched opportunities." 
        canonical="/"
      />

      {/* Header Banner - Minimalist & Clean */}
      <div className="pb-4 border-b border-border/60">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground mb-2">
          <Sparkles className="w-3 h-3 text-primary shrink-0" /> Career Navigation Overview
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground break-words">
              Welcome back, {user?.name?.split(" ")[0] || user?.username || "there"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed break-words">
              {savedJobsCount > 0 
                ? `You have ${savedJobsCount} saved job${savedJobsCount !== 1 ? 's' : ''}.${highMatchJobs > 0 ? ` ${highMatchJobs} high match (>80%)!` : ''}`
                : "Upload your resume to get real-time AI matching scores and interview preps."}
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" className="text-xs h-9 font-semibold shrink-0">
              Discover Jobs <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Profile Strength Card */}
        <Card className="border-border/80 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Profile Strength</CardTitle>
            <Award className={`h-4 w-4 ${getStrengthColor(profileStrength)}`} />
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${getStrengthColor(profileStrength)}`}>
                {profileStrength}%
              </div>
              <Badge variant="secondary" className="text-[10px] font-normal py-0 h-4">
                {profileStrength >= 80 ? "Complete" : profileStrength >= 60 ? "Strong" : profileStrength >= 40 ? "Moderate" : "Basic"}
              </Badge>
            </div>
            
            {/* Minimal Progress Bar */}
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${profileStrength}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-muted-foreground truncate">
                {profileStrength >= 80 ? "Optimized for matching" : "Add details to boost score"}
              </span>
              <button 
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5 shrink-0 ml-1"
              >
                {showBreakdown ? "Hide" : "Details"} <ChevronRight className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Jobs Card */}
        <Card className="border-border/80 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Saved Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{savedJobsCount}</div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {highMatchJobs > 0 ? `${highMatchJobs} high match (>80%)` : "Saved for prep & outreach"}
            </p>
          </CardContent>
        </Card>

        {/* Skills Card */}
        <Card className="border-border/80 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Skills Identified</CardTitle>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{profile?.skills?.length || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {profile?.skills?.length ? "Parsed from master resume" : "Upload resume to extract"}
            </p>
          </CardContent>
        </Card>

        {/* Experience Card */}
        <Card className="border-border/80 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Work History</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{profile?.experience?.length || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {profile?.experience?.length ? "Documented career roles" : "Add experience entries"}
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
          <Card className="border-border/80 bg-card overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/60">
              <CardTitle className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Profile Strength Metric Breakdown
              </CardTitle>
              <CardDescription className="text-xs">How your profile score is calculated based on completeness & depth.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 text-xs">
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Skills Depth</span>
                  <span className="text-primary">{stats.breakdown.skills} / 20 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">15+ skills = 20 pts, 10+ = 15 pts</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Work Experience</span>
                  <span className="text-primary">{stats.breakdown.experience} / 20 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">4+ roles = 20 pts, 3 roles = 16 pts</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Contact & Socials</span>
                  <span className="text-primary">{stats.breakdown.contact} / 15 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Contact details & profiles</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Resume File</span>
                  <span className="text-primary">{stats.breakdown.resume} / 10 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Parsed PDF/DOCX file</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Education</span>
                  <span className="text-primary">{stats.breakdown.education} / 10 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Degrees & Certifications</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Summary</span>
                  <span className="text-primary">{stats.breakdown.summary} / 10 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Detailed bio (&gt;150 chars)</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Job Preferences</span>
                  <span className="text-primary">{stats.breakdown.preferences} / 10 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Target roles & locations</p>
              </div>
              <div className="p-2.5 bg-muted/30 rounded-md border border-border/40 space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>Projects</span>
                  <span className="text-primary">{stats.breakdown.projects} / 5 pts</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Portfolio & built projects</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Visualizations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Horizontal Skill Mastery Visualizer */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 border-border/80 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs sm:text-sm font-semibold">Skill Competency Analysis</CardTitle>
                <CardDescription className="text-xs">Proficiency metrics derived from your candidate profile.</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] font-normal">
                Top {skillData.length} Skills
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    stroke="currentColor"
                    className="text-muted-foreground text-[11px]"
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="currentColor"
                    className="text-foreground text-xs"
                    width={110} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value}% Proficiency`, 'Competency Score']}
                  />
                  <Bar 
                    dataKey="level" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]} 
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Skill Badges & Saved Jobs Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-border/80 bg-card overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <CardTitle className="text-xs sm:text-sm font-semibold">Saved Job Bookmarks</CardTitle>
            <CardDescription className="text-xs">Tracked opportunities ready for tailoring & interview prep.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              {savedJobs.length > 0 ? (
                savedJobs.slice(0, 4).map((job: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={job.jobId || i} 
                    className="p-2.5 rounded-md border border-border/60 bg-card hover:border-primary/40 transition-colors flex items-start justify-between group cursor-pointer"
                    onClick={() => window.location.href = "/interview"}
                  >
                    <div className="min-w-0 space-y-0.5 flex-1 mr-2">
                      <p className="text-xs font-semibold group-hover:text-primary transition-colors truncate">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {job.company} • {job.location || "Remote"}
                      </p>
                    </div>
                    {job.matchScore && (
                      <Badge variant="secondary" className="text-[10px] font-semibold shrink-0">
                        {job.matchScore}%
                      </Badge>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 space-y-2">
                  <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    No saved jobs yet. Search for opportunities to bookmark them!
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border/60 flex gap-2">
              <Link href="/jobs" className="flex-1">
                <Button variant="default" size="sm" className="w-full text-xs h-8">
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/resume" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                  Resume Studio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
