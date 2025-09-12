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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const defaultPrompt = ``;

type UserRow = {
  id: string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  report_count?: number;
};

type PromptRow = {
  id: string;
  title: string;
  description?: string | null;
  assigned_to?: string[] | null;
  status: "done" | "not_done";
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
  const [masterPrompt, setMasterPrompt] = useState(defaultPrompt);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // new prompt management state
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptDescription, setNewPromptDescription] = useState("");
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [promptFilter, setPromptFilter] = useState<"all" | "done" | "not_done">(
    "all"
  );
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editPromptTitle, setEditPromptTitle] = useState("");
  const [editPromptDescription, setEditPromptDescription] = useState("");
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
            .select("role")
            .eq("id", data.user.id)
            .single();
          
          setUserRole(userData?.role || "user");
          setUserEmail(data.user.email);
          setUserName(data.user.user_metadata?.full_name || "User");
        }
      }
    };

    fetchUser();
    fetchUsers();
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ------------------------
   * Users
   * -------------------------*/
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setUsers((data as UserRow[]) || []);
    }
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
      // also unassign prompts assigned to that user (optional)
      await supabase.from("prompts").update({ assigned_to: null }).eq("assigned_to", userId);
      fetchPrompts();
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

    // NOTE: In production you should sign up via supabase.auth.signUp and not store raw password in a table.
    const { error } = await supabase.from("users").insert([
      {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newUserRole,
        created_at: new Date().toISOString(),
        report_count: 0,
      },
    ]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User Added", description: `${newName} has been added.` });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setNewUserRole("user");
      fetchUsers();
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

    const updateData: any = { name: editName, email: editEmail, role: editRole };
    if (editPassword) updateData.password = editPassword;

    const { error } = await supabase.from("users").update(updateData).eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User Updated", description: `${editName} has been updated.` });
      setEditingUserId(null);
      fetchUsers();
    }
  };

  /** ------------------------
   * Prompts management
   * -------------------------*/
  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPrompts((data as PromptRow[]) || []);
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPromptTitle) {
      toast({ title: "Error", description: "Prompt title is required", variant: "destructive" });
      return;
    }
    
    // Convert assigned user IDs to array format
    const assignedUsersArray = assignUserIds.length > 0 ? assignUserIds : null;
    
    const { error } = await supabase.from("prompts").insert([
      {
        title: newPromptTitle,
        description: newPromptDescription,
        assigned_to: assignedUsersArray,
        status: "not_done",
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prompt Added" });
      setNewPromptTitle("");
      setNewPromptDescription("");
      setAssignUserIds([]);
      fetchPrompts();
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    const { error } = await supabase.from("prompts").delete().eq("id", promptId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prompt Deleted" });
      fetchPrompts();
    }
  };

  const togglePromptStatus = async (prompt: PromptRow) => {
    const newStatus = prompt.status === "done" ? "not_done" : "done";
    const { error } = await supabase.from("prompts").update({ status: newStatus }).eq("id", prompt.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Marked ${newStatus.replace("_", " ")}` });
      fetchPrompts();
    }
  };

  const handleAssignPromptToUsers = async (promptId: string, userIds: string[]) => {
    const assignedUsersArray = userIds.length > 0 ? userIds : null;
    const { error } = await supabase.from("prompts").update({ assigned_to: assignedUsersArray }).eq("id", promptId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment Updated" });
      fetchPrompts();
    }
  };

  const startEditPrompt = (p: PromptRow) => {
    setEditingPromptId(p.id);
    setEditPromptTitle(p.title || "");
    setEditPromptDescription(p.description || "");
    setEditAssignUserIds(p.assigned_to || []);
  };

  const cancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditPromptTitle("");
    setEditPromptDescription("");
    setEditAssignUserIds([]);
  };

  const saveEditedPrompt = async (promptId: string) => {
    if (!editPromptTitle) {
      toast({ title: "Error", description: "Title cannot be empty", variant: "destructive" });
      return;
    }
    
    const assignedUsersArray = editAssignUserIds.length > 0 ? editAssignUserIds : null;
    
    const { error } = await supabase
      .from("prompts")
      .update({ 
        title: editPromptTitle, 
        description: editPromptDescription,
        assigned_to: assignedUsersArray
      })
      .eq("id", promptId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prompt Updated" });
      cancelEditPrompt();
      fetchPrompts();
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSaveMasterPrompt = () => {
    setIsEditingPrompt(false);
    toast({
      title: "Prompt Updated",
      description: "The master research prompt has been saved successfully.",
    });
    // Optionally: persist to a config table in supabase
  };

  const filteredPrompts =
    promptFilter === "all"
      ? prompts
      : prompts.filter((p) => p.status === promptFilter);

  // Check if current user has permission to perform actions
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-subtle py-4 md:py-8">
      <div className="container px-4">
        <div className="mb-6 md:mb-8">
          {/* Top Navigation */}
          <div className="container py-4 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row md:space-x-4 w-full md:w-auto">
              <div className="flex justify-between items-center w-full md:w-auto">
                <h1 className="text-2xl md:text-3xl font-bold">Admin Panel {isSuperAdmin && "👑"}</h1>
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
              <p className="text-muted-foreground mb-2 text-sm md:text-base">Manage users, Reports and settings</p>
            </div>

            {/* User Dropdown */}
            <div className="hidden md:flex justify-end w-full md:w-auto">
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

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full max-w-4xl grid-cols-3">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="prompts">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Report Types</span>
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
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
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
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
                              <Input type="password" placeholder="New Password (optional)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                              <Input type="password" placeholder="Confirm New Password" value={editConfirmPassword} onChange={(e) => setEditConfirmPassword(e.target.value)} />
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

            {/* Prompts Tab */}
            <TabsContent value="prompts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl md:text-4xl">Report Types</CardTitle>
                  <CardDescription>Create, assign, and toggle report completion</CardDescription>
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
                            fetchPrompts();
                          } else {
                            setPrompts((prev) => prev.filter((p) => (p.title || "").toLowerCase().includes(q)));
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button size="sm" variant={promptFilter === "all" ? "default" : "outline"} onClick={() => setPromptFilter("all")} className="flex-1 sm:flex-initial">All</Button>
                      <Button size="sm" variant={promptFilter === "not_done" ? "default" : "outline"} onClick={() => setPromptFilter("not_done")} className="flex-1 sm:flex-initial">Not Done</Button>
                      <Button size="sm" variant={promptFilter === "done" ? "default" : "outline"} onClick={() => setPromptFilter("done")} className="flex-1 sm:flex-initial">Done</Button>
                    </div>
                  </div>

                  {/* Create Prompt */}
                  {isAdmin && (
                    <div className="p-4 bg-muted/50 rounded-lg mb-6">
                      <h4 className="font-semibold mb-3">Create Report Type</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input 
                          placeholder="Report Type Name*" 
                          value={newPromptTitle} 
                          onChange={(e) => setNewPromptTitle(e.target.value)} 
                          required
                        />
                        <div>
                          <div className="md:-mt-7">
                          <Label>Assign To*</Label>
                          <UserMultiSelect
                            users={users}
                            selectedUserIds={assignUserIds}
                            onSelectionChange={setAssignUserIds}
                            placeholder="Select users to assign..."
                          />
                          </div>
                        </div>
                        <Textarea 
                          className="md:col-span-2" 
                          placeholder="Description*" 
                          value={newPromptDescription} 
                          onChange={(e) => setNewPromptDescription(e.target.value)} 
                          required
                        />
                      </div>
                      <div className="mt-3">
                        <Button variant="gradient" onClick={handleCreatePrompt}><Plus className="h-4 w-4 mr-2" /> Create Prompt</Button>
                      </div>
                    </div>
                  )}

                  {/* Master Research Prompt */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Master Research Prompt</CardTitle>
                      <CardDescription>Edit the system prompt used for all research report generation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="prompt">System Prompt</Label>
                        <Textarea
                          id="prompt"
                          value={masterPrompt}
                          onChange={(e) => setMasterPrompt(e.target.value)}
                          className="min-h-[200px] md:min-h-[300px] font-mono text-sm"
                          disabled={!isEditingPrompt || !isAdmin}
                        />
                      </div>
                      {isAdmin && (
                        <div className="flex flex-wrap gap-3">
                          {isEditingPrompt ? (
                            <>
                              <Button onClick={handleSaveMasterPrompt} variant="gradient">
                                <Save className="h-4 w-4 mr-2" /> Save Changes
                              </Button>
                              <Button variant="outline" onClick={() => { setIsEditingPrompt(false); setMasterPrompt(defaultPrompt); }}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => setIsEditingPrompt(true)} variant="outline">
                              <Edit className="h-4 w-4 mr-2" /> Edit Prompt
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Prompt list */}
                  <div className="space-y-3 mt-6">
                    {filteredPrompts.length === 0 && <p className="text-sm text-muted-foreground">No prompts found</p>}
                    {filteredPrompts.map((p) => {
                      const assignedUsers = users.filter((u) => p.assigned_to?.includes(u.id));
                      return (
                        <div key={p.id} className="p-4 bg-muted/50 rounded-lg flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            {editingPromptId === p.id ? (
                              <div className="space-y-2">
                                <Input value={editPromptTitle} onChange={(e) => setEditPromptTitle(e.target.value)} />
                                <Textarea value={editPromptDescription ?? ""} onChange={(e) => setEditPromptDescription(e.target.value)} />
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
                                  <h4 className="font-semibold">{p.title}</h4>
                                  <Badge variant={p.status === "done" ? "default" : "secondary"}>
                                    {p.status === "done" ? "Done" : "Not done"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                                <div className="text-xs text-muted-foreground">
                                  Assigned to: {assignedUsers.length > 0 
                                    ? assignedUsers.map(u => u.name).join(", ") 
                                    : "Unassigned"}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                            {editingPromptId === p.id ? (
                              <>
                                <div className="flex gap-2 w-full md:w-auto">
                                  <Button size="sm" onClick={() => saveEditedPrompt(p.id)} className="flex-1 md:flex-initial"><Check className="h-4 w-4" /></Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditPrompt} className="flex-1 md:flex-initial"><X className="h-4 w-4" /></Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                  {isAdmin && (
                                    <Button size="sm" onClick={() => togglePromptStatus(p)} className="w-full md:w-auto">
                                      {p.status === "done" ? "Mark Not Done" : "Mark Done"}
                                    </Button>
                                  )}

                                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                    {isAdmin && (
                                      <div className="w-full md:w-72">
                                      <UserMultiSelect
                                        users={users}
                                        selectedUserIds={p.assigned_to || []}
                                        onSelectionChange={(selectedIds) => handleAssignPromptToUsers(p.id, selectedIds)}
                                        placeholder="Assign users..."
                                      />
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      {isAdmin && (
                                        <Button size="sm" variant="outline" onClick={() => startEditPrompt(p)} className="flex-1 md:flex-initial">
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {isAdmin && (
                                        <Button size="sm" variant="destructive" onClick={() => handleDeletePrompt(p.id)} className="flex-1 md:flex-initial">
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

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>Manage API keys and integration settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input type="password" placeholder="sk-..." disabled />
                    <p className="text-sm text-muted-foreground">Connect Supabase to securely store API keys</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Google API Credentials</Label>
                    <Input type="password" placeholder="Google OAuth Client ID" disabled />
                    <p className="text-sm text-muted-foreground">Required for Google Docs integration</p>
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