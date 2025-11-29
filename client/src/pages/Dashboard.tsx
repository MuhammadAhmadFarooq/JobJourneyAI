import { mockUser, mockJobs } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Briefcase, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";

const skillData = [
  { name: "React", level: 90 },
  { name: "Node", level: 85 },
  { name: "TS", level: 88 },
  { name: "Python", level: 75 },
  { name: "SQL", level: 70 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {mockUser.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your job search is active. 3 new matches found today.
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
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              +2% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Matches</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              High relevance ({'>'}80%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Prep</CardTitle>
            <BrainCircuit className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Demand</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">High</div>
            <p className="text-xs text-muted-foreground">
              For Frontend roles
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
            <CardTitle>Top Matches</CardTitle>
            <CardDescription>Jobs highly aligned with your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockJobs.slice(0, 3).map((job, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={job.id} 
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
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      job.matchScore > 90 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {job.matchScore}% Match
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <Link href="/jobs">
               <Button variant="outline" className="w-full mt-6">View All Matches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
