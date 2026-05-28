"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface-container-low border border-outline-variant p-8 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}
