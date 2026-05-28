"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data, data.token);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-hanken">
      <header className="bg-surface border-b border-outline-variant flex justify-center items-center w-full py-4">
        <span className="text-xl font-bold text-primary">BiteSize</span>
      </header>

      <main className="flex-grow flex items-center justify-center px-container-padding-mobile py-section-gap">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-on-surface mb-2">Welcome Back</h1>
            <p className="text-on-surface-variant">Log in to keep track of your assignments</p>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-8 rounded-2xl shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-primary ml-1" htmlFor="email">Email</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant focus:bg-white focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 text-base transition-all outline-none" 
                  id="email" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-primary ml-1" htmlFor="password">Password</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant focus:bg-white focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 text-base transition-all outline-none" 
                  id="password" 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button 
                className="w-full bg-primary text-on-primary py-4 px-6 rounded-xl text-lg font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-2" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  'Log In'
                )}
              </button>

              <div className="text-center mt-2">
                <p className="text-sm text-on-surface-variant">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-primary font-bold hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
