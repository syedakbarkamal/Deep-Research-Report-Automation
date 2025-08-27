import { useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const defaultPrompt = `You are a deep research analyst. Your task is to generate a comprehensive research report based on the provided meeting transcript, URLs, and documents. 

The report should be:
- 80-90 pages in length
- Well-structured with clear sections
- Include executive summary, detailed analysis, and recommendations
- Professional in tone and formatting

Focus on extracting key insights, identifying patterns, and providing actionable recommendations.`;

export default function AdminPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [masterPrompt, setMasterPrompt] = useState(defaultPrompt);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const localRole = localStorage.getItem("role");
      const localEmail = localStorage.getItem("email");
      const localName = localStorage.getItem("name");

      if (localRole === "admin") {
        setUserEmail(localEmail || "akbar.otbkamalotb@gmail.com");
        setUserName(localName || "Admin");
      } else {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserEmail(data.user.email);
          setUserName(data.user.user_metadata?.full_name || "User");
        }
      }
    };
    fetchUser();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setUsers(data || []);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSavePrompt = () => {
    setIsEditingPrompt(false);
    toast({
      title: "Prompt Updated",
      description: "The master research prompt has been saved successfully.",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User Deleted" });
      fetchUsers();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
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

    const { error } = await supabase.from("users").insert([{
      name: newName,
      email: newEmail,
      password: newPassword, // ⚠️ Insecure: use supabase.auth in production
      role: "user",
      created_at: new Date().toISOString(),
      report_count: 0,
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User Added", description: `${newName} has been added.` });
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
      fetchUsers();
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword("");
    setEditConfirmPassword("");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditName("");
    setEditEmail("");
    setEditPassword("");
    setEditConfirmPassword("");
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

    const updateData: any = { name: editName, email: editEmail };
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

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container">
        <div className="mb-8">

          
          {/* Top Navigation */}
          <div className="container py-8 flex justify-between items-center">
            <div className="flex space-x-4">
              <Link to="/dashboard">
                <Button variant="gradient" className="mt-4 md:mt-0 flex items-center">
                  Dashboard
                </Button>
              </Link>
            </div>
              

            {/* User Dropdown */}
            <div className="flex justify-end w-full">
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

        
          </div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground mb-2">
              Manage users, reports, and system settings
            </p>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
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
                  <div className="space-y-4">
                    {users.length === 0 && (
                      <p className="text-muted-foreground text-sm">No users found</p>
                    )}
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          {editingUserId === user.id ? (
                            <div className="flex flex-col gap-2">
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                              <Input type="password" placeholder="New Password (optional)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                              <Input type="password" placeholder="Confirm New Password" value={editConfirmPassword} onChange={(e) => setEditConfirmPassword(e.target.value)} />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">{user.name}</h4>
                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                  <Shield className="h-3 w-3 mr-1" />
                                  {user.role}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {user.email}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Joined {new Date(user.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {user.report_count} reports
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
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
                              <Button variant="outline" size="sm" onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}>
                                Toggle Role
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New User Form */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-3">Add New User</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                      <Input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                      <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <div className="mt-3">
                      <Button variant="gradient" onClick={handleAddUser}>Add User</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Reports</CardTitle>
                  <CardDescription>View and manage reports across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Connect Supabase to view and manage all reports</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
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
                      className="min-h-[300px] font-mono text-sm"
                      disabled={!isEditingPrompt}
                    />
                  </div>
                  <div className="flex gap-3">
                    {isEditingPrompt ? (
                      <>
                        <Button onClick={handleSavePrompt} variant="gradient">
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
                </CardContent>
              </Card>

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
