// src/pages/AdminPanel.tsx
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  FileText,
  Settings,
  Save,
  Trash2,
  Shield,
  Mail,
  Calendar,
  User,
  LogOut,
  Edit,
  X,
  Check,
  Plus,
  Crown,
  ChevronDown,
  Menu,
  Search,
  FileCode,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  report_count?: number;
};

type ReportType = {
  id: string;
  title: string;
  description?: string | null;
  prompt: string;
  assigned_to?: string[] | null;
  status: "active" | "inactive";
  created_at?: string;
};

// Add this new component for better multi-select UI
const UserMultiSelect = ({
  users,
  selectedUserIds,
  onSelectionChange,
  placeholder = "Select users...",
}: {
  users: UserRow[];
  selectedUserIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const unselectedUsers = users.filter(user => !selectedUserIds.includes(user.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md bg-background cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedUsers.length === 0 ? (
          <span className="text-muted-foreground py-1">{placeholder}</span>
        ) : (
          selectedUsers.map(user => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {user.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleUserSelection(user.id);
                }}
              />
            </Badge>
          ))
        )}
        <ChevronDown className="h-4 w-4 absolute right-2 top-3 text-muted-foreground" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {selectedUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer bg-accent"
              onClick={() => toggleUserSelection(user.id)}
            >
              <Check className="h-4 w-4 mr-2" />
              {user.name} — {user.email}
            </div>
          ))}
                    
          {unselectedUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent"
              onClick={() => toggleUserSelection(user.id)}
            >
              <div className="h-4 w-4 mr-2" />
              {user.name} — {user.email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [reportTypeFilter, setReportTypeFilter] = useState<"all" | "active" | "inactive">("all");

  // new report type management state
  const [newReportTypeTitle, setNewReportTypeTitle] = useState("");
  const [newReportTypeDescription, setNewReportTypeDescription] = useState("");
  const [newReportTypePrompt, setNewReportTypePrompt] = useState("");
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);

  const [editingReportTypeId, setEditingReportTypeId] = useState<string | null>(null);
  const [editReportTypeTitle, setEditReportTypeTitle] = useState("");
  const [editReportTypeDescription, setEditReportTypeDescription] = useState("");
  const [editReportTypePrompt, setEditReportTypePrompt] = useState("");
  const [editAssignUserIds, setEditAssignUserIds] = useState<string[]>([]);

  // user create/edit states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editRole, setEditRole] = useState("user");

  // current admin info
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const localRole = localStorage.getItem("role");
      const localEmail = localStorage.getItem("email");
      const localName = localStorage.getItem("name");

      if (localRole) {
        setUserRole(localRole);
        setUserEmail(localEmail || "admin@example.com");
        setUserName(localName || "Admin");
      } else {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          // Check user role from database
          const { data: userData } = await supabase
            .from("users")
            .select("role, name")
            .eq("id", data.user.id)
            .single();

          const role = userData?.role || "user";
          const name = userData?.name || data.user.user_metadata?.full_name || "User";
          const email = data.user.email || "";

          // Store in localStorage for consistency across routes
          localStorage.setItem("role", role);
          localStorage.setItem("email", email);
          localStorage.setItem("name", name);
          localStorage.setItem("userId", data.user.id);

          setUserRole(role);
          setUserEmail(email);
          setUserName(name);
        }
      }
    };

    fetchUser();
    fetchUsers();
    fetchReportTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ------------------------
   * Users
   * -------------------------*/
  const fetchUsers = async () => {
    // First get all users
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) {
      toast({ title: "Error", description: usersError.message, variant: "destructive" });
      return;
    }

    // Then get report counts for each user
    const { data: reportsData, error: reportsError } = await supabase
      .from("reports")
      .select("user_id");

    if (reportsError) {
      toast({ title: "Error", description: reportsError.message, variant: "destructive" });
      return;
    }

    // Count reports per user
    const reportCounts: Record<string, number> = {};
    reportsData?.forEach((report) => {
      reportCounts[report.user_id] = (reportCounts[report.user_id] || 0) + 1;
    });

    // Merge counts with user data
    const usersWithCounts = usersData?.map(user => ({
      ...user,
      report_count: reportCounts[user.id] || 0
    })) as UserRow[];

    setUsers(usersWithCounts || []);
  };

  const handleDeleteUser = async (userId: string) => {
    // Super admins cannot be deleted
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === "super_admin") {
      toast({ 
        title: "Error", 
        description: "Super admin users cannot be deleted", 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User Deleted" });
      fetchUsers();
      // also unassign report types assigned to that user
      await supabase.from("report_types").update({ assigned_to: null }).eq("assigned_to", userId);
      fetchReportTypes();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Only super admins can change roles to/from super_admin
    if ((newRole === "super_admin" || userRole !== "super_admin") && userRole !== "super_admin") {
      toast({ 
        title: "Permission Denied", 
        description: "Only super admins can manage super admin roles", 
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role Updated", description: `User role changed to ${newRole}` });
      fetchUsers();
    }
  };

  const handleAddUser = async () => {
    if (!newName || !newEmail || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    // Only super admins can create other super admins
    if (newUserRole === "super_admin" && userRole !== "super_admin") {
      toast({ 
        title: "Permission Denied", 
        description: "Only super admins can create super admin accounts", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newName,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Then create the user record in your users table
        const { error: userError } = await supabase.from("users").insert([
          {
            id: authData.user.id, // Use the same ID as the auth user
            name: newName,
            email: newEmail,
            role: newUserRole,
            created_at: new Date().toISOString(),
            report_count: 0,
          },
        ]);

        if (userError) {
          // If user creation fails, the auth user will still exist but won't have permissions
          throw userError;
        }

        toast({ 
          title: "User Added", 
          description: `${newName} has been added. They should check their email to confirm their account.` 
        });

        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setConfirmPassword("");
        setNewUserRole("user");
        fetchUsers();
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleEditUser = (user: UserRow) => {
    setEditingUserId(user.id);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditPassword("");
    setEditConfirmPassword("");
    setEditRole(user.role || "user");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditName("");
    setEditEmail("");
    setEditPassword("");
    setEditConfirmPassword("");
    setEditRole("user");
  };

  const handleSaveEdit = async (userId: string) => {
    if (!editName || !editEmail) {
      toast({ title: "Error", description: "Name and email cannot be empty", variant: "destructive" });
      return;
    }

    if (editPassword && editPassword !== editConfirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    // Only super admins can change roles to/from super_admin
    if (editRole === "super_admin" && userRole !== "super_admin") {
      toast({ 
        title: "Permission Denied", 
        description: "Only super admins can assign super admin role", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const currentUser = users.find(u => u.id === userId);
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      const isEditingSelf = currentAuthUser && currentAuthUser.id === userId;

      // Update the user record in users table
      const { error: dbError } = await supabase
        .from("users")
        .update({ name: editName, email: editEmail, role: editRole })
        .eq("id", userId);

      if (dbError) {
        throw dbError;
      }

      // Handle auth updates only if editing own account
      if (isEditingSelf) {
        let successMessage = "User details updated successfully!";
        
        // Update password if provided
        if (editPassword) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: editPassword
          });

          if (passwordError) {
            throw new Error("Password update failed: " + passwordError.message);
          }
          successMessage = "Password updated successfully!";
        }
        
        // Update email if changed (do this separately from password)
        if (editEmail !== currentUser?.email) {
          // For email changes, we don't need verification in admin panel
          // Just update in auth without email confirmation
          const { error: emailError } = await supabase.auth.updateUser({
            email: editEmail
          }, {
            emailRedirectTo: undefined // Skip email verification
          });

          if (emailError) {
            // If direct update fails, just update in database (already done above)
            toast({ 
              title: "Partial Update", 
              description: "Name and role updated. Email change may require verification on next login." 
            });
          } else {
            successMessage = "Account updated! Email changed successfully.";
          }
        }

        toast({ title: "Success", description: successMessage });
      } else {
        // Admin is editing someone else - only name, email in DB, and role
        toast({ 
          title: "User Updated", 
          description: `${editName} has been updated successfully.` 
        });
      }

      // Clear form and refresh
      setEditingUserId(null);
      setEditPassword("");
      setEditConfirmPassword("");
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  /**
   * ------------------------
   * Report Types management
   * -------------------------*/
  const fetchReportTypes = async () => {
    const { data, error } = await supabase
      .from("report_types")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReportTypes((data as ReportType[]) || []);
    }
  };

  const handleCreateReportType = async () => {
    if (!newReportTypeTitle || !newReportTypePrompt) {
      toast({ title: "Error", description: "Report type name and prompt are required", variant: "destructive" });
      return;
    }

    // Convert assigned user IDs to array format
    const assignedUsersArray = assignUserIds.length > 0 ? assignUserIds : null;

    const { error } = await supabase.from("report_types").insert([
      {
        title: newReportTypeTitle,
        description: newReportTypeDescription,
        prompt: newReportTypePrompt,
        assigned_to: assignedUsersArray,
        status: "active",
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report Type Created" });
      setNewReportTypeTitle("");
      setNewReportTypeDescription("");
      setNewReportTypePrompt("");
      setAssignUserIds([]);
      fetchReportTypes();
    }
  };

  const handleDeleteReportType = async (reportTypeId: string) => {
    const { error } = await supabase.from("report_types").delete().eq("id", reportTypeId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report Type Deleted" });
      fetchReportTypes();
    }
  };

  const toggleReportTypeStatus = async (reportType: ReportType) => {
    const newStatus = reportType.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("report_types").update({ status: newStatus }).eq("id", reportType.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Marked ${newStatus}` });
      fetchReportTypes();
    }
  };

  const handleAssignReportTypeToUsers = async (reportTypeId: string, userIds: string[]) => {
    const assignedUsersArray = userIds.length > 0 ? userIds : null;
    const { error } = await supabase.from("report_types").update({ assigned_to: assignedUsersArray }).eq("id", reportTypeId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment Updated" });
      fetchReportTypes();
    }
  };

  const startEditReportType = (rt: ReportType) => {
    setEditingReportTypeId(rt.id);
    setEditReportTypeTitle(rt.title || "");
    setEditReportTypeDescription(rt.description || "");
    setEditReportTypePrompt(rt.prompt || "");
    setEditAssignUserIds(rt.assigned_to || []);
  };

  const cancelEditReportType = () => {
    setEditingReportTypeId(null);
    setEditReportTypeTitle("");
    setEditReportTypeDescription("");
    setEditReportTypePrompt("");
    setEditAssignUserIds([]);
  };

  const saveEditedReportType = async (reportTypeId: string) => {
    if (!editReportTypeTitle || !editReportTypePrompt) {
      toast({ title: "Error", description: "Title and prompt cannot be empty", variant: "destructive" });
      return;
    }

    const assignedUsersArray = editAssignUserIds.length > 0 ? editAssignUserIds : null;

    const { error } = await supabase
      .from("report_types")
      .update({ 
        title: editReportTypeTitle,
        description: editReportTypeDescription,
        prompt: editReportTypePrompt,
        assigned_to: assignedUsersArray
      })
      .eq("id", reportTypeId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Report Type Updated" });
      cancelEditReportType();
      fetchReportTypes();
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredReportTypes = 
    reportTypeFilter === "all"
      ? reportTypes
      : reportTypes.filter((rt) => rt.status === reportTypeFilter);

  // Check if current user has permission to perform actions
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
   <div className="min-h-screen bg-gradient-subtle py-1 md:py-2"> 
  <div className="container px-4">
    
    {/* Top Bar */}
    <div className="flex items-center justify-between px-4 py-2 md:py-3 w-full">
      {/* Left: Logo */}
      <div className="flex-shrink-0">
        <img 
          src="/soundcheckinsight.png" 
          alt="Logo" 
          className="w-[120px] md:w-[170px] h-auto object-contain"
        />
      </div>

      {/* Right: User Dropdown */}
      <div className="flex-shrink-0">
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
                <span className="text-xs text-muted-foreground">
                  Role: {userRole || "Unknown"}
                  {userRole === "super_admin" && " 👑"}
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

    <div className="mb-3 md:mb-5">
      {/* Top Navigation */}
      <div className="container py-1 md:py-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div className="flex flex-col md:flex-row md:space-x-4 w-full md:w-auto">
          <div className="flex justify-between items-center w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold">
              Admin Panel {isSuperAdmin && "👑"} 
            </h1>

            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/profile-settings">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage users, reports and settings
          </p>

          <div>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-2">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="report-types">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Report Types</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
                              
              <div className="space-y-4">
                {filteredUsers.length === 0 && (
                  <p className="text-muted-foreground text-sm">No users found</p>
                )}
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      {editingUserId === user.id ? (
                        <div className="flex flex-col gap-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
                          <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" />
                          <div className="flex items-center gap-2">
                            <Label>Role:</Label>
                            <select 
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="rounded border px-2 py-1"
                              disabled={user.role === "super_admin" && !isSuperAdmin}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                            </select>
                          </div>
                          {editingUserId === localStorage.getItem("userId") ? (
                            <>
                              <Input 
                                type="password" 
                                placeholder="New Password (optional)" 
                                value={editPassword} 
                                onChange={(e) => setEditPassword(e.target.value)} 
                              />
                              <Input 
                                type="password" 
                                placeholder="Confirm New Password" 
                                value={editConfirmPassword} 
                                onChange={(e) => setEditConfirmPassword(e.target.value)} 
                              />
                              <p className="text-xs text-muted-foreground">You can change your own password here.</p>
                            </>
                          ) : (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-xs text-blue-800">
                                <strong>Password Reset:</strong> For security, admins cannot change other users' passwords. 
                                User should use "Forgot Password" on the login page, or you can send them a password reset email.
                              </p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2"
                                onClick={async () => {
                                  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                    redirectTo: `${window.location.origin}/reset-password`,
                                  });
                                  if (error) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                  } else {
                                    toast({ 
                                      title: "Reset Email Sent", 
                                      description: `Password reset email sent to ${user.email}` 
                                    });
                                  }
                                }}
                              >
                                Send Password Reset Email
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                            <h4 className="font-semibold">{user.name}</h4>
                            <Badge variant={
                              user.role === "super_admin" ? "default" : 
                              user.role === "admin" ? "secondary" : "outline"
                            }>
                              {user.role === "super_admin" && <Crown className="h-3 w-3 mr-1" />}
                              {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                              {user.role || "user"}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Joined{" "}
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                            </div>
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {user.report_count ?? 0} reports
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingUserId === user.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSaveEdit(user.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {user.role !== "super_admin" && isAdmin && (
                            <Button variant="outline" size="sm" onClick={() => handleRoleChange(
                              user.id, 
                              user.role === "admin" ? "user" : "admin"
                            )}>
                              {user.role === "admin" ? "Demote" : "Promote"}
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role !== "super_admin" && isAdmin && (
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New User Form */}
              {isAdmin && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Add New User</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <Input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <div className="flex items-center gap-2">
                      <Label>Role:</Label>
                      <select 
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="rounded border px-2 py-1"
                        disabled={!isSuperAdmin && newUserRole === "super_admin"}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="gradient" onClick={handleAddUser}><Plus className="h-4 w-4 mr-2" /> Add User</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Types Tab */}
        <TabsContent value="report-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl md:text-4xl">Report Types</CardTitle>
              <CardDescription>Create, assign, and manage report types with custom prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search report types..."
                    className="pl-8 w-full"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      if (!q) {
                        fetchReportTypes();
                      } else {
                        setReportTypes((prev) => prev.filter((rt) => (rt.title || "").toLowerCase().includes(q)));
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button size="sm" variant={reportTypeFilter === "all" ? "default" : "outline"} onClick={() => setReportTypeFilter("all")} className="flex-1 sm:flex-initial">All</Button>
                  <Button size="sm" variant={reportTypeFilter === "active" ? "default" : "outline"} onClick={() => setReportTypeFilter("active")} className="flex-1 sm:flex-initial">Active</Button>
                  <Button size="sm" variant={reportTypeFilter === "inactive" ? "default" : "outline"} onClick={() => setReportTypeFilter("inactive")} className="flex-1 sm:flex-initial">Inactive</Button>
                </div>
              </div>

              {/* Create Report Type */}
              {isAdmin && (
                <div className="p-4 bg-muted/50 rounded-lg mb-6">
                  <h4 className="font-semibold mb-3">Create New Report Type</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      placeholder="Report Type Name*"
                      value={newReportTypeTitle}
                      onChange={(e) => setNewReportTypeTitle(e.target.value)}
                      required
                    />
                    <Textarea 
                      placeholder="Description"
                      value={newReportTypeDescription}
                      onChange={(e) => setNewReportTypeDescription(e.target.value)}
                     />
                    <div className="space-y-2">
                      <Label>Master Prompt*</Label>
                      <Textarea 
                        placeholder="Enter the prompt for this report type..."
                        value={newReportTypePrompt}
                        onChange={(e) => setNewReportTypePrompt(e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label>Assign To</Label>
                      <UserMultiSelect
                        users={users}
                        selectedUserIds={assignUserIds}
                        onSelectionChange={setAssignUserIds}
                        placeholder="Select users to assign..."
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button variant="gradient" onClick={handleCreateReportType}><Plus className="h-4 w-4 mr-2" /> Create Report Type</Button>
                  </div>
                </div>
              )}

              {/* Report Types list */}
              <div className="space-y-3 mt-6">
                {filteredReportTypes.length === 0 && <p className="text-sm text-muted-foreground">No report types found</p>}
                {filteredReportTypes.map((rt) => {
                  const assignedUsers = users.filter((u) => rt.assigned_to?.includes(u.id));
                  return (
                    <div key={rt.id} className="p-4 bg-muted/50 rounded-lg flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        {editingReportTypeId === rt.id ? (
                          <div className="space-y-3">
                            <Input 
                              placeholder="Report Type Name*"
                              value={editReportTypeTitle}
                              onChange={(e) => setEditReportTypeTitle(e.target.value)}
                              required
                            />
                            <Textarea 
                              placeholder="Description"
                              value={editReportTypeDescription ?? ""}
                              onChange={(e) => setEditReportTypeDescription(e.target.value)}
                             />
                            <div className="space-y-2">
                              <Label>Master Prompt*</Label>
                              <Textarea 
                                value={editReportTypePrompt}
                                onChange={(e) => setEditReportTypePrompt(e.target.value)}
                                className="min-h-[150px] font-mono text-sm"
                                required
                              />
                            </div>
                            <div>
                              <Label>Assign to</Label>
                              <UserMultiSelect
                                users={users}
                                selectedUserIds={editAssignUserIds}
                                onSelectionChange={setEditAssignUserIds}
                                placeholder="Select users to assign..."
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                              <h4 className="font-semibold">{rt.title}</h4>
                              <Badge variant={rt.status === "active" ? "default" : "secondary"}>
                                {rt.status === "active" ? "Active" : "Inactive"}
                               </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rt.description}</p>
                            <div className="mb-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <FileCode className="h-4 w-4" />
                                <span> Master Prompt:</span>
                              </div>
                              <div className="text-xs bg-muted p-2 rounded-md overflow-hidden">
                                {rt.prompt.length > 150
                                   ? `${rt.prompt.substring(0, 150)}...`
                                   : rt.prompt}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Assigned to: {assignedUsers.length > 0
                                 ? assignedUsers.map(u => u.name).join(", ")
                                 : "All users"}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        {editingReportTypeId === rt.id ? (
                          <>
                            <div className="flex gap-2 w-full md:w-auto">
                              <Button size="sm" onClick={() => saveEditedReportType(rt.id)} className="flex-1 md:flex-initial"><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={cancelEditReportType} className="flex-1 md:flex-initial"><X className="h-4 w-4" /></Button>
                            </div>
                          </>
                        ) : (
                          <>
                             <div className="flex flex-col gap-2 w-full md:w-auto">
                              {isAdmin && (
                                <Button size="sm" onClick={() => toggleReportTypeStatus(rt)} className="w-full md:w-auto">
                                  {rt.status === "active" ? "Mark Inactive" : "Mark Active"}
                                 </Button>
                              )}
                              
                              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                {isAdmin && (
                                  <div className="w-full md:w-72">
                                    <UserMultiSelect
                                      users={users}
                                      selectedUserIds={rt.assigned_to || []}
                                      onSelectionChange={(selectedIds) => handleAssignReportTypeToUsers(rt.id, selectedIds)}
                                      placeholder="Assign users..."
                                    />
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  {isAdmin && (
                                    <Button size="sm" variant="outline" onClick={() => startEditReportType(rt)} className="flex-1 md:flex-initial">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {isAdmin && (
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteReportType(rt.id)} className="flex-1 md:flex-initial">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</div>
  );
}