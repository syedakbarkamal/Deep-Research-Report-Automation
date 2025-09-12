import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NewReport from "./pages/NewReport";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ResearchStatusCard from "./pages/ResearchStatusCard";
import ReportDetails from "./pages/ReportDetails";
import Profile from "./pages/profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-report" element={<NewReport />} />
          <Route path="/admin" element={<AdminPanel />} />
<Route path="/research-status-card" element={<ResearchStatusCard reportId={""} reportName={""} clientName={""} status={""} createdAt={""} />} />
        <Route path="/report/:id" element={<ReportDetails />} />

        <Route path="/profile-settings" element={<Profile />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
