import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

// Mock data for demonstration
const mockReports = [
  {
    id: 1,
    projectName: "Q4 Strategy Meeting Analysis",
    status: "completed",
    submittedAt: "2024-01-15 09:30",
    completedAt: "2024-01-15 09:45",
    googleDocsUrl: "https://docs.google.com/document/d/example1"
  },
  {
    id: 2,
    projectName: "Product Launch Research",
    status: "processing",
    submittedAt: "2024-01-15 10:00",
    completedAt: null,
    googleDocsUrl: null
  },
  {
    id: 3,
    projectName: "Market Analysis Report",
    status: "queued",
    submittedAt: "2024-01-15 10:15",
    completedAt: null,
    googleDocsUrl: null
  }
];

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-success"
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    variant: "secondary" as const,
    color: "text-info"
  },
  queued: {
    label: "Queued",
    icon: Clock,
    variant: "outline" as const,
    color: "text-warning"
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    variant: "destructive" as const,
    color: "text-destructive"
  }
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reports] = useState(mockReports);

  const filteredReports = reports.filter(report =>
    report.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      
   <div className="container py-8"> <div className="flex justify-center space-x-4"> <Link to="/dashboard"> <Button variant="gradient" className="mt-4 md:mt-0 flex items-center">  Dashboard </Button> </Link> <Link to="/admin"> <Button variant="gradient" className="mt-4 md:mt-0 flex items-center">   Admin Panel </Button> </Link> </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Research Reports</h1>
            <p className="text-muted-foreground">Track and manage all your AI-generated research reports</p>
          </div>
          <Link to="/new-report">
            <Button variant="gradient" className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Reports
            </Button>
          </Link>
          
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {reports.filter(r => r.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {reports.filter(r => r.status === "processing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Queue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {reports.filter(r => r.status === "queued").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map(report => {
            const config = statusConfig[report.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <CardTitle className="text-lg">{report.projectName}</CardTitle>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {report.submittedAt}
                          </div>
                          {report.completedAt && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {report.completedAt}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className={`h-3 w-3 ${report.status === 'processing' ? 'animate-spin' : ''}`} />
                        {config.label}
                      </Badge>
                      {report.googleDocsUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={report.googleDocsUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Report
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {filteredReports.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Create your first research report to get started"}
              </p>
              {!searchQuery && (
                <Link to="/new-report">
                  <Button variant="gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}