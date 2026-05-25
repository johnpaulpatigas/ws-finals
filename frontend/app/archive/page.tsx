"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

interface Task {
  id: number;
  completed: boolean;
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  createdAt: string;
  tasks: Task[];
}

export default function Archive() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!token) return;

      try {
        const response = await fetch("http://localhost:5000/api/assignments", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
        } else {
          setError("Failed to load your assignments.");
        }
      } catch (err) {
        setError("Something went wrong while fetching your data.");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchAssignments();
    }
  }, [token, user]);

  const handleDeleteAssignment = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Prevent navigation to timeline
    e.stopPropagation();

    if (!token || !confirm("Are you sure you want to delete this assignment and all its tasks?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/assignments/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id));
      } else {
        alert("Failed to delete assignment.");
      }
    } catch (err) {
      console.error("Error deleting assignment:", err);
      alert("Something went wrong while deleting.");
    }
  };

  if (authLoading || (user && loading)) {
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
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/">Focus</Link>
            <Link className="text-primary border-b-2 border-primary font-bold pb-1 text-sm hover:text-primary/80 transition-colors" href="/archive">Archive</Link>
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

      <main className="max-w-[800px] mx-auto px-container-padding-mobile md:px-0 py-12 w-full">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Your Assignments</h1>
          <p className="text-on-surface-variant">Track your progress and stay on top of your goals.</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {assignments.length === 0 && !loading ? (
          <div className="text-center py-20 bg-surface-container-low border border-dashed border-outline-variant rounded-3xl">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">folder_open</span>
            <h2 className="text-xl font-bold text-on-surface">No assignments yet</h2>
            <p className="text-on-surface-variant mb-8">Ready to break down your first big project?</p>
            <Link href="/" className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-bold shadow-lg">
              Start Now
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const completedTasks = assignment.tasks.filter(t => t.completed).length;
              const totalTasks = assignment.tasks.length;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              
              return (
                <Link 
                  key={assignment.id} 
                  href={`/timeline?id=${assignment.id}`}
                  className="group bg-surface-container-low border border-outline-variant p-6 rounded-2xl hover:border-primary/50 transition-all active:scale-[0.99] flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Due {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {progress === 100 && (
                        <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{assignment.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Created on {new Date(assignment.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 min-w-[140px]">
                    <div className="flex justify-between w-full md:justify-end gap-4 items-center">
                      <span className="text-xs font-bold text-on-surface-variant">
                        {completedTasks}/{totalTasks} tasks
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-outline-variant h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteAssignment(e, assignment.id)}
                      className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Assignment"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                    <div className="hidden md:block text-outline group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
