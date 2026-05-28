"use client";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
    </div>
  );
}
