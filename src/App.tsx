import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
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
import About from "./pages/About";
import Awards from "./pages/Awards";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Founder from "./pages/Founder";
import MortgageCalculatorPage from "./pages/MortgageCalculator";
import MarketReport from "./pages/MarketReport";
import Concierge from "./pages/Concierge";
import NotFound from "./pages/NotFound";
import WelcomeModal from "./components/WelcomeModal";
import GlobalHeader from "./components/GlobalHeader";
import { ScrollToTopOnMount, ScrollToTopButton } from "./components/ScrollToTop";

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
          <ScrollToTopOnMount />
          <ScrollToTopButton />
          <WelcomeModal />
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/properties" element={<Properties />} />
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
              <Route path="/about" element={<About />} />
              <Route path="/awards" element={<Awards />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/founder" element={<Founder />} />
              <Route path="/mortgage-calculator" element={<MortgageCalculatorPage />} />
              <Route path="/market-report" element={<MarketReport />} />
              <Route path="/concierge" element={<Concierge />} />
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
