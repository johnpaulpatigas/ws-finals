"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function Register() {
  const [name, setName] = useState("");
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
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data, data.token);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-hanken">
      <Header showNav={false} />

      <main className="flex-grow flex items-center justify-center px-container-padding-mobile py-section-gap">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-on-surface mb-2">Create Account</h1>
            <p className="text-on-surface-variant">Start breaking down your goals today</p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-primary ml-1" htmlFor="name">Full Name</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant focus:bg-white focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 text-base transition-all outline-none" 
                  id="name" 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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

              <Button 
                className="w-full py-4 mt-2" 
                size="lg"
                type="submit"
                loading={loading}
              >
                Sign Up
              </Button>

              <div className="text-center mt-2">
                <p className="text-sm text-on-surface-variant">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-bold hover:underline">
                    Log In
                  </Link>
                </p>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
