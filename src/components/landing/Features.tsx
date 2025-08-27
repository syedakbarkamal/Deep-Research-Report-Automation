import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Users, 
  FileSearch, 
  Cloud, 
  Link2,
  Brain,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Leverage OpenAI's Deep Research API to generate comprehensive, in-depth reports from your inputs."
  },
  {
    icon: FileSearch,
    title: "Multi-Source Input",
    description: "Submit meeting transcripts, client URLs, and upload documents (PDF, DOCX, PPT) for complete analysis."
  },
  {
    icon: Cloud,
    title: "Google Docs Integration",
    description: "Reports are automatically formatted and delivered to Google Docs with shareable links."
  },
  {
    icon: Zap,
    title: "Async Processing",
    description: "Submit jobs and track their progress in real-time with status updates throughout the process."
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Admin and user roles ensure proper access control and report management across your team."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security with encrypted storage and secure API connections."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Deep Research</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete solution for automating your research workflow from input to final report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all hover:border-primary/50">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-primary p-2 text-primary-foreground mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-gradient-subtle rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Streamline Your Research Workflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-success mb-2" />
                <span className="font-semibold">Submit Input</span>
                <span className="text-sm text-muted-foreground">Upload docs & transcripts</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-success mb-2" />
                <span className="font-semibold">AI Processing</span>
                <span className="text-sm text-muted-foreground">Deep research analysis</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-success mb-2" />
                <span className="font-semibold">Get Report</span>
                <span className="text-sm text-muted-foreground">Formatted Google Doc</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}