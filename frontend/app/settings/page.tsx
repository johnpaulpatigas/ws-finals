"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function Settings() {
  const router = useRouter();
  const { user, token, logout, updateUser, isLoading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Endpoint for updating profile (to be implemented)
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUserData = await response.json();
        updateUser(updatedUserData);
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to update profile." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token || !confirm("PERMANENT ACTION: Are you sure you want to delete your account? This will erase all your assignments and tasks forever.")) return;
    
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Your account has been deleted.");
        logout();
      } else {
        alert("Failed to delete account.");
      }
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && !formData.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-hanken">
      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop py-4 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-primary">BiteSize</span>
          <nav className="hidden md:flex items-center gap-6">
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/">Focus</Link>
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/archive">Archive</Link>
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/settings">Settings</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface-variant hidden sm:block">
            {user?.name}
          </span>
          <button 
            onClick={logout}
            className="text-on-surface-variant flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-container-padding-mobile md:px-0 py-12 w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Settings</h1>
          <p className="text-on-surface-variant">Manage your account and preferences.</p>
        </div>

        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-on-surface mb-6">Profile Information</h2>
          
          {message.text && (
            <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-primary ml-1" htmlFor="name">Full Name</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-base transition-all text-on-surface outline-none" 
                id="name" 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-primary ml-1" htmlFor="email">Email Address</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-base transition-all text-on-surface outline-none" 
                id="email" 
                type="email"
                value={formData.email}
                disabled
              />
              <p className="text-xs text-on-surface-variant ml-1">Email cannot be changed yet.</p>
            </div>

            <div className="mt-4">
              <button 
                className="w-full bg-primary text-on-primary py-4 px-8 rounded-xl text-lg font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70" 
                type="submit"
                disabled={loading}
              >
                {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-error mb-4">Danger Zone</h2>
          <div className="border border-error/30 rounded-2xl p-6 bg-error-container/5">
            <p className="text-sm text-on-surface-variant mb-6">Once you delete your account, there is no going back. Please be certain.</p>
            <button 
              onClick={handleDeleteAccount}
              disabled={loading}
              className="text-error border border-error px-6 py-3 rounded-xl font-bold hover:bg-error hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
