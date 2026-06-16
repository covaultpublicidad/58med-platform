"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, Calendar as CalendarIcon, MapPin, Share2, ChevronLeft, ArrowLeft, Phone, Mail } from "lucide-react";
import axios from "@/lib/axios";

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialty: string | null;
  profile_photo_url?: string;
  cover_photo_url?: string;
  bio?: string;
  tenant: {
    id: number;
    name: string;
    address?: string;
  } | null;
}

export default function PublicDoctorProfile() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchDoctor();
    }
  }, [params.id]);

  const fetchDoctor = async () => {
    try {
      const res = await axios.get(`/api/directory/${params.id}`);
      setDoctor(res.data);
    } catch (error) {
      console.error("Error fetching doctor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agenda tu cita con ${doctor?.name}`,
          text: `Reserva tu consulta médica con ${doctor?.name} en 58 MED.`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA4A5]"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 text-center">
        <User className="h-20 w-20 text-slate-300 mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Médico no encontrado</h1>
        <p className="text-slate-500 mb-8">El perfil que buscas no existe o ha sido eliminado.</p>
        <Link href="/" className="inline-flex items-center text-[#2FA4A5] hover:text-[#258a8a] font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Directorio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Navigation Bar Minimalista */}
      <nav className="bg-white/80 backdrop-blur-md dark:bg-slate-900/80 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <Image src="/logo.png" alt="58 MED Logo" width={100} height={40} className="h-8 w-auto object-contain" />
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <Link href="/" className="hidden sm:flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Directorio
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard" className="flex items-center space-x-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                   {user.profile_photo_url ? (
                     <img src={user.profile_photo_url} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                   ) : (
                     <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                       <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                     </div>
                   )}
                   <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{user.name}</span>
                </Link>
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

      <main className="max-w-5xl mx-auto">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 w-full bg-slate-200 dark:bg-slate-800 relative">
          {doctor.cover_photo_url ? (
            <img src={doctor.cover_photo_url} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-teal-500/20 to-blue-500/20 dark:from-teal-900/40 dark:to-blue-900/40 flex items-center justify-center">
               <span className="text-slate-400 dark:text-slate-600 font-medium">Portada del Perfil</span>
            </div>
          )}
        </div>

        {/* Profile Card Overlay */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 -mt-20 md:-mt-24 relative p-6 md:p-10 mb-8">
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start text-center md:text-left">
              
              {/* Profile Photo */}
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white dark:border-slate-900 shadow-md flex-shrink-0 -mt-20 md:-mt-24 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                {doctor.profile_photo_url ? (
                  <img src={doctor.profile_photo_url} alt={doctor.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-1/2 w-1/2 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{doctor.name}</h1>
                <p className="text-xl text-[#2FA4A5] font-medium mb-3">{doctor.specialty || "Médico General"}</p>
                <div className="flex items-center justify-center md:justify-start text-slate-500 dark:text-slate-400">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="text-lg">{doctor.tenant?.name || "Consultorio Independiente"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Link 
                  href={`/book/${doctor.id}`} 
                  className="flex-1 md:flex-none flex items-center justify-center px-6 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-[#2FA4A5] hover:bg-[#258a8a] transition-all"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Agendar Cita
                </Link>
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                  title="Compartir Perfil"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sobre el Especialista */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sobre el Especialista</h3>
               <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                 {doctor.bio || `${doctor.name} es un profesional de la salud dedicado a brindar la mejor atención. \nAgenda una cita fácilmente usando nuestro calendario en línea para garantizar tu espacio.`}
               </p>
            </div>

            {/* Información de Contacto */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Información de Contacto</h3>
               <div className="space-y-6">
                 
                 {doctor.phone && (
                   <div className="flex items-start gap-4">
                     <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-full flex-shrink-0">
                       <Phone className="h-5 w-5 text-[#2FA4A5]" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Teléfono</p>
                       <a href={`tel:${doctor.phone}`} className="text-slate-900 dark:text-white font-medium hover:text-[#2FA4A5] transition-colors">{doctor.phone}</a>
                     </div>
                   </div>
                 )}

                 <div className="flex items-start gap-4">
                   <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-full flex-shrink-0">
                     <Mail className="h-5 w-5 text-[#2FA4A5]" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Correo Electrónico</p>
                     <a href={`mailto:${doctor.email}`} className="text-slate-900 dark:text-white font-medium hover:text-[#2FA4A5] transition-colors break-all">{doctor.email}</a>
                   </div>
                 </div>

                 {doctor.tenant && (
                   <div className="flex items-start gap-4">
                     <div className="bg-teal-50 dark:bg-teal-900/30 p-3 rounded-full flex-shrink-0">
                       <MapPin className="h-5 w-5 text-[#2FA4A5]" />
                     </div>
                     <div>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ubicación</p>
                       <p className="text-slate-900 dark:text-white font-medium">{doctor.tenant.name}</p>
                       {doctor.tenant.address && (
                         <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{doctor.tenant.address}</p>
                       )}
                     </div>
                   </div>
                 )}

               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
