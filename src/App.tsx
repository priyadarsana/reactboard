import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LostFound from "./pages/LostFound";
import Chat from "./pages/Chat";
import Queries from "./pages/Queries";
import Announcements from "./pages/Announcements";
import ODRequests from "./pages/ODRequests";
import Faculty from "./pages/Faculty";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/od-requests" element={<ODRequests />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
