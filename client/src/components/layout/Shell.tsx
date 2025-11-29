import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Briefcase, BrainCircuit, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import logoImage from "@assets/generated_images/minimalist_abstract_logo_for_career_navigation_app.png";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Resume Analysis", href: "/resume", icon: FileText },
    { name: "Job Discovery", href: "/jobs", icon: Briefcase },
    { name: "Interview Prep", href: "/interview", icon: BrainCircuit },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 flex items-center gap-3">
        <img src={logoImage} alt="CareerFlow" className="w-8 h-8 rounded-lg" />
        <span className="font-bold text-lg tracking-tight">CareerFlow</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </div>
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:text-destructive/80 cursor-pointer transition-colors mt-1">
          <LogOut className="w-4 h-4" />
          Log out
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="fixed inset-y-0 left-0 w-64">
          <NavContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 w-full md:pl-0 pb-10 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-14 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
