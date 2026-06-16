"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { ChevronLeft, User, Activity, FileText, FileSignature, Clock, Plus, Download, CheckCircle, AlertTriangle, AlertCircle, ShieldCheck, XCircle } from "lucide-react";

export default function PatientDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("resumen");
  const [patient, setPatient] = useState<any>(null);
  
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para los formularios
  const isAssistant = user?.roles?.some((r: any) => r.name === "Asistente");
  const assignedDoctors = isAssistant ? ((user as any).assigned_doctors || (user as any).assignedDoctors || []) : [];
  const defaultDoctorId = isAssistant ? (assignedDoctors.length > 0 ? assignedDoctors[0].id : '') : user?.id;

  const [formDoctorId, setFormDoctorId] = useState(defaultDoctorId);

  // Evolución State
  const [recordForm, setRecordForm] = useState({ symptoms: '', physical_exam: '', diagnosis: '', treatment_plan: '', vital_signs: {} });
  // Receta State
  const [medications, setMedications] = useState<any[]>([]);
  const [currentMed, setCurrentMed] = useState({
    name: '',
    presentation: 'Tabletas',
    concentration: '',
    unit: 'mg',
    frequency_every: '',
    frequency_unit: 'horas',
    duration_length: '',
    duration_unit: 'días'
  });
  const [generalInstructions, setGeneralInstructions] = useState('');
  // Informe State
  const [reportForm, setReportForm] = useState({ title: '', content: '', date: new Date().toISOString().split('T')[0] });

  // Formularios Modales
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);
      // Simular fetch de detalles del paciente temporalmente
      const patientRes = await axios.get(`/api/patients/${id}`);
      setPatient(patientRes.data);

      const recordsRes = await axios.get(`/api/medical-records/patient/${id}`);
      setRecords(recordsRes.data);

      const prescriptionsRes = await axios.get(`/api/prescriptions/patient/${id}`);
      setPrescriptions(prescriptionsRes.data);

      const reportsRes = await axios.get(`/api/reports/patient/${id}`);
      setReports(reportsRes.data);

    } catch (error) {
      console.error("Error fetching patient details", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (type: string, docId: number) => {
    const url = `http://localhost:8000/api/${type}/${docId}/pdf`;
    window.open(url, '_blank');
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/medical-records', {
        ...recordForm,
        patient_id: id,
        doctor_id: formDoctorId
      });
      setShowRecordModal(false);
      setRecordForm({ symptoms: '', physical_exam: '', diagnosis: '', treatment_plan: '', vital_signs: {} });
      fetchPatientData();
    } catch (err) {
      console.error(err);
      alert('Error al crear la evolución');
    } finally { setIsSubmitting(false); }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formattedMedications = medications.map(m => ({
        name: m.name,
        dose: `${m.presentation} ${m.concentration}${m.unit}`,
        frequency: `Cada ${m.frequency_every} ${m.frequency_unit}`,
        duration: `Durante ${m.duration_length} ${m.duration_unit}`
      }));

      await axios.post('/api/prescriptions', {
        medications: formattedMedications,
        general_instructions: generalInstructions,
        patient_id: id,
        doctor_id: formDoctorId
      });
      setShowPrescriptionModal(false);
      setMedications([]);
      setCurrentMed({ name: '', presentation: 'Tabletas', concentration: '', unit: 'mg', frequency_every: '', frequency_unit: 'horas', duration_length: '', duration_unit: 'días' });
      setGeneralInstructions('');
      fetchPatientData();
    } catch (err) {
      console.error(err);
      alert('Error al crear receta');
    } finally { setIsSubmitting(false); }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/reports', {
        ...reportForm,
        patient_id: id,
        doctor_id: formDoctorId
      });
      setShowReportModal(false);
      setReportForm({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
      fetchPatientData();
    } catch (err) {
      console.error(err);
      alert('Error al crear informe');
    } finally { setIsSubmitting(false); }
  };

  const handleRevokeAccess = async (requestId: number) => {
    if (!confirm('¿Estás seguro de que deseas revocar el acceso a este médico? Perderá visibilidad inmediata sobre tus documentos de este paciente.')) return;
    try {
      await axios.patch(`/api/fragments/requests/${requestId}/status`, { status: 'revoked' });
      alert('Acceso revocado exitosamente.');
      fetchPatientData();
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Error al revocar el acceso.");
    }
  };

  const tabs = [
    { id: "resumen", label: "Resumen", icon: <User className="w-4 h-4" /> },
    { id: "evoluciones", label: "Evoluciones", icon: <Activity className="w-4 h-4" /> },
    { id: "recetas", label: "Recetas", icon: <FileSignature className="w-4 h-4" /> },
    { id: "informes", label: "Informes", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/pacientes" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Volver a Pacientes
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {patient ? patient.name : 'Cargando...'}
              </h1>
              <p className="text-slate-500">Expediente Clínico • {patient?.dni ? `C.I: ${patient.dni}` : 'Sin C.I'}</p>
            </div>
          </div>
          
          {/* Action Buttons based on Active Tab */}
          {activeTab === "evoluciones" && (
            <button onClick={() => setShowRecordModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nueva Evolución
            </button>
          )}
          {activeTab === "recetas" && (
            <button onClick={() => setShowPrescriptionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nueva Receta
            </button>
          )}
          {activeTab === "informes" && (
            <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Nuevo Informe
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-teal-500 text-teal-600 dark:text-teal-400" 
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            {activeTab === "resumen" && patient && (
              <div className="animate-in slide-in-from-bottom-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2">Datos Personales</h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <p><strong>Teléfono:</strong> {patient.phone || 'N/A'}</p>
                      <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
                      <p><strong>Género:</strong> {patient.gender || 'No especificado'}</p>
                      <p><strong>Dirección:</strong> {patient.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2">Información Médica</h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      <p><strong>Tipo de Sangre:</strong> <span className="font-semibold text-red-500">{patient.blood_type || 'N/A'}</span></p>
                      <p><strong>Peso / Estatura:</strong> {patient.weight ? patient.weight + ' kg' : '-'} / {patient.height ? patient.height + ' cm' : '-'}</p>
                      <p><strong>Alergias:</strong> {patient.allergies || 'Ninguna registrada'}</p>
                      <p><strong>Condiciones Preexistentes:</strong> {patient.preexisting_conditions || 'Ninguna registrada'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Expedientes Ocultos */}
                {patient.hidden_fragments && patient.hidden_fragments.length > 0 && (
                  <div className="mt-6 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-orange-800 dark:text-orange-400">
                      <AlertCircle className="w-5 h-5" /> Expedientes Protegidos
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                      Este paciente ha sido atendido por otros especialistas. Por privacidad, su información está oculta.
                    </p>
                    <div className="space-y-3">
                      {patient.hidden_fragments.map((doc: any) => (
                        <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">Dr. {doc.name}</p>
                            <p className="text-xs text-slate-500">Especialidad: {doc.specialty || 'General'}</p>
                          </div>
                          {doc.access_status === 'pending' ? (
                            <button 
                              disabled
                              className="text-sm font-semibold bg-amber-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 opacity-80 cursor-not-allowed"
                            >
                              Solicitud Pendiente
                            </button>
                          ) : doc.access_status === 'approved' ? (
                            <button 
                              disabled
                              className="text-sm font-semibold bg-green-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                            >
                              Acceso Concedido
                            </button>
                          ) : (
                            <button 
                              onClick={async () => {
                                try {
                                  await axios.post('/api/fragments/request-access', { patient_id: id, owner_doctor_id: doc.id });
                                  alert('Solicitud enviada al Dr. ' + doc.name);
                                  fetchPatientData(); // Refresh data to show pending state
                                } catch (e:any) {
                                  alert(e.response?.data?.message || 'Error al solicitar acceso');
                                }
                              }}
                              className="text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              Solicitar Acceso
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accesos Concedidos (Visible para el Doctor B) */}
                {patient.granted_accesses && patient.granted_accesses.length > 0 && (
                  <div className="mt-6 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-teal-800 dark:text-teal-400">
                      <ShieldCheck className="w-5 h-5" /> Accesos Otorgados a tu Expediente
                    </h3>
                    <p className="text-sm text-teal-700 dark:text-teal-300 mb-4">
                      Estos médicos actualmente tienen acceso a los documentos de este paciente redactados por ti, tras la aprobación del paciente.
                    </p>
                    <div className="space-y-3">
                      {patient.granted_accesses.map((req: any) => (
                        <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">Dr/Dra. {req.requester?.name}</p>
                            <p className="text-xs text-slate-500">Concedido el {new Date(req.updated_at).toLocaleDateString()}</p>
                          </div>
                          <button 
                            onClick={() => handleRevokeAccess(req.id)}
                            className="text-sm font-semibold bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Revocar Acceso
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "evoluciones" && (
              <div className="space-y-4">
                {records.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No hay evoluciones registradas.</div>
                ) : (
                  records.map((r: any) => (
                    <div key={r.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Diagnóstico: {r.diagnosis || 'No especificado'}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2"><strong>Síntomas:</strong> {r.symptoms}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Plan:</strong> {r.treatment_plan}</p>
                      <div className="mt-3 text-xs text-slate-400">
                        Por: {r.creator?.name} (Dr. {r.doctor?.name})
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "recetas" && (
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No hay recetas registradas.</div>
                ) : (
                  prescriptions.map((p: any) => (
                    <div key={p.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Receta #{p.id} - {new Date(p.created_at).toLocaleDateString()}</h4>
                        <p className="text-sm text-slate-500">{p.medications?.length || 0} medicamentos recetados</p>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status === 'approved' ? 'Aprobado' : 'Pendiente Aprobación'}
                          </span>
                        </div>
                      </div>
                      {p.status === 'approved' && (
                        <button onClick={() => handleDownload('prescriptions', p.id)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors text-teal-600">
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "informes" && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No hay informes registrados.</div>
                ) : (
                  reports.map((r: any) => (
                    <div key={r.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{r.title}</h4>
                        <p className="text-sm text-slate-500">Fecha: {new Date(r.date).toLocaleDateString()}</p>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {r.status === 'approved' ? 'Aprobado' : 'Pendiente Aprobación'}
                          </span>
                        </div>
                      </div>
                      {r.status === 'approved' && (
                        <button onClick={() => handleDownload('reports', r.id)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors text-teal-600">
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL DE NUEVA EVOLUCIÓN */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nueva Evolución Clínica</h2>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              {isAssistant && (
                <div>
                  <label className="block text-sm mb-1">Médico Responsable</label>
                  <select value={formDoctorId} onChange={(e) => setFormDoctorId(e.target.value)} required className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">Seleccione un médico...</option>
                    {assignedDoctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Motivo de consulta / Síntomas</label>
                <textarea rows={2} required value={recordForm.symptoms} onChange={e => setRecordForm({...recordForm, symptoms: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"></textarea>
              </div>
              <div>
                <label className="block text-sm mb-1">Examen Físico</label>
                <textarea rows={2} value={recordForm.physical_exam} onChange={e => setRecordForm({...recordForm, physical_exam: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"></textarea>
              </div>
              <div>
                <label className="block text-sm mb-1">Diagnóstico</label>
                <input type="text" required value={recordForm.diagnosis} onChange={e => setRecordForm({...recordForm, diagnosis: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-sm mb-1">Plan de Tratamiento</label>
                <textarea rows={2} value={recordForm.treatment_plan} onChange={e => setRecordForm({...recordForm, treatment_plan: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowRecordModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  {isSubmitting ? 'Guardando...' : 'Guardar Evolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVA RECETA */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nueva Receta Médica</h2>
            <form onSubmit={handleCreatePrescription} className="space-y-4">
              {isAssistant && (
                <div>
                  <label className="block text-sm mb-1">Médico Responsable</label>
                  <select value={formDoctorId} onChange={(e) => setFormDoctorId(e.target.value)} required className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">Seleccione un médico...</option>
                    {assignedDoctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              
              <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Medicamento</label>
                  <input type="text" placeholder="Ej: Acetaminofén" value={currentMed.name} onChange={e => setCurrentMed({...currentMed, name: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Presentación</label>
                    <select value={currentMed.presentation} onChange={e => setCurrentMed({...currentMed, presentation: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
                      {['Tabletas', 'Cápsulas', 'Jarabe', 'Suspensión', 'Ampollas', 'Gotas', 'Comprimidos', 'Grageas', 'Pomada', 'Crema', 'Supositorios', 'Inyección'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Concentración</label>
                    <input type="text" placeholder="Ej: 500" value={currentMed.concentration} onChange={e => setCurrentMed({...currentMed, concentration: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Unidad</label>
                    <select value={currentMed.unit} onChange={e => setCurrentMed({...currentMed, unit: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
                      {['mg', 'ml', 'g', 'mcg', 'UI', '%'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Frecuencia</label>
                    <div className="flex gap-2">
                      <span className="flex items-center text-sm text-slate-500">Cada</span>
                      <input type="text" value={currentMed.frequency_every} onChange={e => setCurrentMed({...currentMed, frequency_every: e.target.value})} className="w-16 p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-center" />
                      <select value={currentMed.frequency_unit} onChange={e => setCurrentMed({...currentMed, frequency_unit: e.target.value})} className="flex-1 p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
                        {['horas', 'días'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Duración</label>
                    <div className="flex gap-2">
                      <span className="flex items-center text-sm text-slate-500">Durante</span>
                      <input type="text" value={currentMed.duration_length} onChange={e => setCurrentMed({...currentMed, duration_length: e.target.value})} className="w-16 p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-center" />
                      <select value={currentMed.duration_unit} onChange={e => setCurrentMed({...currentMed, duration_unit: e.target.value})} className="flex-1 p-2.5 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700">
                        {['días', 'semanas', 'meses'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  disabled={!currentMed.name}
                  onClick={() => {
                    setMedications([...medications, currentMed]);
                    setCurrentMed({ name: '', presentation: 'Tabletas', concentration: '', unit: 'mg', frequency_every: '', frequency_unit: 'horas', duration_length: '', duration_unit: 'días' });
                  }} 
                  className="w-full mt-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" /> Añadir a la Receta
                </button>

              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-slate-800 dark:text-slate-200">
                  <FileSignature className="w-5 h-5" /> Lista de Prescripciones
                </h3>
                {medications.length === 0 ? (
                  <p className="text-center text-slate-400 py-6 text-sm">No hay medicamentos en la receta actual.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {medications.map((m, idx) => (
                      <li key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{m.name} <span className="font-normal text-sm text-slate-500">({m.presentation} {m.concentration}{m.unit})</span></p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Cada {m.frequency_every} {m.frequency_unit} durante {m.duration_length} {m.duration_unit}</p>
                        </div>
                        <button type="button" onClick={() => setMedications(medications.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Indicaciones Generales</label>
                <textarea rows={3} value={generalInstructions} onChange={e => setGeneralInstructions(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowPrescriptionModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  {isSubmitting ? 'Guardando...' : 'Generar Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVO INFORME */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nuevo Informe Médico</h2>
            <form onSubmit={handleCreateReport} className="space-y-4">
              {isAssistant && (
                <div>
                  <label className="block text-sm mb-1">Médico Responsable</label>
                  <select value={formDoctorId} onChange={(e) => setFormDoctorId(e.target.value)} required className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                    <option value="">Seleccione un médico...</option>
                    {assignedDoctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Título del Informe (Ej: Constancia de Reposo)</label>
                <input type="text" required value={reportForm.title} onChange={e => setReportForm({...reportForm, title: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-sm mb-1">Fecha</label>
                <input type="date" required value={reportForm.date} onChange={e => setReportForm({...reportForm, date: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-sm mb-1">Cuerpo del Informe</label>
                <textarea rows={6} required value={reportForm.content} onChange={e => setReportForm({...reportForm, content: e.target.value})} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  {isSubmitting ? 'Guardando...' : 'Generar Informe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
