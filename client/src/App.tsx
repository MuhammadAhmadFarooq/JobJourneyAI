import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Shell from "@/components/layout/Shell";
import Dashboard from "@/pages/Dashboard";
import Resume from "@/pages/Resume";
import Jobs from "@/pages/Jobs";
import Interview from "@/pages/Interview";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { Loader2 } from "lucide-react";

// Protected Route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes - wrapped in Shell */}
      <Route path="/">
        {isAuthenticated ? (
          <Shell>
            <Dashboard />
          </Shell>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/resume">
        {isAuthenticated ? (
          <Shell>
            <Resume />
          </Shell>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/jobs">
        {isAuthenticated ? (
          <Shell>
            <Jobs />
          </Shell>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/interview">
        {isAuthenticated ? (
          <Shell>
            <Interview />
          </Shell>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
