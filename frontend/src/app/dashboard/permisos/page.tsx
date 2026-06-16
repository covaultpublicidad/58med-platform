"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { ShieldCheck, CheckCircle, XCircle, Activity, ShieldAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function PermisosPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isPatient = user?.roles?.some((r: any) => r.name === "Paciente");

  useEffect(() => {
    if (isPatient) {
      fetchRequests();
    } else {
      setIsLoading(false);
    }
  }, [isPatient]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/fragments/patient-requests");
      setRequests(res.data || []);
    } catch (error) {
      console.error("Error fetching patient requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await axios.patch(`/api/fragments/patient-requests/${id}/approve`, { status });
      alert(status === 'approved' ? 'Acceso concedido exitosamente.' : 'Solicitud rechazada.');
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Error al procesar la solicitud.");
    }
  };

  if (!isPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">Esta sección es exclusiva para el control de privacidad de pacientes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-teal-500" />
          Permisos de Acceso
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gestiona qué médicos pueden ver tu expediente clínico generado por otros especialistas.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Todo al día</h3>
          <p className="text-slate-500">No tienes solicitudes pendientes de aprobación.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                    Solicitud de Acceso a Expediente
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    El/La profesional <strong className="text-slate-900 dark:text-white">{req.requester?.name}</strong> ha solicitado acceso a tus documentos médicos creados por el/la profesional <strong className="text-slate-900 dark:text-white">{req.owner?.name}</strong>.
                  </p>
                  <span className="text-xs text-slate-500 mt-2 block">
                    Solicitado el {format(parseISO(req.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                <button 
                  onClick={() => handleAction(req.id, 'rejected')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 rounded-xl font-medium transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Rechazar
                </button>
                <button 
                  onClick={() => handleAction(req.id, 'approved')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors shadow-sm shadow-teal-500/20"
                >
                  <CheckCircle className="w-5 h-5" />
                  Conceder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
