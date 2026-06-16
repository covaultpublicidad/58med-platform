"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Users, ChevronLeft, Search, CalendarDays, Droplet, AlertTriangle, Phone, Mail, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  profile_photo_url: string | null;
  blood_type: string | null;
  allergies: string | null;
  appointments_count: number;
  last_appointment: {
    appointment_date: string;
    doctor: { name: string };
  } | null;
}

export default function PacientesPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isStaff = user?.roles?.some((r: any) => r.name === "Médico" || r.name === "Asistente");

  useEffect(() => {
    if (isStaff) {
      fetchPatients();
    }
  }, [isStaff]);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/patients');
      setPatients(res.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(search) || 
             (p.dni && p.dni.toLowerCase().includes(search)) ||
             (p.phone && p.phone.toLowerCase().includes(search));
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" /> Volver al Perfil
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-500" />
            Directorio de Pacientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualiza y gestiona la lista de pacientes registrados.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
            <p className="text-slate-500 mt-4">Cargando pacientes...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No hay pacientes</h3>
            <p className="text-slate-500">No se encontraron pacientes que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map(patient => (
              <Link href={`/dashboard/pacientes/${patient.id}`} key={patient.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-md hover:border-teal-500 transition-all group">
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-900 shadow-sm">
                    {patient.profile_photo_url ? (
                      <img src={patient.profile_photo_url} alt={patient.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                        {patient.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{patient.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      {patient.dni && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> {patient.dni}</span>}
                      {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> {patient.phone}</span>}
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <Mail className="w-3.5 h-3.5"/> <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Droplet className="w-3.5 h-3.5 text-red-400" /> Tipo de Sangre</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{patient.blood_type || 'No especificado'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Alergias</p>
                    <p className="font-semibold text-slate-900 dark:text-white truncate" title={patient.allergies || ''}>{patient.allergies || 'Ninguna'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-500">
                    Total de citas: <strong className="text-slate-900 dark:text-white">{patient.appointments_count}</strong>
                  </span>
                  {patient.last_appointment && (
                    <span className="text-slate-500 text-right">
                      Última: <strong className="text-slate-900 dark:text-white">{format(parseISO(patient.last_appointment.appointment_date), 'dd MMM yyyy', { locale: es })}</strong>
                      {user?.roles?.some((r: any) => r.name === "Asistente") && (
                        <span className="block text-xs">Dr. {patient.last_appointment.doctor.name}</span>
                      )}
                    </span>
                  )}
                </div>

              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
