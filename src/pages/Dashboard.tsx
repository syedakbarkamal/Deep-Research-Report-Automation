import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Loader2,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  report_name: string;
  client_name: string;
  type_of_report: string;
  meeting_transcript: string;
  client_urls: string[];
  file_urls: string[];
  status: string;
  created_at: string;
  completed_at?: string | null;
  google_docs_url?: string | null;
}

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-success",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    variant: "secondary" as const,
    color: "text-info",
  },
  queued: {
    label: "Queued",
    icon: Clock,
    variant: "outline" as const,
    color: "text-warning",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    variant: "destructive" as const,
    color: "text-destructive",
  },
};

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const navigate = useNavigate();
  const { toast } = useToast();

  // ✅ Fetch logged-in user + reports
  useEffect(() => {
    const fetchUserAndReports = async () => {
      try {
        const localRole = localStorage.getItem("role");
        const localEmail = localStorage.getItem("email");
        const localName = localStorage.getItem("name");

        let userId: string | null = null;

        if (localRole === "admin") {
          setUserRole("admin");
          setUserEmail(localEmail || "admin@example.com");
          setUserName(localName || "Admin");
        } else {
          const { data, error } = await supabase.auth.getUser();
          if (error || !data.user) {
            toast({
              title: "Error",
              description: "You must be signed in",
              variant: "destructive",
            });
            navigate("/login");
            return;
          }
          userId = data.user.id;
          setUserEmail(data.user.email);
          setUserName(data.user.user_metadata?.full_name || "User");
        }

        // ✅ Fetch reports (only current user unless admin)
        let query = supabase.from("reports").select("*").order("created_at", { ascending: false });

        if (userRole !== "admin" && userId) {
          query = query.eq("user_id", userId);
        }

        const { data: reportsData, error: reportsError } = await query;

        if (reportsError) {
          throw reportsError;
        }
        setReports(reportsData as Report[]);
      } catch (err: any) {
        toast({
          title: "Error fetching reports",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndReports();
  }, [navigate, toast, userRole]);

  const handleLogout = async () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredReports = reports.filter((report) =>
    report.report_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Top Navigation */}
      <div className="container py-8 flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/dashboard">
            <Button variant="gradient" className="mt-4 md:mt-0 flex items-center">
              Dashboard
            </Button>
          </Link>

          {userRole === "admin" && (
            <Link to="/admin">
              <Button variant="gradient" className="mt-4 md:mt-0 flex items-center">
                Admin Panel
              </Button>
            </Link>
          )}
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{userName || "Guest"}</span>
                <span className="text-xs text-muted-foreground">
                  {userEmail || "Not signed in"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile-settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Research Reports</h1>
            <p className="text-muted-foreground">
              Track and manage all your AI-generated research reports
            </p>
          </div>
          <Link to="/new-report">
            <Button variant="gradient" className="mt-4 md:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Report
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

        {/* Stats */}
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
                {reports.filter((r) => r.status === "completed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {reports.filter((r) => r.status === "processing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Queue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {reports.filter((r) => r.status === "queued").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="text-center py-12">
              <CardContent>
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                <p>Loading reports...</p>
              </CardContent>
            </Card>
          ) : filteredReports.length > 0 ? (
            filteredReports.map((report) => {
              const config = statusConfig[report.status as keyof typeof statusConfig];
              const StatusIcon = config?.icon || FileText;

              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <CardTitle className="text-lg">{report.report_name}</CardTitle>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(report.created_at).toLocaleString()}
                            </div>
                            {report.completed_at && (
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {new Date(report.completed_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mt-4 md:mt-0">
                        <Badge variant={config?.variant || "outline"} className="gap-1">
                          <StatusIcon
                            className={`h-3 w-3 ${
                              report.status === "processing" ? "animate-spin" : ""
                            }`}
                          />
                          {config?.label || report.status}
                        </Badge>
                        {report.google_docs_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={report.google_docs_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
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
            })
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Create your first research report to get started"}
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
    </div>
  );
}
