"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Settings, Bell, MessageSquare, LogOut, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function UserDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors focus:outline-none"
      >
        <div className="text-right hidden sm:block">
           <span className="text-sm font-semibold text-slate-900 dark:text-white block leading-tight">{user?.name || "Cargando..."}</span>
           <span className="text-xs text-slate-500 dark:text-slate-400">{user?.roles?.[0]?.name || "Usuario"}</span>
        </div>
        <div className="h-9 w-9 rounded-full border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {user?.profile_photo_url ? (
            <img src={user.profile_photo_url} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-slate-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
             <div className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
               {user?.profile_photo_url ? (
                 <img src={user.profile_photo_url} alt={user.name} className="h-full w-full object-cover" />
               ) : (
                 <User className="h-5 w-5 text-slate-500" />
               )}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
             </div>
          </div>

          <div className="p-2 space-y-1">
            {user?.roles?.some(r => r.name === "Asistente") ? (
              <Link 
                href="/dashboard" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Users className="h-4 w-4 text-slate-400" /> Dashboard
              </Link>
            ) : user?.roles?.some(r => r.name === "Médico") ? (
              <Link 
                href={`/medico/${user?.id}`} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" /> Mi Perfil Público
              </Link>
            ) : (
              <Link 
                href="/dashboard/perfil" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" /> Mi Perfil
              </Link>
            )}
            
            {user?.roles?.some(r => r.name === "Médico") && (
               <Link 
                 href="/dashboard/configuracion" 
                 onClick={() => setIsOpen(false)}
                 className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <Settings className="h-4 w-4 text-slate-400" /> Configuración
               </Link>
            )}

            <Link 
              href="/dashboard/notificaciones" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-4 w-4 text-slate-400" /> Notificaciones
            </Link>
            <Link 
              href="/dashboard/mensajes" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-slate-400" /> Mensajes
            </Link>
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Cerrar Sesión
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
