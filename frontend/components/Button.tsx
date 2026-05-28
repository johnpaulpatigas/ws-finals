"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
}

export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  loading = false, 
  icon,
  className = "",
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-on-primary shadow-md hover:shadow-lg hover:opacity-90",
    secondary: "bg-secondary-container text-on-secondary-container",
    outline: "border border-outline text-on-surface hover:bg-surface-container-high"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin">sync</span>
      ) : icon ? (
        <span className="material-symbols-outlined">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
