import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import DeveloperDetail from "./pages/DeveloperDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import News from "./pages/News";
import NotFound from "./pages/NotFound";
import WelcomeModal from "./components/WelcomeModal";
import GlobalHeader from "./components/GlobalHeader";

const queryClient = new QueryClient();

// Layout wrapper that conditionally shows the header
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Hide header on quiz page for cleaner UX
  const hideHeader = location.pathname === "/quiz";

  return (
    <>
      {!hideHeader && <GlobalHeader />}
      <div
        className={`min-h-screen bg-[hsl(var(--premium-bg))] ${
          !hideHeader ? "pt-20 lg:pt-24" : ""
        }`}
      >
        {children}
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <WelcomeModal />
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/community/:slug" element={<CommunityDetail />} />
              <Route path="/developer/:slug" element={<DeveloperDetail />} />
              <Route path="/project/:slug" element={<ProjectDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz-results" element={<QuizResults />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/news" element={<News />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
