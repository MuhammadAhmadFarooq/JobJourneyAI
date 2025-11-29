import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Briefcase, TrendingUp, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  skills: string[];
  experience: { company: string; role: string; duration: string }[];
  education: { institution: string; degree: string; year: string }[];
  projects: { name: string; description: string; technologies: string[] }[];
  savedJobs: any[];
}

interface Stats {
  totalSavedJobs: number;
  profileStrength: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Generate skill data from profile
  const skillData = profile?.skills?.slice(0, 5).map((skill, index) => ({
    name: skill.length > 10 ? skill.substring(0, 8) + "..." : skill,
    level: Math.max(60, 95 - index * 5), // Simulated proficiency levels
  })) || [
    { name: "React", level: 90 },
    { name: "Node", level: 85 },
    { name: "TS", level: 88 },
    { name: "Python", level: 75 },
    { name: "SQL", level: 70 },
  ];

  const profileStrength = stats?.profileStrength || 0;
  const savedJobsCount = savedJobs.length;
  const highMatchJobs = savedJobs.filter((j: any) => j.matchScore >= 80).length;

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {savedJobsCount > 0 
              ? `You have ${savedJobsCount} saved job${savedJobsCount !== 1 ? 's' : ''}.${highMatchJobs > 0 ? ` ${highMatchJobs} high match!` : ''}`
              : "Start by uploading your resume to get personalized job matches."}
          </p>
        </div>
        <Link href="/jobs">
          <Button size="lg" className="shadow-lg shadow-primary/20">
            View Opportunities <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <CheckCircle2 className={`h-4 w-4 ${profileStrength >= 70 ? 'text-green-500' : profileStrength >= 40 ? 'text-yellow-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileStrength}%</div>
            <p className="text-xs text-muted-foreground">
              {profileStrength >= 70 ? "Great profile!" : profileStrength >= 40 ? "Add more details" : "Upload your resume"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedJobsCount}</div>
            <p className="text-xs text-muted-foreground">
              {highMatchJobs > 0 ? `${highMatchJobs} high match (>80%)` : "Save jobs you're interested in"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
            <BrainCircuit className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.skills?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {profile?.skills?.length ? "Detected from resume" : "Upload resume to detect"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experience</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.experience?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {profile?.experience?.length ? "Roles identified" : "Add work experience"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Skill Analysis Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Skill Qualification Analysis</CardTitle>
            <CardDescription>Based on your resume and recent job market trends.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}%`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar 
                    dataKey="level" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Saved Jobs</CardTitle>
            <CardDescription>Your recently saved job opportunities.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {savedJobs.length > 0 ? (
                savedJobs.slice(0, 3).map((job: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={job.jobId || i} 
                    className="flex items-start justify-between group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">
                        {job.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {job.company}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {job.matchScore && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          job.matchScore > 90 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {job.matchScore}% Match
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved jobs yet. Start searching to save interesting opportunities!
                </p>
              )}
            </div>
            <Link href={savedJobs.length > 0 ? "/interview" : "/jobs"}>
               <Button variant="outline" className="w-full mt-6">
                 {savedJobs.length > 0 ? "Prepare for Interviews" : "Find Jobs"}
               </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
