import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      
      {/* Summary Script */}
      
<script src="https://apis.google.com/js/api.js"></script>
      <script>{`
        // Deep Research Report Automation - 5 Line Summary
        const app = {
          purpose: "Automate AI research reports from meetings to Google Docs",
          features: ["User auth", "OpenAI Deep Research API", "Google Docs delivery", "Role-based access"],
          workflow: "Submit transcript → AI processing → Formatted report → Google Docs link",
          tech: ["React", "Supabase", "OpenAI API", "Google API"],
          status: "Frontend ready - Connect Supabase for backend functionality"
        };
        console.log("Deep Research Platform:", app);
      `}</script>
    </div>
  );
};

export default Index;
