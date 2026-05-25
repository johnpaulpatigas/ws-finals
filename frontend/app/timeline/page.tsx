"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { generateICS, downloadFile, CalendarEvent } from "../utils/calendar";
import confetti from "canvas-confetti";

interface Task {
  id: number;
  title: string;
  date: string;
  duration: string;
  category: string;
  icon: string;
  completed: boolean;
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  tasks: Task[];
}

export default function Timeline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("id");
  const { user, token, logout, isLoading: authLoading } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ title: "", duration: "" });
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId || !token) return;

      try {
        const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAssignment(data);
        } else {
          setError("Failed to load assignment details.");
        }
      } catch (err) {
        setError("Something went wrong while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchAssignment();
    }
  }, [assignmentId, token, user]);

  const toggleTask = async (taskId: number, currentStatus: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !currentStatus })
      });

      if (response.ok) {
        setAssignment(prev => {
          if (!prev) return null;
          const newTasks = prev.tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t);
          
          // Trigger confetti if all tasks are now completed
          if (!currentStatus && newTasks.every(t => t.completed)) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#476550', '#7d9d85', '#efeee7']
            });
          }
          
          return {
            ...prev,
            tasks: newTasks
          };
        });
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!token || !confirm("Delete this task?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAssignment(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditFormData({ title: task.title, duration: task.duration });
  };

  const saveEdit = async (taskId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setAssignment(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t)
          };
        });
        setEditingTaskId(null);
      }
    } catch (err) {
      console.error("Failed to save task:", err);
    }
  };

  const handleExportNotion = () => {
    if (!assignment) return;

    const markdown = `# ${assignment.title}\n\n` + 
      assignment.tasks.map(task => `- [${task.completed ? 'x' : ' '}] **${task.title}** (${task.duration}) - ${task.category}`).join('\n');
    
    navigator.clipboard.writeText(markdown);
    alert("Copied to clipboard as Markdown! You can now paste it into Notion.");
  };

  const handleExportCalendar = () => {
    if (!assignment || !assignment.tasks.length) return;

    const events: CalendarEvent[] = assignment.tasks.map(task => {
      const startDate = new Date(task.date);
      // Default to 10:00 AM on the day if only date is provided, 
      // though the DB likely has a full timestamp.
      // If we want to be safe, let's ensure it's a valid date.
      
      const endDate = new Date(startDate);
      
      // Parse duration (e.g., "30 mins", "1 hour")
      const durationMatch = task.duration.match(/(\d+)\s*(min|hour)/);
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        if (unit === 'min') {
          endDate.setMinutes(startDate.getMinutes() + value);
        } else if (unit === 'hour') {
          endDate.setHours(startDate.getHours() + value);
        }
      } else {
        endDate.setMinutes(startDate.getMinutes() + 30); // Default 30 mins
      }

      return {
        title: `${assignment.title}: ${task.title}`,
        description: `Category: ${task.category}\nDuration: ${task.duration}`,
        startDate,
        endDate
      };
    });

    const icsContent = generateICS(events);
    downloadFile(`${assignment.title.replace(/\s+/g, '_')}_tasks.ics`, icsContent, 'text/calendar');
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Oops!</h1>
        <p className="text-on-surface-variant mb-6">{error || "Assignment not found."}</p>
        <button onClick={() => router.push('/')} className="bg-primary text-on-primary px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
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
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/archive">Archive</Link>
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

      {/* SideNavBar (Desktop only) */}
      <aside className="hidden lg:flex flex-col h-full w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant p-6 pt-24">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">BiteSize</h2>
          <p className="text-sm font-medium text-on-surface-variant">Tiny steps, big results.</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all active:scale-[0.98]" href="/">
            <span className="material-symbols-outlined">edit_note</span>
            <span className="text-sm font-medium">Plan</span>
          </Link>
          <Link className="flex items-center gap-3 p-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold transition-all active:scale-[0.98]" href="/archive">
            <span className="material-symbols-outlined">checklist</span>
            <span className="text-sm font-bold">Archive</span>
          </Link>
          <Link className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all active:scale-[0.98]" href="/settings">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>
      </aside>

      <main className="max-w-[720px] mx-auto px-container-padding-mobile md:px-0 py-section-gap w-full lg:ml-[30%] xl:ml-[35%]">
        {/* Progress Header */}
        <div className="sticky top-[73px] bg-background/95 backdrop-blur-sm z-40 py-4 -mx-4 px-4 mb-8 border-b border-outline-variant/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Overall Progress</span>
            <span className="text-xs font-bold text-primary">
              {Math.round((assignment.tasks.filter(t => t.completed).length / assignment.tasks.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${(assignment.tasks.filter(t => t.completed).length / assignment.tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Success Header */}
        <div className="mb-12 text-center md:text-left">
          <div className="flex justify-between items-start">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary-container mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            
            <button 
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${focusMode ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{focusMode ? 'visibility' : 'filter_center_focus'}</span>
              {focusMode ? 'Show All' : 'Focus Mode'}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">We&apos;ve broken it down for you.</h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">Your project <span className="text-primary font-bold">"{assignment.title}"</span> is now in manageable chunks.</p>
        </div>

        {/* Timeline Section */}
        <div className="relative space-y-12">
          {assignment.tasks
            .filter(task => !focusMode || !task.completed)
            .slice(0, focusMode ? 1 : undefined)
            .map((task, index, filteredArray) => (
            <div key={task.id} className="relative pl-10">
              {index !== filteredArray.length - 1 && <div className="timeline-line"></div>}
              <div 
                onClick={() => toggleTask(task.id, task.completed)}
                className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border-2 flex items-center justify-center z-10 cursor-pointer transition-colors ${task.completed ? 'border-primary' : 'border-outline-variant'}`}
              >
                {task.completed && <div className="w-2 h-2 rounded-full bg-primary"></div>}
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl task-card-shadow transition-all group hover:border-primary/30">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-grow">
                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${task.completed ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    
                    {editingTaskId === task.id ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <input 
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-base outline-none focus:border-primary"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(task.id)} className="text-xs font-bold text-primary px-3 py-1 bg-primary-container rounded-md">Save</button>
                          <button onClick={() => setEditingTaskId(null)} className="text-xs font-bold text-on-surface-variant px-3 py-1 bg-surface-container rounded-md">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <h3 className={`text-lg font-bold text-on-surface leading-tight ${task.completed ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!editingTaskId && (
                      <>
                        <button 
                          onClick={() => startEditing(task)}
                          className="text-on-surface-variant hover:text-primary p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit task"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="text-on-surface-variant hover:text-error p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete task"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </>
                    )}
                    <input 
                      className="w-6 h-6 rounded border-outline text-primary focus:ring-primary cursor-pointer ml-2" 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {editingTaskId === task.id ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <input 
                        className="bg-transparent border-none outline-none text-xs font-semibold w-16"
                        value={editFormData.duration}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <span className="text-xs font-semibold">{task.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary-container/30 rounded-full text-secondary">
                    <span className="material-symbols-outlined text-[18px]">{task.icon || 'task_alt'}</span>
                    <span className="text-xs font-semibold">{task.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Export Actions */}
        <section className="mt-section-gap border-t border-outline-variant/30 pt-12">
          <h2 className="text-xl font-bold text-on-surface mb-6 text-center">Ready to get started?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleExportNotion}
              className="flex items-center justify-center gap-2 py-3 px-6 border border-outline text-on-surface rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">ios_share</span>
              <span className="text-sm font-bold">Export to Notion</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-3 px-6 border border-outline text-on-surface rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">download</span>
              <span className="text-sm font-bold">Download PDF</span>
            </button>
            <button 
              onClick={handleExportCalendar}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined">calendar_add_on</span>
              <span className="text-sm font-bold">Add to Calendar</span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer (Mobile/Tablet only) */}
      <footer className="lg:hidden flex flex-col md:flex-row justify-between items-center w-full py-8 px-container-padding-mobile max-w-focus-width mx-auto text-center md:text-left border-t border-outline-variant/30 mt-12">
        <div className="font-bold text-primary mb-4 md:mb-0">BiteSize</div>
        <div className="text-xs font-semibold text-on-surface-variant opacity-70 mb-4 md:mb-0">© 2024 BiteSize Productivity</div>
        <div className="flex gap-6">
          <a className="text-xs font-semibold text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" href="#">Privacy</a>
          <a className="text-xs font-semibold text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" href="#">Terms</a>
          <a className="text-xs font-semibold text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}
