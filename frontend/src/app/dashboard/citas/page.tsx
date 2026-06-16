"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "@/lib/axios";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, ChevronLeft, Search, Edit, Activity, DollarSign } from "lucide-react";
import { isBefore, format, parseISO, isSameDay, startOfToday, parse, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { ReceiptModal } from "@/components/dashboard/ReceiptModal";

interface Appointment {
  id: number;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  patient?: {
    id: number;
    name: string;
    profile_photo_url?: string;
  };
  doctor?: {
    id: number;
    name: string;
    profile_photo_url?: string;
  };
}

export default function CitasPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState("");

  const isDoctor = user?.roles?.some((r: any) => r.name === "Médico");
  const isPatient = user?.roles?.some((r: any) => r.name === "Paciente");
  const isAssistant = user?.roles?.some((r: any) => r.name === "Asistente");
  const isStaff = isDoctor || isAssistant;

  // Modal de Reprogramación
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editAvailableSlots, setEditAvailableSlots] = useState<string[]>([]);
  const [editSelectedSlot, setEditSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Modal de Pago
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (editDate && editingAppointment) {
      fetchAvailableSlots(editDate);
    } else {
      setEditAvailableSlots([]);
    }
  }, [editDate, editingAppointment]);

  const fetchAvailableSlots = async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const doctorId = editingAppointment?.doctor?.id || user?.id;
      const res = await axios.get(`/api/doctors/${doctorId}/availability`, {
        params: { date }
      });
      setEditAvailableSlots(res.data);
    } catch (err) {
      console.error(err);
      setEditAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!editingAppointment || !editDate || !editSelectedSlot) return;
    setIsSubmittingEdit(true);
    try {
      await axios.put(`/api/appointments/${editingAppointment.id}`, {
        date: editDate,
        time: editSelectedSlot
      });
      alert("Cita reprogramada con éxito. El paciente deberá confirmarla.");
      setIsEditModalOpen(false);
      fetchAppointments(); // Refresh
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al reprogramar.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(`/api/appointments/${id}/status`, { status });
      // Update local state
      setAppointments(appointments.map(app => app.id === id ? { ...app, status: status as any } : app));
    } catch (error) {
      console.error("Error updating appointment status:", error);
      alert("Hubo un error al actualizar la cita.");
    }
  };

  const filteredAppointments = appointments.filter(app => {
    // Tab Filter
    const date = parseISO(app.appointment_date);
    const isPast = isBefore(date, new Date());
    if (filter === 'pending' && app.status !== 'pending') return false;
    if (filter === 'upcoming' && (isPast || app.status === 'cancelled' || app.status === 'completed')) return false;
    if (filter === 'past' && !isPast) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = isStaff 
        ? app.patient?.name.toLowerCase().includes(search)
        : app.doctor?.name.toLowerCase().includes(search);
      const matchReason = app.reason?.toLowerCase().includes(search);
      return matchName || matchReason;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"><AlertCircle className="w-3.5 h-3.5" /> Pendiente</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"><CheckCircle className="w-3.5 h-3.5" /> Confirmada</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"><CheckCircle className="w-3.5 h-3.5" /> Completada</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"><XCircle className="w-3.5 h-3.5" /> Cancelada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* Header and Horizontal Tabs navigation (same as /dashboard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" /> Volver al Perfil
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-teal-500" />
            {isStaff ? "Gestión de Citas" : "Mis Citas Médicas"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isStaff ? "Administra tu agenda, aprueba o cancela consultas." : "Revisa el estado de tus próximas consultas médicas."}
          </p>
        </div>
        {isStaff && (
          <Link href="/dashboard/agendar" className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors shadow-sm shadow-teal-500/20">
            + Nueva Cita
          </Link>
        )}
      </div>

      {/* Internal Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'upcoming' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Próximas
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'pending' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'past' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Historial
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Todas
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={isStaff ? "Buscar paciente..." : "Buscar médico..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
            <p className="text-slate-500 mt-4">Cargando citas...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No hay citas</h3>
            <p className="text-slate-500">No se encontraron citas con los filtros actuales.</p>
          </div>
        ) : (
          filteredAppointments.map(appointment => {
            const date = parseISO(appointment.appointment_date);
            const isPast = isBefore(date, new Date());
            const person = isStaff ? appointment.patient : appointment.doctor;

            return (
              <div key={appointment.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                
                {/* Date & Time Column */}
                <div className="md:w-48 flex-shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">{format(date, 'MMMM', { locale: es })}</span>
                  <span className="text-4xl font-bold text-slate-900 dark:text-white my-1">{format(date, 'dd')}</span>
                  <span className="text-sm text-slate-500 capitalize">{format(date, 'EEEE', { locale: es })}</span>
                  <div className="mt-3 flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    {format(date, 'HH:mm')}
                  </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {person?.profile_photo_url ? (
                          <img src={person.profile_photo_url} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                            {person?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                          {isStaff ? `Paciente: ${person?.name}` : `Dr(a). ${person?.name}`}
                        </h3>
                        {isAssistant && appointment.doctor && (
                          <p className="text-xs text-slate-500 mb-1">Dr. {appointment.doctor.name}</p>
                        )}
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="mt-4 flex items-start gap-2 text-slate-600 dark:text-slate-400 text-sm">
                      <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p><strong>Motivo:</strong> {appointment.reason}</p>
                    </div>
                  )}
                </div>

                {/* Actions Column */}
                <div className="md:w-auto flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                  
                  {appointment.status === 'pending' && isStaff && !isPast && (
                    <button 
                      onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>
                  )}

                  {appointment.status === 'pending' && isPatient && !isPast && (
                    <button 
                      onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirmar
                    </button>
                  )}

                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && isStaff && !isPast && (
                    <button 
                      onClick={() => {
                        setEditingAppointment(appointment);
                        setEditDate(format(parseISO(appointment.appointment_date), 'yyyy-MM-dd'));
                        setEditSelectedSlot(null);
                        setIsEditModalOpen(true);
                      }}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Reprogramar
                    </button>
                  )}

                  {appointment.status === 'confirmed' && isStaff && (
                    <>
                      <Link 
                        href={`/dashboard/pacientes/${appointment.patient?.id}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Activity className="w-4 h-4" /> Iniciar Consulta
                      </Link>
                      <button 
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Completar
                      </button>
                      
                      {(!user?.tenant || user?.tenant?.billing_enabled !== false) && (
                        <button 
                          onClick={() => {
                             setSelectedAppointmentForPayment(appointment);
                             setIsReceiptModalOpen(true);
                          }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <DollarSign className="w-4 h-4" /> Cobrar
                        </button>
                      )}
                    </>
                  )}
                  
                  {appointment.status === 'completed' && isStaff && (!user?.tenant || user?.tenant?.billing_enabled !== false) && (
                     <button 
                        onClick={() => {
                           setSelectedAppointmentForPayment(appointment);
                           setIsReceiptModalOpen(true);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <DollarSign className="w-4 h-4" /> Registrar Pago
                      </button>
                  )}

                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && !isPast && (
                    <button 
                      onClick={() => {
                        if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
                          handleUpdateStatus(appointment.id, 'cancelled');
                        }
                      }}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Cancelar
                    </button>
                  )}
                  
                  {isPast && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <span className="text-xs text-slate-400 text-center px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      Cita pasada
                    </span>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal de Reprogramación */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reprogramar Cita</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Selecciona la nueva fecha y hora para la cita con {editingAppointment?.patient?.name}.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva Fecha</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Horas Disponibles</label>
                  {isLoadingSlots ? (
                    <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-b-2 border-amber-500 rounded-full"></div></div>
                  ) : editAvailableSlots.length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                      No hay horas disponibles.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {editAvailableSlots.filter(slot => {
                        const isToday = editDate && isSameDay(parseISO(editDate), startOfToday());
                        if (isToday) {
                          const slotDate = parse(slot, "HH:mm", new Date());
                          return isAfter(slotDate, new Date());
                        }
                        return true;
                      }).map((slot) => {
                        let formattedTime = slot;
                        try {
                          formattedTime = format(parse(slot, "HH:mm", new Date()), "hh:mm a");
                        } catch(e) {}

                        return (
                          <button
                            key={slot}
                            onClick={() => setEditSelectedSlot(slot)}
                            className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors border ${
                              editSelectedSlot === slot
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-500'
                            }`}
                          >
                            {formattedTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRescheduleSubmit}
                  disabled={!editSelectedSlot || isSubmittingEdit}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-md shadow-amber-500/20"
                >
                  {isSubmittingEdit ? 'Guardando...' : 'Reprogramar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cobro */}
      {isReceiptModalOpen && selectedAppointmentForPayment && (
        <ReceiptModal 
           appointment={selectedAppointmentForPayment}
           onClose={() => setIsReceiptModalOpen(false)}
           onSuccess={() => {
              setIsReceiptModalOpen(false);
              alert("Pago registrado y recibo generado exitosamente.");
           }}
        />
      )}

    </div>
  );
}
