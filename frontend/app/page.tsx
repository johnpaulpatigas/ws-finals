"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    workingDays: "5",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate || !token) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          dueDate: formData.dueDate,
          workingDays: formData.workingDays,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/timeline?id=${data.id}`);
      } else {
        console.error("Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-hanken">
      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop py-4 max-w-focus-width mx-auto sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-primary">BiteSize</span>
          <nav className="hidden md:flex items-center gap-6">
            <Link className="text-primary border-b-2 border-primary font-bold pb-1 text-sm hover:text-primary/80 transition-colors" href="/">Focus</Link>
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/archive">Archive</Link>
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/settings">Settings</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface-variant hidden sm:block">
            {user.name}
          </span>
          <button 
            onClick={logout}
            className="text-on-surface-variant flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-colors"
            title="Log Out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center px-container-padding-mobile py-section-gap">
        <div className="w-full max-w-[720px] mx-auto text-center">
          {/* Hero Heading */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-on-surface mb-4 tracking-tight">Focus on one big thing.</h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-[500px] mx-auto leading-relaxed">
              Transform your overwhelming assignments into tiny, manageable steps.
            </p>
          </div>

          {/* Centralized Form Component */}
          <div className="bg-surface-container-low border border-outline-variant p-8 md:p-12 rounded-2xl shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 text-left">
              {/* Field 1: Assignment Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-primary ml-1" htmlFor="assignment">What is the assignment?</label>
                <input 
                  className="w-full bg-surface-container-low border-none focus:bg-white focus:ring-2 focus:ring-primary rounded-xl px-4 py-4 text-base transition-all shadow-inner text-on-surface placeholder:text-on-surface-variant/50 outline-none" 
                  id="assignment" 
                  placeholder="e.g., Write a 5-page history paper on the Cold War" 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field 2: Date Picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-primary ml-1" htmlFor="due-date">When is it due?</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-surface-container-low border-none focus:bg-white focus:ring-2 focus:ring-primary rounded-xl px-4 py-4 text-base transition-all shadow-inner text-on-surface outline-none" 
                      id="due-date" 
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Field 3: Working Days Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-primary ml-1" htmlFor="days-count">Working days per week</label>
                  <select 
                    className="w-full bg-surface-container-low border-none focus:bg-white focus:ring-2 focus:ring-primary rounded-xl px-4 py-4 text-base transition-all shadow-inner text-on-surface outline-none appearance-none cursor-pointer" 
                    id="days-count"
                    value={formData.workingDays}
                    onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <option key={day} value={day}>{day} day{day > 1 ? 's' : ''} a week</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-4">
                <button 
                  className="w-full bg-primary text-on-primary py-5 px-8 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70" 
                  type="submit"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">{loading ? 'sync' : 'bolt'}</span>
                  {loading ? 'Breaking it down...' : 'Break it down'}
                </button>
              </div>
            </form>
          </div>

          {/* Instructional Cards */}
          <div className="mt-section-gap grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 border border-outline-variant rounded-xl bg-surface flex flex-col gap-3">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              <h3 className="text-lg font-bold text-on-surface">AI Chunking</h3>
              <p className="text-base text-on-surface-variant leading-normal">We split your massive goal into 15-minute micro-tasks.</p>
            </div>
            <div className="p-6 border border-outline-variant rounded-xl bg-surface flex flex-col gap-3">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h3 className="text-lg font-bold text-on-surface">Smart Scheduling</h3>
              <p className="text-base text-on-surface-variant leading-normal">Only work when you can. We adjust to your weekly capacity.</p>
            </div>
            <div className="p-6 border border-outline-variant rounded-xl bg-surface flex flex-col gap-3">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h3 className="text-lg font-bold text-on-surface">Zero Overwhelm</h3>
              <p className="text-base text-on-surface-variant leading-normal">Focus only on the current task. Hide the rest until it&apos;s time.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-transparent border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center w-full py-8 px-container-padding-mobile max-w-focus-width mx-auto text-center md:text-left">
        <div className="mb-4 md:mb-0">
          <span className="text-xs font-semibold text-on-surface-variant opacity-70">© 2024 BiteSize Productivity</span>
        </div>
        <div className="flex gap-8">
          <a className="text-on-surface-variant opacity-70 hover:opacity-100 text-xs font-semibold transition-opacity" href="#">Privacy</a>
          <a className="text-on-surface-variant opacity-70 hover:opacity-100 text-xs font-semibold transition-opacity" href="#">Terms</a>
          <a className="text-on-surface-variant opacity-70 hover:opacity-100 text-xs font-semibold transition-opacity" href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}
