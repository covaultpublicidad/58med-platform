"use client";

import { ThemeToggle } from "./ThemeToggle";
import { Search, MessageSquare, Bell, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserDropdown } from "./UserDropdown";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Brand / Logo Area */}
      <div className="flex items-center gap-2">
        <Link href="/">
          <Image src="/logo.png" alt="58 MED Logo" width={120} height={40} className="h-8 w-auto object-contain cursor-pointer" />
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <Search className="h-5 w-5" />
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <MessageSquare className="h-5 w-5" />
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

        <ThemeToggle />

        <div className="ml-2">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
