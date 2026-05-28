"use client";

import Link from "next/link";
import { useAuth } from "../app/context/AuthContext";

interface HeaderProps {
  showNav?: boolean;
}

export default function Header({ showNav = true }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop py-4 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-primary">BiteSize</Link>
        {showNav && user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/">Focus</Link>
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/archive">Archive</Link>
            <Link className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/settings">Settings</Link>
          </nav>
        )}
      </div>
      
      {user ? (
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
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">Log In</Link>
          <Link href="/register" className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all">Sign Up</Link>
        </div>
      )}
    </header>
  );
}
