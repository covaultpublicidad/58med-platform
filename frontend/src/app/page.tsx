"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Search, LayoutGrid, List as ListIcon, User, Calendar as CalendarIcon, MapPin } from "lucide-react";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { UserDropdown } from "@/components/UserDropdown";

interface Doctor {
  id: number;
  name: string;
  specialty: string | null;
  profile_photo_url?: string;
  tenant: {
    id: number;
    name: string;
  } | null;
}

export default function PublicDirectory() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, [searchQuery]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/directory", {
        params: { search: searchQuery },
      });
      setDoctors(res.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Image src="/logo.png" alt="58 MED Logo" width={100} height={40} className="h-8 w-auto object-contain" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center ml-4">
                  <UserDropdown />
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#2FA4A5] transition-colors">
                    Ingresar
                  </Link>
                  <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#2FA4A5] hover:bg-[#258a8a] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2FA4A5]">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header & Search */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Directorio Médico</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">Encuentra a tu especialista ideal y agenda tu cita al instante.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                title="Vista Lista"
              >
                <ListIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o especialidad..."
              className="block w-full pl-11 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl leading-5 bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2FA4A5] focus:border-[#2FA4A5] transition-all text-lg shadow-sm"
            />
          </div>
        </div>

        {/* Directory List/Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA4A5]"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-900 dark:text-white">No se encontraron médicos</h3>
            <p className="text-slate-500 mt-2">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
            {doctors.map((doctor) => (
              <Link key={doctor.id} href={`/medico/${doctor.id}`} className="block group">
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${viewMode === "list" ? "flex flex-row items-center p-4 gap-6" : "flex flex-col p-6 items-center text-center"}`}>
                  
                  <div className={`flex-shrink-0 ${viewMode === "list" ? "h-20 w-20" : "h-32 w-32 mb-6"}`}>
                    {doctor.profile_photo_url ? (
                      <img src={doctor.profile_photo_url} alt={doctor.name} className="h-full w-full rounded-full object-cover border-4 border-slate-50 dark:border-slate-800 shadow-sm group-hover:border-teal-50 transition-colors" />
                    ) : (
                      <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-slate-50 dark:border-slate-800 shadow-sm group-hover:border-teal-50 transition-colors">
                        <User className="h-1/2 w-1/2 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className={viewMode === "list" ? "flex-1 min-w-0" : "w-full"}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate mb-1 group-hover:text-[#2FA4A5] transition-colors">{doctor.name}</h3>
                    <p className="text-[#2FA4A5] font-medium mb-3 truncate">{doctor.specialty || "Médico General"}</p>
                    
                    <div className={`flex items-center text-slate-500 dark:text-slate-400 text-sm ${viewMode === "list" ? "" : "justify-center"}`}>
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{doctor.tenant?.name || "Consultorio Independiente"}</span>
                    </div>
                  </div>
                  
                  {viewMode === "list" && (
                     <div className="ml-4 flex-shrink-0 hidden sm:block">
                        <span className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 group-hover:bg-[#2FA4A5] group-hover:text-white group-hover:border-transparent transition-all">
                          Ver Perfil
                        </span>
                     </div>
                  )}

                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">© 2026 58 MED. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
