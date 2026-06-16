"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { FileText, FileSignature, Download, Activity, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function MiHistorialPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'reports'>('prescriptions');

  const isPatient = user?.roles?.some((r: any) => r.name === "Paciente");

  useEffect(() => {
    if (isPatient) {
      fetchRecords();
    } else {
      setIsLoading(false);
    }
  }, [isPatient]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/patient/my-records");
      setPrescriptions(res.data.prescriptions || []);
      setReports(res.data.reports || []);
    } catch (error) {
      console.error("Error fetching patient records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (type: 'prescription' | 'report', id: number) => {
    try {
      const endpoint = type === 'prescription' ? `/api/prescriptions/${id}/pdf` : `/api/reports/${id}/pdf`;
      const res = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Error al descargar el documento.");
    }
  };

  if (!isPatient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Activity className="w-16 h-16 text-teal-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">Esta sección es exclusiva para pacientes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-teal-500" />
          Mi Historial Clínico
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Visualiza y descarga tus récipes médicos e informes generados por tus especialistas.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-8">
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'prescriptions' 
              ? "border-teal-500 text-teal-600 dark:text-teal-400" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Mis Récipes ({prescriptions.length})
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`pb-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'reports' 
              ? "border-teal-500 text-teal-600 dark:text-teal-400" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          Mis Informes ({reports.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : activeTab === 'prescriptions' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No tienes récipes emitidos todavía.
            </div>
          ) : (
            prescriptions.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <FileSignature className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Récipe Médico</h3>
                        <p className="text-xs text-slate-500">Dr. {item.doctor?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(item.created_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {item.medications ? JSON.parse(item.medications).map((m: any) => m.name).join(', ') : 'Sin medicamentos'}
                  </p>
                </div>
                <button 
                  onClick={() => handleDownload('prescription', item.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded-xl font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No tienes informes emitidos todavía.
            </div>
          ) : (
            reports.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Informe Médico</h3>
                        <p className="text-xs text-slate-500">Dr. {item.doctor?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(item.created_at), "dd MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {item.report_content}
                  </p>
                </div>
                <button 
                  onClick={() => handleDownload('report', item.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
