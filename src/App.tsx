import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatBot } from "@/components/chat/ChatBot";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Hotels from "./pages/Hotels";
import Bookings from "./pages/Bookings";
import Alerts from "./pages/Alerts";
import SavedSearches from "./pages/SavedSearches";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/help" element={<Help />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/saved-searches" element={<SavedSearches />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;