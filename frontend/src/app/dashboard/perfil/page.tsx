"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { User } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      {/* Header Profile Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
        <div className="h-48 bg-slate-200 dark:bg-slate-800 w-full relative">
          {user?.cover_photo_url && (
            <img src={user.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex flex-col items-center justify-center -mt-16 pb-8">
          <div className="h-32 w-32 bg-slate-100 dark:bg-slate-700 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center relative z-10 shadow-sm overflow-hidden">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="h-16 w-16 text-slate-300 dark:text-slate-500" />
            )}
            <div className="absolute top-2 right-2 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 z-20"></div>
          </div>
          <h2 className="text-3xl font-bold mt-4 text-slate-900 dark:text-white">{user?.name || "Cargando..."}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configuración de Perfil</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-transparent">
        <ProfileTab />
      </div>
    </div>
  );
}
