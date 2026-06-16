"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, 
  CalendarDays, 
  Settings, 
  Users, 
  LogOut,
  Stethoscope,
  ShieldCheck,
  User,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isDoctor = user?.roles?.some(r => r.name === "Médico");
  const isPatient = user?.roles?.some(r => r.name === "Paciente");
  const isAssistant = user?.roles?.some(r => r.name === "Asistente");

  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        if (isDoctor) {
          const res = await axios.get('/api/approvals/pending');
          const count = (res.data.medical_records?.length || 0) + 
                        (res.data.prescriptions?.length || 0) + 
                        (res.data.medical_reports?.length || 0) + 
                        (res.data.fragment_requests?.length || 0);
          setPendingApprovals(count);
        } else if (isPatient) {
          const res = await axios.get('/api/fragments/patient-requests');
          setPendingApprovals(res.data.length || 0);
        }
      } catch (e) {
        console.error("Error fetching notifications", e);
      }
    };

    if (user) {
      fetchPendingCounts();
      // Optional: Polling every 1 minute
      const interval = setInterval(fetchPendingCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [user, isDoctor, isPatient]);

  const allLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Users, roles: ["Médico", "Asistente"] },
    { name: "Mi Perfil", href: "/dashboard/perfil", icon: User, roles: ["Ambos", "Asistente", "Paciente"] },
    { name: "Agendar Cita", href: "/dashboard/agendar", icon: Calendar, roles: ["Médico", "Asistente"] },
    { name: "Buscar Médico", href: "/", icon: Stethoscope, roles: ["Paciente"] },
    { name: "Mi Historial", href: "/dashboard/mi-historial", icon: ShieldCheck, roles: ["Paciente"] },
    { name: "Pacientes", href: "/dashboard/pacientes", icon: Users, roles: ["Médico", "Asistente"] },
    { name: "Gestionar Citas", href: "/dashboard/citas", icon: CalendarDays, roles: ["Médico", "Asistente"] },
    { name: "Facturación", href: "/dashboard/facturacion", icon: DollarSign, roles: ["Médico", "Asistente"] },
    { name: "Mis Asistentes", href: "/dashboard/asistentes", icon: Users, roles: ["Médico"] },
    { name: "Aprobaciones", href: "/dashboard/aprobaciones", icon: ShieldCheck, roles: ["Médico"], badge: pendingApprovals },
    { name: "Permisos de Acceso", href: "/dashboard/permisos", icon: ShieldCheck, roles: ["Paciente"], badge: pendingApprovals },
    { name: "Horarios", href: "/dashboard/configuracion", icon: Settings, roles: ["Asistente"] }, // Redirigiremos a config medica internamente
    { name: "Config. Médica", href: "/dashboard/configuracion", icon: Settings, roles: ["Médico"] },
    { name: "Mis Citas Médicas", href: "/dashboard/citas", icon: CalendarDays, roles: ["Paciente"] },
  ];

  const links = allLinks.filter(link => {
    if (link.roles.includes("Ambos")) return true;
    if (isDoctor && link.roles.includes("Médico")) return true;
    if (isPatient && link.roles.includes("Paciente")) return true;
    if (isAssistant && link.roles.includes("Asistente")) return true;
    return false;
  });

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden md:flex">
      <div className="py-6 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          if (link.name === "Facturación" && user?.tenant && user.tenant.billing_enabled === false) {
            return null;
          }
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
                isActive 
                  ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20" 
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {link.name}
              </div>
              {link.badge && link.badge > 0 ? (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="p-6">
        <button onClick={logout} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full">
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
