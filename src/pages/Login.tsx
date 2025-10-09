import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, Mail, Lock, Crown, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Demo admin credentials (for demonstration only)
  const SUPER_ADMIN_EMAIL = "akbar.superadmin@gmail.com";
  const SUPER_ADMIN_PASSWORD = "demo123";
  const SUPER_ADMIN_NAME = "Super Admin";

  const ADMIN_EMAIL = "akbar.otbkamalotb@gmail.com";
  const ADMIN_PASSWORD = "admin@123";
  const ADMIN_NAME = "Admin User";

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 👑 Super Admin bypass (for demo purposes only)
    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      localStorage.setItem("role", "super_admin");
      localStorage.setItem("email", SUPER_ADMIN_EMAIL);
      localStorage.setItem("name", SUPER_ADMIN_NAME);
      toast({
        title: "Welcome Super Admin 👑",
        description: "Successfully signed in with full administrative privileges!",
      });
      navigate("/admin");
      return;
    }

    // 🔑 Admin bypass (for demo purposes only)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("role", "admin");
      localStorage.setItem("email", ADMIN_EMAIL);
      localStorage.setItem("name", ADMIN_NAME);
      toast({
        title: "Welcome Admin",
        description: "Successfully signed in as Admin!",
      });
      navigate("/admin");
      return;
    }

    // ✅ Normal user login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // ✅ Fetch user details from your custom `users` table using email (not UUID)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, name")
        .eq("email", data.user.email) // ✅ email lookup instead of id
        .single();

      if (!userError && userData) {
        localStorage.setItem("role", userData.role || "user");
        localStorage.setItem("name", userData.name || "User");
      } else {
        // fallback: set default role and name
        localStorage.setItem("role", "user");
        localStorage.setItem("name", data.user.email || "User");
      }

      localStorage.setItem("email", data.user.email || "");

      toast({
        title: "Success",
        description: "Successfully signed in!",
      });

      // ✅ Navigate to dashboard
      navigate("/dashboard");
    }
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "An error occurred during sign in.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  const fillDemoCredentials = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  const handleUserDemoClick = () => {
    toast({
      title: "User Login",
      description: "Please sign up first to create a user account, then login with your credentials.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
    
  <div className="h-30 w-30 rounded-lg p-2 text-primary-foreground flex items-center justify-center">
          <img 
      src="/soundcheckinsight.png" 
      alt="Logo" 
  className="w-[150px] h-[150px] object-contain"
    />
  </div>
</div>

            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your research reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <div className="mt-6 space-y-3">
  <div className="text-center text-sm text-muted-foreground mb-2">
    Quick login Access:
  </div>

  <div className="flex gap-2 justify-center">
    <Button
      variant="outline"
      className="flex-1 border-red-500 text-red-600 "
      onClick={() => fillDemoCredentials(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)}
    >
      Super Admin
    </Button>

    <Button
      variant="outline"
      className="flex-1 border-blue-500 text-blue-600 "
      onClick={() => fillDemoCredentials(ADMIN_EMAIL, ADMIN_PASSWORD)}
    >
      Admin
    </Button>

    <Button
      variant="outline"
      className="flex-1 border-gray-300 text-gray-700"
      onClick={handleUserDemoClick}
    >
      User
    </Button>
  </div>
</div> */}

            <form onSubmit={handleSubmit} className="space-y-3 mt-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="gradient"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* <div className="mt-6 space-y-3">
              <div className="text-center text-sm text-muted-foreground mb-2">
                Quick login options:
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => fillDemoCredentials(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)}
                >
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Super Admin
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => fillDemoCredentials(ADMIN_EMAIL, ADMIN_PASSWORD)}
                >
                  <Shield className="h-4 w-4 text-blue-500" />
                  Admin
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleUserDemoClick}
                >
                  <User className="h-4 w-4 text-green-500" />
                  User
                </Button>
              </div>
            </div> */}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}