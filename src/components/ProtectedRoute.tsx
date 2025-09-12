// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: string; // Optional: specific role required
}) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate("/login");
          return;
        }
        
        // Get user role from localStorage or database
        let userRole = localStorage.getItem("role");
        
        if (!userRole) {
          // Fetch from database if not in localStorage
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
            
          if (userError || !userData) {
            console.error("Error fetching user data:", userError);
            navigate("/login");
            return;
          }
          
          userRole = userData.role;
          localStorage.setItem("role", userRole);
        }
        
        // Check if user has required role (if specified)
        if (!requiredRole || userRole === requiredRole || userRole === "super_admin") {
          setHasAccess(true);
        } else {
          // User doesn't have required role
          navigate("/dashboard"); // Redirect to dashboard instead of login
        }
        
      } catch (error) {
        console.error("Error in ProtectedRoute:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [navigate, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return hasAccess ? <>{children}</> : null;
}