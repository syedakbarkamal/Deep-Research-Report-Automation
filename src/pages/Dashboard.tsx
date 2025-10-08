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
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  ExternalLink,
  Loader2,
  User,
  LogOut,
  Settings,
  Shield,
  Crown,
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
import ResearchStatusCard from "./ResearchStatusCard";

interface Report {
  openai_job_id: any;
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

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch logged-in user + reports
  useEffect(() => {
    const fetchUserAndReports = async () => {
      try {
        const localRole = localStorage.getItem("role");
        const localEmail = localStorage.getItem("email");
        const localName = localStorage.getItem("name");
        const localUserId = localStorage.getItem("userId");

        let currentUserId: string | null = null;
        let currentUserRole = "user";

        // Check if user has stored credentials (admin or super_admin)
        if (localRole && (localRole === "admin" || localRole === "super_admin")) {
          currentUserRole = localRole;
          setUserRole(localRole);
          setUserEmail(localEmail || "admin@example.com");
          setUserName(localName || (localRole === "super_admin" ? "Super Admin" : "Admin"));
          currentUserId = localUserId;
          setUserId(localUserId);
        } else {
          // Regular user - check Supabase auth
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
          currentUserId = data.user.id;
          setUserId(currentUserId);
          setUserEmail(data.user.email);
          setUserName(data.user.user_metadata?.full_name || "User");

          // Fetch user role from database
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", currentUserId)
            .single();

          currentUserRole = userData?.role || "user";
          setUserRole(currentUserRole);

          // Store in localStorage for consistency
          if (userData?.role) {
            localStorage.setItem("role", userData.role);
            localStorage.setItem("userId", currentUserId);
          }
        }

        // Fetch reports based on role
        let query = supabase.from("reports").select("*").order("created_at", { ascending: false });

        // Only filter by user_id if not admin or super_admin
        if (currentUserRole !== "admin" && currentUserRole !== "super_admin" && currentUserId) {
          query = query.eq("user_id", currentUserId);
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
  }, [navigate, toast]);

  const handleLogout = async () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredReports = reports.filter((report) =>
    report.report_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is admin or super admin
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isSuperAdmin = userRole === "super_admin";

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Top Navigation */}
      {/* Top Navigation */}
      <div className="container py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          {/* Logo */}
          <div className="flex justify-center md:justify-start">
            <img 
              src="/soundcheckinsight.png" 
              alt="Logo" 
              className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[150px] lg:h-[150px] object-contain"
            />
          </div>

          {/* Navigation Buttons and User Menu */}
          <div className="flex flex-row justify-between md:justify-end items-center gap-2 md:gap-4">
            <div className="flex flex-wrap gap-2">
              <Link to="/dashboard">
                <Button variant="gradient" size="sm" className="md:size-default flex items-center text-xs md:text-sm">
                  Dashboard
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin">
                  <Button variant="gradient" size="sm" className="md:size-default flex items-center text-xs md:text-sm">
                    {isSuperAdmin && <Crown className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />}
                    {!isSuperAdmin && <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />}
                    <span className="hidden sm:inline">Admin Panel</span>
                    <span className="sm:hidden">Admin</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {userName || "Guest"} {isSuperAdmin && "👑"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {userEmail || "Not signed in"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Role: {userRole}
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
        </div>
      </div>

      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isAdmin ? "All Research Reports" : "Your Research Reports"}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? "Track and manage all research reports across the platform"
                : "Track and manage all your AI-generated research reports"
              }
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
            filteredReports.map((report) => (
              <ResearchStatusCard
                key={report.id}
                reportId={report.id}
                reportName={report.report_name}
                clientName={report.client_name}
                openaiJobId={report.openai_job_id}
                status={report.status}
                createdAt={report.created_at}
                onStatusUpdate={(newStatus) => {
                  setReports((prev) =>
                    prev.map((r) =>
                      r.id === report.id ? { ...r, status: newStatus } : r
                    )
                  );
                }}
              />
            ))
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