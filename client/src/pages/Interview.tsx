import { useState } from "react";
import { mockInterviewPrep } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Search, BookOpen, BrainCircuit, Lightbulb, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Interview() {
  const [step, setStep] = useState<'input' | 'researching' | 'results'>('input');
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");

  const handleStart = () => {
    if (!role || !company) return;
    setStep('researching');
    
    // Mock research delay
    setTimeout(() => {
      setStep('results');
    }, 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-1 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Deep Research Prep</h1>
        <p className="text-muted-foreground">
          Our agents analyze the role, company tech stack, and recent interview trends to generate a personalized study guide.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="input"
          >
            <Card className="w-full shadow-lg border-primary/10">
              <CardContent className="pt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role Title</Label>
                    <Input 
                      id="role" 
                      placeholder="e.g. Frontend Engineer" 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Target Company</Label>
                    <Input 
                      id="company" 
                      placeholder="e.g. Airbnb" 
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button size="lg" onClick={handleStart} className="w-full md:w-auto px-8" disabled={!role || !company}>
                    <BrainCircuit className="mr-2 w-4 h-4" />
                    Start Research Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'researching' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="researching"
            className="flex flex-col items-center justify-center py-12 space-y-6"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
               <div className="absolute inset-0 border-4 border-muted rounded-full" />
               <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
               <Search className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">Analyzing {company}...</h3>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground h-[60px] overflow-hidden">
                 <motion.span 
                   animate={{ opacity: [0, 1, 0], y: [10, 0, -10] }}
                   transition={{ duration: 2, repeat: Infinity, times: [0, 0.2, 0.8] }}
                 >Scraping recent interview experiences...</motion.span>
                 <motion.span 
                   animate={{ opacity: [0, 1, 0], y: [10, 0, -10] }}
                   transition={{ duration: 2, delay: 0.8, repeat: Infinity, times: [0, 0.2, 0.8] }}
                 >Identifying core tech stack requirements...</motion.span>
                 <motion.span 
                   animate={{ opacity: [0, 1, 0], y: [10, 0, -10] }}
                   transition={{ duration: 2, delay: 1.6, repeat: Infinity, times: [0, 0.2, 0.8] }}
                 >Generating custom behavioral questions...</motion.span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key="results"
            className="space-y-6"
          >
             <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep('input')} className="pl-0 hover:bg-transparent">
                   ← Research another role
                </Button>
                <div className="text-sm text-muted-foreground">
                   Generated for <span className="font-semibold text-foreground">{role}</span> at <span className="font-semibold text-foreground">{company}</span>
                </div>
             </div>

             <div className="grid md:grid-cols-3 gap-6">
                {/* Topics Sidebar */}
                <Card className="md:col-span-1 h-fit sticky top-4">
                   <CardHeader>
                      <CardTitle className="text-lg">Key Topics</CardTitle>
                      <CardDescription>Focus areas based on company tech stack.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      {mockInterviewPrep.topics.map((topic, i) => (
                         <div key={i} className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border cursor-pointer">
                            <div className="flex justify-between items-center mb-1">
                               <span className="font-medium text-sm">{topic.title}</span>
                               <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${topic.importance === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700'}`}>
                                  {topic.importance}
                               </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                         </div>
                      ))}
                   </CardContent>
                </Card>

                {/* Questions Main Content */}
                <div className="md:col-span-2 space-y-6">
                   {mockInterviewPrep.topics.map((topic, i) => (
                      <Card key={i}>
                         <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                               <BookOpen className="w-5 h-5 text-primary" />
                               <CardTitle>{topic.title}</CardTitle>
                            </div>
                         </CardHeader>
                         <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                               {topic.questions.map((q, idx) => (
                                  <AccordionItem key={idx} value={`item-${i}-${idx}`}>
                                     <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                                        <span className="text-sm font-medium">{q}</span>
                                     </AccordionTrigger>
                                     <AccordionContent className="text-muted-foreground bg-muted/30 p-4 rounded-md mt-2">
                                        <div className="flex gap-2 items-start">
                                           <Lightbulb className="w-4 h-4 text-yellow-500 mt-1 shrink-0" />
                                           <div className="space-y-2 text-sm">
                                              <p><span className="font-semibold text-foreground">Key Concept:</span> This question tests your understanding of {topic.title.toLowerCase()} principles.</p>
                                              <p>Structure your answer using the STAR method if applicable, or start with a high-level definition before diving into code examples.</p>
                                           </div>
                                        </div>
                                     </AccordionContent>
                                  </AccordionItem>
                               ))}
                            </Accordion>
                         </CardContent>
                      </Card>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
