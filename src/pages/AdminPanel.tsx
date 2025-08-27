import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  Settings, 
  Save,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Edit
} from "lucide-react";

// Mock data
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    createdAt: "2024-01-01",
    reportCount: 15
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    createdAt: "2024-01-05",
    reportCount: 8
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "user",
    createdAt: "2024-01-10",
    reportCount: 3
  }
];

const defaultPrompt = `You are a deep research analyst. Your task is to generate a comprehensive research report based on the provided meeting transcript, URLs, and documents. 

The report should be:
- 80-90 pages in length
- Well-structured with clear sections
- Include executive summary, detailed analysis, and recommendations
- Professional in tone and formatting

Focus on extracting key insights, identifying patterns, and providing actionable recommendations.`;

export default function AdminPanel() {
  const { toast } = useToast();
  const [users] = useState(mockUsers);
  const [masterPrompt, setMasterPrompt] = useState(defaultPrompt);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const handleSavePrompt = () => {
    setIsEditingPrompt(false);
    toast({
      title: "Prompt Updated",
      description: "The master research prompt has been saved successfully.",
    });
  };

  const handleDeleteUser = (userId: number) => {
    toast({
      title: "User Management",
      description: "Supabase connection required for user management.",
    });
  };

  const handleRoleChange = (userId: number, newRole: string) => {
    toast({
      title: "Role Updated",
      description: `User role changed to ${newRole}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, reports, and system settings</p>
        </div>

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
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
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
                            Joined {user.createdAt}
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {user.reportCount} reports
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}
                        >
                          Toggle Role
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Add New User</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input placeholder="Name" />
                    <Input type="email" placeholder="Email" />
                    <Button variant="gradient">Add User</Button>
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
                <CardDescription>
                  Edit the system prompt used for all research report generation
                </CardDescription>
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
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingPrompt(false);
                          setMasterPrompt(defaultPrompt);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditingPrompt(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Prompt
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
                  <p className="text-sm text-muted-foreground">
                    Connect Supabase to securely store API keys
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Google API Credentials</Label>
                  <Input type="password" placeholder="Google OAuth Client ID" disabled />
                  <p className="text-sm text-muted-foreground">
                    Required for Google Docs integration
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}