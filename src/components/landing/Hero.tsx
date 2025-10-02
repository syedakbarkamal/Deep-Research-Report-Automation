import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-subtle">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative container py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by OpenAI Deep Research API
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Transform Meetings into
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Deep Research Reports</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automate your research workflow with AI. Generate comprehensive 80-90 page reports from meeting transcripts, 
            URLs, and documents—delivered directly to Google Docs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/register">
              <Button size="xl" variant="gradient" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="#">
              <Button size="xl" variant="outline">
                Watch Demo
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">80-90</span>
              <span className="text-sm text-muted-foreground">Pages per Report</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <span className="text-2xl font-bold">15min</span>
              <span className="text-sm text-muted-foreground">Average Processing</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <span className="text-2xl font-bold">100%</span>
              <span className="text-sm text-muted-foreground">Automated</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px);
          background-size: 4rem 4rem;
        }
      `}</style>
    </section>
  );
}