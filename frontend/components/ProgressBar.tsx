"use client";

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label = "Overall Progress" }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="py-4 -mx-4 px-4 mb-8 border-b border-outline-variant/30">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold text-primary">
          {Math.round(clampedProgress)}%
        </span>
      </div>
      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
    </div>
  );
}
