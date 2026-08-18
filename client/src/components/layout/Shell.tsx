import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Briefcase, BrainCircuit, LogOut, Menu, UserCheck } from "lucide-react";
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
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground select-none">
      {/* Brand Header with clean spacing */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border/70">
        <div className="flex items-center gap-3.5 min-w-0">
          <img src={logoImage} alt="JobJourneyAI" className="w-10 h-10 rounded-xl shadow-xs shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-base lg:text-lg tracking-tight text-foreground block truncate">
              JobJourneyAI
            </span>
          </div>
        </div>
        {showThemeToggle && (
          <div className="shrink-0 ml-2">
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Platform Menu
        </div>
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? "bg-secondary text-foreground font-semibold border-l-2 border-primary shadow-2xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <item.icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium shrink-0 ml-2 ${
                    isActive 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80"
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
      <div className="p-5 border-t border-sidebar-border/70 space-y-3.5 bg-sidebar-accent/15">
        {/* User Account Info */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/70 shadow-2xs">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                {user.username}
                <UserCheck className="w-3.5 h-3.5 text-primary inline shrink-0" />
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-sidebar-border/80 bg-sidebar h-screen sticky top-0 z-30">
        <NavContent showThemeToggle />
      </aside>

      {/* Mobile Top Navigation Header Bar */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[290px] border-r border-sidebar-border">
              <NavContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2.5">
            <img src={logoImage} alt="JobJourneyAI" className="w-7 h-7 rounded-lg shrink-0" />
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-background overflow-x-hidden min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
