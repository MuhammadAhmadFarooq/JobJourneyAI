import { mockJobs } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, DollarSign, Clock, Star, ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Jobs() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Job Discovery</h1>
          <p className="text-muted-foreground">
            Opportunities curated based on your profile analysis.
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center space-x-2">
          <div className="relative flex-1 md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roles, companies..."
              className="pl-8 bg-background"
            />
          </div>
          <Button>Search</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Filters Sidebar (Mock) */}
        <div className="lg:col-span-3 space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Filters</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">Match Score</label>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <span>90% + Match</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span>80% + Match</span>
                    </div>
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">Location</label>
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                      <span>Remote</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span>San Francisco, CA</span>
                    </div>
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Job Feed */}
        <div className="lg:col-span-9 space-y-6">
          {mockJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-all duration-300 group border-l-4 border-l-transparent hover:border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-secondary-foreground">
                        {job.logo}
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {job.title}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">
                          {job.company}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="flex items-center gap-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-sm font-bold border border-green-100 dark:border-green-900/50 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                          {job.matchScore}% Match
                       </div>
                       <span className="text-xs text-muted-foreground">{job.posted}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                   <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> {job.salary}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Full-time
                      </div>
                   </div>
                   
                   <p className="text-sm line-clamp-2 mb-4 leading-relaxed">
                     {job.description}
                   </p>

                   {/* Why it matches */}
                   <div className="bg-secondary/40 p-3 rounded-md space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why you're a match</p>
                      <div className="flex flex-wrap gap-2">
                        {job.matchReasons.map((reason, i) => (
                           <div key={i} className="flex items-center gap-1.5 text-xs bg-background px-2 py-1 rounded shadow-sm border">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {reason}
                           </div>
                        ))}
                      </div>
                   </div>
                </CardContent>
                <CardFooter className="bg-muted/20 pt-4 flex justify-end gap-3">
                  <Button variant="outline">Save</Button>
                  <Button>Apply Now <ArrowUpRight className="ml-2 w-4 h-4" /></Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
