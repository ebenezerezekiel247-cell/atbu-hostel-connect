import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import Maintenance from "@/pages/maintenance";
import Marketplace from "@/pages/marketplace";
import Sos from "@/pages/sos";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { session, profile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(location);

  if (!session && !isPublic) return <Redirect to="/login" />;
  if (session && isPublic) return <Redirect to="/" />;
  if (session && profile && !profile.onboardingComplete && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AuthGate>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/onboarding" component={Onboarding} />
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/chat" component={Chat} />
              <Route path="/maintenance" component={Maintenance} />
              <Route path="/marketplace" component={Marketplace} />
              <Route path="/sos" component={Sos} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </AuthGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
