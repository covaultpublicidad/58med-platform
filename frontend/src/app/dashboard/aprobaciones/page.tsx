"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { CheckCircle, AlertTriangle, FileText, FileSignature, Activity, AlertCircle } from "lucide-react";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [fragmentRequests, setFragmentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Solo médicos pueden ver esta bandeja
  const isDoctor = user?.roles?.some((r: any) => r.name === "Médico");

  useEffect(() => {
    if (isDoctor) {
      fetchApprovals();
    } else {
      setIsLoading(false);
    }
  }, [isDoctor]);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/approvals/pending");
      setMedicalRecords(res.data.medical_records || []);
      setPrescriptions(res.data.prescriptions || []);
      setReports(res.data.medical_reports || []);
      setFragmentRequests(res.data.fragment_requests || []);
    } catch (error) {
      console.error("Error fetching approvals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (type: string, id: number) => {
    try {
      let endpoint = '';
      if (type === 'record') endpoint = `/api/medical-records/${id}/approve`;
      if (type === 'prescription') endpoint = `/api/prescriptions/${id}/approve`;
      if (type === 'report') endpoint = `/api/reports/${id}/approve`;

      await axios.patch(endpoint);
      alert('Documento aprobado y firmado exitosamente.');
      fetchApprovals();
    } catch (error) {
      console.error("Error approving item:", error);
      alert("Error al aprobar");
    }
  };

  const handleFragmentAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await axios.patch(`/api/fragments/requests/${id}/status`, { status });
      fetchApprovals();
    } catch (error) {
      console.error("Error updating fragment request:", error);
      alert("Error al procesar la solicitud");
    }
  };

  if (!isDoctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acceso Restringido</h2>
        <p className="text-slate-500 mt-2">Solo los médicos pueden acceder a la bandeja de aprobaciones.</p>
      </div>
    );
  }

  const totalPending = medicalRecords.length + prescriptions.length + reports.length + fragmentRequests.length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-teal-500" />
          Bandeja de Aprobaciones
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Revisa y aprueba los documentos redactados por tus asistentes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      ) : totalPending === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">¡Todo al día!</h3>
          <p className="text-slate-500">No tienes documentos pendientes de aprobación.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Solicitudes de Expediente */}
          {fragmentRequests.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 mt-8">
              <div className="bg-orange-50 dark:bg-orange-900/20 px-6, py-4 border-b border-orange-200 dark:border-orange-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Solicitudes de Acceso a tu Expediente</h2>
                </div>
              </div>
            </div>
          )}

          {/* Evoluciones Pendientes */}
          {medicalRecords.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" /> Evoluciones ({medicalRecords.length})
              </h2>
              <div className="space-y-4">
                {medicalRecords.map((item: any) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex flex-col md:flex-row justify-between gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-2">Borrador por Asistente: {item.creator?.name}</p>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Paciente: {item.patient?.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1"><strong>Motivo:</strong> {item.symptoms}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Diagnóstico:</strong> {item.diagnosis}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Plan:</strong> {item.treatment_plan}</p>
                    </div>
                    <button onClick={() => handleApprove('record', item.id)} className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Aprobar y Guardar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recetas Pendientes */}
          {prescriptions.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-teal-600" /> Recetas ({prescriptions.length})
              </h2>
              <div className="space-y-4">
                {prescriptions.map((item: any) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex flex-col md:flex-row justify-between gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-2">Borrador por Asistente: {item.creator?.name}</p>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Paciente: {item.patient?.name}</h4>
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <strong>Medicamentos:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {item.medications?.map((m: any, i: number) => (
                            <li key={i}>{m.name} - {m.dose} ({m.frequency}) x {m.duration}</li>
                          ))}
                        </ul>
                      </div>
                      {item.general_instructions && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2"><strong>Indicaciones:</strong> {item.general_instructions}</p>}
                    </div>
                    <button onClick={() => handleApprove('prescription', item.id)} className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Aprobar y Firmar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informes Pendientes */}
          {reports.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> Informes ({reports.length})
              </h2>
              <div className="space-y-4">
                {reports.map((item: any) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex flex-col md:flex-row justify-between gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 mb-2">Borrador por Asistente: {item.creator?.name}</p>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Paciente: {item.patient?.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1"><strong>Título:</strong> {item.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-3"><strong>Contenido:</strong> {item.content}</p>
                    </div>
                    <button onClick={() => handleApprove('report', item.id)} className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Aprobar y Firmar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solicitudes de Acceso a Fragmentos */}
          {fragmentRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" /> Solicitudes de Acceso a tu Expediente ({fragmentRequests.length})
              </h2>
              <div className="space-y-4">
                {fragmentRequests.map((item: any) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex flex-col md:flex-row justify-between gap-4 items-start shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-500 mb-2">Solicitud Intermédica</p>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Paciente: {item.patient?.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        El/La profesional <strong>{item.requester?.name}</strong> solicita acceso a los documentos médicos de este paciente que tú has creado.
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg inline-block">
                        <strong>Estado del Paciente:</strong> {item.patient_approved ? <span className="text-green-600 dark:text-green-400 font-semibold ml-2">✓ El paciente ha concedido el acceso</span> : <span className="text-amber-600 dark:text-amber-400 font-semibold ml-2">⏳ Pendiente de que el paciente apruebe en su portal</span>}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <button onClick={() => handleFragmentAction(item.id, 'rejected')} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors">
                         Rechazar
                      </button>
                      <button onClick={() => handleFragmentAction(item.id, 'approved')} className="flex-1 sm:flex-none px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Aprobar Acceso
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
