// pages/profile.tsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
// import Head from "next/head";

interface UserProfile {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  name: string;
  created_at: string;
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = "/login";
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        throw error;
      }

      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
        });
      }
    } catch (error: any) {
      alert("Error loading profile: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
        })
        .eq("id", user?.id);

      if (error) {
        throw error;
      }

      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) {
          throw emailError;
        }
      }

      alert("Profile updated successfully!");
      getProfile();
    } catch (error: any) {
      alert("Error updating profile: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        throw error;
      }

      alert("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      alert("Error updating password: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", user?.id);

      if (userError) {
        throw userError;
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(
        user?.id || ""
      );

      if (authError) {
        throw authError;
      }

      alert("Account deleted successfully!");
      window.location.href = "/";
    } catch (error: any) {
      alert("Error deleting account: " + error.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* <Head>
        <title>User Profile</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head> */}

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Profile</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8">
          <div className="hidden md:block">
            <h1 className="text-2xl md:text-3xl font-bold">User Profile</h1>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm md:text-base">
              {user?.role === "super_admin" && (
                <span className="text-yellow-500">👑</span>
              )}
              {user?.role === "admin" && (
                <span className="text-blue-500">🛡️</span>
              )}
              {user?.role === "user" && (
                <span className="text-green-500">👤</span>
              )}
              <span className="capitalize">{user?.role?.replace("_", " ")}</span>
            </div>
            <button 
              className="px-3 py-1 md:px-4 md:py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-sm md:text-base"
              onClick={() => window.location.href = "/dashboard"}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">Manage your account settings and preferences</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation - Mobile */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white rounded-lg shadow p-4">
              <nav className="space-y-2">
                <button
                  className={`w-full flex items-center gap-2 p-3 rounded-lg text-left ${activeSection === "profile" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setActiveSection("profile");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>👤</span>
                  Profile Information
                </button>
                <button
                  className={`w-full flex items-center gap-2 p-3 rounded-lg text-left ${activeSection === "password" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setActiveSection("password");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>🔑</span>
                  Change Password
                </button>
                <button
                  className={`w-full flex items-center gap-2 p-3 rounded-lg text-left ${activeSection === "danger" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                  onClick={() => {
                    setActiveSection("danger");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>⚠️</span>
                  Danger Zone
                </button>
              </nav>
            </div>
          )}

          {/* Sidebar Navigation - Desktop */}
          <div className="hidden md:block md:col-span-1 bg-white rounded-lg shadow p-4">
            <nav className="space-y-2">
              <button
                className={`w-full flex items-center gap-2 p-3 rounded-lg text-left ${activeSection === "profile" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                onClick={() => setActiveSection("profile")}
              >
                <span>👤</span>
                Profile Information
              </button>
              <button
                className={`w-full flex items-center gap-2 p-3 rounded-lg text-left ${activeSection === "password" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                onClick={() => setActiveSection("password")}
              >
                <span>🔑</span>
                Change Password
              </button>
              <button
                className={`w-full flex items-center gap-2 p-3 rounded-lg text-left ${activeSection === "danger" ? "bg-blue-50" : "hover:bg-gray-100"}`}
                onClick={() => setActiveSection("danger")}
              >
                <span>⚠️</span>
                Danger Zone
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Profile Information Section */}
            {activeSection === "profile" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 md:p-6 border-b">
                  <h2 className="text-lg md:text-xl font-semibold">Profile Information</h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Update your account details and contact information
                  </p>
                </div>
                <div className="p-4 md:p-6">
                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="block font-medium text-sm md:text-base">Email Address</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm md:text-base">📧</span>
                        <input
                          id="email"
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10 text-sm md:text-base"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="name" className="block font-medium text-sm md:text-base">Full Name</label>
                      <input
                        id="name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm md:text-base"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-medium text-sm md:text-base">Account Role</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-md text-sm md:text-base">
                        {user?.role === "super_admin" && <span className="text-yellow-500">👑</span>}
                        {user?.role === "admin" && <span className="text-blue-500">🛡️</span>}
                        {user?.role === "user" && <span className="text-green-500">👤</span>}
                        <span className="capitalize font-medium">{user?.role?.replace("_", " ")}</span>
                        <span className="text-xs md:text-sm text-gray-500 ml-2 hidden sm:inline">
                          {user?.role !== "super_admin" 
                            ? "Contact a Super Admin to change your role" 
                            : "You have full administrative privileges"}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 sm:hidden">
                        {user?.role !== "super_admin" 
                          ? "Contact a Super Admin to change your role" 
                          : "You have full administrative privileges"}
                      </p>
                    </div>

                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Change Password Section */}
            {activeSection === "password" && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 md:p-6 border-b">
                  <h2 className="text-lg md:text-xl font-semibold">Change Password</h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Update your password to keep your account secure
                  </p>
                </div>
                <div className="p-4 md:p-6">
                  <form onSubmit={updatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="block font-medium text-sm md:text-base">Current Password</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm md:text-base">🔒</span>
                        <input
                          id="currentPassword"
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10 text-sm md:text-base"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block font-medium text-sm md:text-base">New Password</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm md:text-base">🔒</span>
                        <input
                          id="newPassword"
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10 text-sm md:text-base"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block font-medium text-sm md:text-base">Confirm New Password</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-sm md:text-base">🔒</span>
                        <input
                          id="confirmPassword"
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10 text-sm md:text-base"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Danger Zone Section */}
            {activeSection === "danger" && (
              <div className="bg-white rounded-lg shadow border border-red-200">
                <div className="p-4 md:p-6 border-b">
                  <h2 className="text-lg md:text-xl font-semibold text-red-600">Danger Zone</h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    Irreversible and destructive actions
                  </p>
                </div>
                <div className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div className="p-4 border border-red-300 rounded-lg">
                      <h3 className="font-medium text-red-700 mb-2 text-sm md:text-base">Delete Account</h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button 
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm md:text-base"
                        onClick={deleteAccount}
                      >
                        🗑️ Delete Account
                      </button>
                    </div>

                    {/* Admin-only actions */}
                    {(user?.role === "super_admin" || user?.role === "admin") && (
                      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <h3 className="font-medium text-blue-800 mb-2 text-sm md:text-base">🛡️ Admin Actions</h3>
                        <p className="text-xs md:text-sm text-blue-600 mb-4">
                          Administrative functions (visible only to admins)
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button className="px-3 py-2 sm:py-1 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 text-sm">
                            Manage Users
                          </button>
                          <button className="px-3 py-2 sm:py-1 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 text-sm">
                            System Settings
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}