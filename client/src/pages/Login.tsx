import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Sparkles, ShieldCheck, Briefcase, BrainCircuit, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import logoImage from "@assets/generated_images/minimalist_abstract_logo_for_career_navigation_app.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background">
      {/* Left Feature Hero Banner */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-12 text-white flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={logoImage} alt="JobJourneyAI" className="w-10 h-10 rounded-xl shadow-lg ring-2 ring-white/20" />
          <span className="font-bold text-xl tracking-tight">JobJourneyAI</span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-300 backdrop-blur-md border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Groq AI Accelerated Platform
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Accelerate your career with real-time AI job discovery.
          </h2>

          <p className="text-blue-100/80 leading-relaxed text-sm">
            Aggregate active developer roles across LinkedIn, Indeed, and direct engineering boards with 100% verified live apply availability.
          </p>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Anti-Expired Job Protection</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Multi-Source Platform Aggregation</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2.5">
              <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Resume Skill Intelligence</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>AI Interview Simulator</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-blue-200/60">
          © 2026 JobJourneyAI • Enterprise Career Intelligence Engine
        </div>
      </div>

      {/* Right Login Form */}
      <div className="col-span-12 lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex lg:hidden items-center justify-center gap-2.5 mb-2">
              <img src={logoImage} alt="JobJourneyAI" className="w-9 h-9 rounded-lg" />
              <span className="font-bold text-xl">JobJourneyAI</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to access your matches, resume metrics, and prep kits.</p>
          </div>

          <Card className="border-border/80 shadow-xl bg-card">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2.5 text-xs">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 text-sm bg-background"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 text-sm bg-background"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/10 mt-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-muted-foreground border-t pt-4">
                Don't have an account?{" "}
                <Link href="/register">
                  <span className="text-primary hover:underline font-semibold cursor-pointer">
                    Create your account
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
