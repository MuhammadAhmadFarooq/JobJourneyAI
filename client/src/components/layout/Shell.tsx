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
          <img src={logoImage} alt="JobJourneyAI" className="w-9 h-9 rounded-xl shadow-xs" />
          <div>
            <span className="font-bold text-base tracking-tight text-foreground block">JobJourneyAI</span>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Groq AI Online
            </span>
          </div>
        </div>
        {showThemeToggle && <ThemeToggle />}
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Platform Menu
        </div>
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                  isActive
                    ? "bg-secondary text-foreground font-semibold border-l-2 border-primary pl-3"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    isActive 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "bg-muted text-muted-foreground"
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
      <div className="p-4 border-t border-sidebar-border/60 space-y-3 bg-sidebar-accent/10">
        {/* Anti-Expired Guard Status */}
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-primary" /> Anti-Expired Shield
          </span>
          <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
        </div>

        {/* User Account Info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border/60 shadow-2xs">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate text-foreground flex items-center gap-1">
                {user.username}
                <UserCheck className="w-3.5 h-3.5 text-primary inline" />
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
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
      <div className="md:hidden sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-r border-sidebar-border">
              <NavContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2.5">
            <img src={logoImage} alt="JobJourneyAI" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-base tracking-tight text-foreground">JobJourneyAI</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {user && (
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Main Content Area - Generous desktop viewport */}
      <main className="flex-1 w-full md:pl-0 pb-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
