import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Briefcase, BrainCircuit, LogOut, Menu, Sparkles, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@assets/generated_images/minimalist_abstract_logo_for_career_navigation_app.png";

import ThemeToggle from "@/components/ThemeToggle";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, badge: "Overview" },
    { name: "Resume Analysis", href: "/resume", icon: FileText, badge: "AI Parse" },
    { name: "Job Discovery", href: "/jobs", icon: Briefcase, badge: "Live Feed" },
    { name: "Interview Prep", href: "/interview", icon: BrainCircuit, badge: "AI Coach" },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const NavContent = ({ showThemeToggle = false }: { showThemeToggle?: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border/80 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="JobJourneyAI" className="w-9 h-9 rounded-xl shadow-md ring-2 ring-primary/20" />
          <div>
            <span className="font-bold text-base tracking-tight text-foreground block">JobJourneyAI</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Groq AI Online
            </span>
          </div>
        </div>
        {showThemeToggle && <ThemeToggle />}
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Main Navigation
        </div>
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent text-primary font-semibold border-l-4 border-primary shadow-sm pl-2.5"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isActive 
                      ? "bg-primary text-primary-foreground font-bold" 
                      : "bg-muted text-muted-foreground group-hover:bg-sidebar-accent"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & User Card */}
      <div className="p-3 border-t border-sidebar-border/60 space-y-3 bg-sidebar-accent/20">
        {/* Anti-Expired Guard Status */}
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Anti-Expired Shield
          </span>
          <span className="font-bold text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>
        </div>

        {/* User Account Info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border/60 shadow-sm">
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground flex items-center gap-1">
                {user.username}
                <UserCheck className="w-3 h-3 text-blue-500 inline" />
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="fixed inset-y-0 left-0 w-64 z-30">
          <NavContent showThemeToggle />
        </div>
      </div>

      {/* Mobile Top Navigation Header Bar */}
      <div className="md:hidden sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] sm:w-64 border-r border-sidebar-border">
              <NavContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <img src={logoImage} alt="JobJourneyAI" className="w-7 h-7 rounded-lg shadow-xs" />
            <span className="font-bold text-base tracking-tight text-foreground">JobJourneyAI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <Avatar className="w-8 h-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full md:pl-0 pb-10 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
