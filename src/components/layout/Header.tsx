import { Button } from "@/components/ui/button";
import { FileSearch, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface HeaderProps {
  isAuthenticated?: boolean;
  userRole?: "admin" | "user";
  onLogout?: () => void;
}

export function Header({ isAuthenticated = false, userRole, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
      <Link to="/" className="flex flex-col items-center space-y-1">
  {/* Image above */}
  <img
    src="/soundcheckinsight.png"
    alt="Logo"
    className="h-10 w-50 text-primary"
  />
  
  {/* Existing icon */}
  {/* <FileSearch className="h-6 w-6 text-primary" /> */}
  
  {/* Text */}
  {/* <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
    Deep Research
  </span> */}
</Link>


        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link to="/new-report" className="text-sm font-medium transition-colors hover:text-primary">
                New Report
              </Link>
              {userRole === "admin" && (
                <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary">
                  Admin Panel
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* <Link to="#" className="text-sm font-medium transition-colors hover:text-primary">
                Features
              </Link> */}
              {/* <Link to="#" className="text-sm font-medium transition-colors hover:text-primary">
                Pricing
              </Link> */}
              <Link to="/login">
                <Button variant="gradient" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="gradient" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="container py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/new-report" className="block py-2 text-sm font-medium">
                  New Report
                </Link>
                {userRole === "admin" && (
                  <Link to="/admin" className="block py-2 text-sm font-medium">
                    Admin Panel
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/features" className="block py-2 text-sm font-medium">
                  Features
                </Link>
                <Link to="/pricing" className="block py-2 text-sm font-medium">
                  Pricing
                </Link>
                <Link to="/login" className="block py-2">
                  <Button variant="ghost" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="block py-2">
                  <Button variant="gradient" size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}