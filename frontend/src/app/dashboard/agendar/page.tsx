"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Calendar as CalendarIcon, Info, ChevronLeft, ChevronRight, Search, Clock, CheckCircle2, Loader2, UserMinus } from "lucide-react";
import axios from "@/lib/axios";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfToday, parse, isAfter } from "date-fns";
import { es } from "date-fns/locale";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  tenant?: { name: string };
}

export default function AgendarPage() {
  const { user } = useAuth();
  const isDoctor = user?.roles?.some(r => r.name === "Médico");
  const isAssistant = user?.roles?.some(r => r.name === "Asistente");
  const isStaff = isDoctor || isAssistant;
  
  // Paso 1: Directorio
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Paso 2: Calendario y Disponibilidad
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Paso 3: Formulario de Reserva
  const [patientName, setPatientName] = useState(!isStaff ? user?.name || "" : "");
  const [patientPhone, setPatientPhone] = useState(!isStaff ? user?.phone || "" : "");
  const [patientDni, setPatientDni] = useState(!isStaff ? user?.dni || "" : "");
  const [patientEmail, setPatientEmail] = useState(!isStaff ? user?.email || "" : "");
  const [reason, setReason] = useState("");
  const [noEmail, setNoEmail] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isDoctor && user && !selectedDoctor) {
      setSelectedDoctor({
        id: user.id,
        name: user.name,
        specialty: (user as any).specialty || "Médico General",
        tenant: (user as any).tenant
      });
    }
  }, [isDoctor, user]);

  useEffect(() => {
    fetchDoctors();
  }, [searchQuery]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailability();
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    // Si el usuario paciente está logueado y no es staff, pre-llenar y bloquear
    if (!isStaff && user) {
      setPatientName(user.name);
      setPatientPhone(user.phone || "");
      setPatientDni(user.dni || "");
      setPatientEmail(user.email || "");
    }
  }, [user, isStaff]);

  const fetchDoctors = async () => {
    try {
      if (isAssistant && user) {
        // Los asistentes solo ven a los médicos que tienen asignados
        let assigned = (user as any).assigned_doctors || (user as any).assignedDoctors || [];
        if (searchQuery) {
          assigned = assigned.filter((d: any) => 
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (d.specialty && d.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        setDoctors(assigned);
        return;
      }

      const response = await axios.get(`/api/directory?search=${searchQuery}`);
      setDoctors(response.data);
    } catch (err) {
      console.error("Error fetching doctors", err);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedDoctor || !selectedDate) return;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(`/api/doctors/${selectedDoctor.id}/availability?date=${formattedDate}`);
      setAvailableSlots(response.data);
    } catch (err) {
      console.error("Error fetching availability", err);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;

    setIsBooking(true);
    setError("");

    try {
      const payload = {
        doctor_id: selectedDoctor.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedSlot,
        reason,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_dni: patientDni,
        patient_email: noEmail ? null : patientEmail,
      };

      await axios.post("/api/appointments", payload);
      setBookingSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al agendar la cita.");
    } finally {
      setIsBooking(false);
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayIndex = monthStart.getDay(); // 0 = Domingo

  if (bookingSuccess) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">¡Cita Agendada con Éxito!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            La cita para <strong>{patientName}</strong> con el <strong>Dr(a). {selectedDoctor?.name}</strong> ha sido registrada para el <strong>{selectedDate && format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })} a las {selectedSlot}</strong>.
          </p>
          <div className="flex gap-4 justify-center">
            {isStaff ? (
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[#017EBE] hover:bg-[#016aa1] text-white rounded-lg font-medium transition-colors">
                Agendar otra cita
              </button>
            ) : (
              <button onClick={() => window.location.href = '/mis-citas'} className="px-6 py-3 bg-[#017EBE] hover:bg-[#016aa1] text-white rounded-lg font-medium transition-colors">
                Ver mis citas
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-20">
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Agendar Cita</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          {isStaff ? "Modo Administrativo: Agendando cita para un paciente." : "Encuentra a tu especialista y selecciona un horario."}
        </p>
      </div>

      {isStaff && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 mb-8 flex items-center gap-3">
          <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <p className="text-orange-800 dark:text-orange-300 font-medium text-sm">Modo de Agendamiento Manual: Puedes usar la Cuenta de Invitado apagando el correo electrónico si el paciente no está registrado.</p>
        </div>
      )}

      {!selectedDoctor ? (
        /* PASO 1: DIRECTORIO MÉDICO */
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o especialidad..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2FA4A5] outline-none transition-shadow shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map(doctor => (
              <div 
                key={doctor.id} 
                onClick={() => setSelectedDoctor(doctor)}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:border-[#2FA4A5] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-colors">
                    <User className="h-8 w-8 text-slate-400 group-hover:text-[#2FA4A5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-[#2FA4A5] transition-colors">{doctor.name}</h4>
                    <p className="text-sm text-[#2FA4A5] font-medium">{doctor.specialty || "Médico General"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{doctor.tenant?.name || "Consultorio Independiente"}</p>
                  </div>
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 border border-dashed rounded-xl border-slate-300 dark:border-slate-700">
                No se encontraron médicos con esa búsqueda.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PASO 2 Y 3: CALENDARIO Y FORMULARIO */
        <div className="space-y-6">
          {!isDoctor && (
            <button 
              onClick={() => { setSelectedDoctor(null); setSelectedDate(null); setSelectedSlot(null); }}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Volver al Directorio
            </button>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            
            {/* Cabecera del Doctor Seleccionado (Ocultar si es el mismo médico logueado para no ser redundante) */}
            {!isDoctor && (
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                 <div className="h-16 w-16 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center flex-shrink-0 border border-teal-100 dark:border-teal-800">
                   <User className="h-8 w-8 text-[#2FA4A5]" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">Agendando con: {selectedDoctor.name}</h3>
                   <p className="text-slate-500 dark:text-slate-400">{selectedDoctor.specialty || "Médico General"} • {selectedDoctor.tenant?.name || "Consultorio Independiente"}</p>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Columna Izquierda: Calendario */}
              <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  </button>
                  <h4 className="font-bold text-lg capitalize text-slate-900 dark:text-white">
                    {format(currentMonth, "MMMM yyyy", { locale: es })}
                  </h4>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded bg-[#017EBE] hover:bg-[#016aa1] text-white transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(day => (
                    <div key={day} className="text-xs font-semibold text-slate-400 py-2">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 text-center">
                  {Array.from({ length: startingDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="py-2"></div>
                  ))}
                  
                  {daysInMonth.map(date => {
                    const isPast = isBefore(date, startOfToday());
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    
                    return (
                      <button 
                        key={date.toString()} 
                        disabled={isPast}
                        onClick={() => setSelectedDate(date)}
                        className={`py-2 text-sm font-medium rounded-lg transition-all ${
                          isPast 
                            ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" 
                            : isSelected
                              ? "bg-[#2FA4A5] text-white shadow-md transform scale-105"
                              : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {format(date, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Columna Central: Horarios Disponibles */}
              <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-8 lg:pt-0 lg:pl-8">
                <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-6">Horas Disponibles</h4>
                
                {(() => {
                  const validSlots = availableSlots.filter(slot => {
                    const isToday = selectedDate && isSameDay(selectedDate, startOfToday());
                    if (isToday) {
                      const slotDate = parse(slot, "HH:mm", new Date());
                      return isAfter(slotDate, new Date());
                    }
                    return true;
                  });

                  if (!selectedDate) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <CalendarIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Selecciona un día en el calendario para ver las horas.</p>
                      </div>
                    );
                  }

                  if (isLoadingSlots) {
                    return (
                      <div className="flex-1 flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2FA4A5]"></div>
                      </div>
                    );
                  }

                  if (validSlots.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <Clock className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No hay citas disponibles para este día.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {validSlots.map((slot) => {
                        let formattedTime = slot;
                        try {
                          formattedTime = format(parse(slot, "HH:mm", new Date()), "hh:mm a");
                        } catch(e) {}

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`
                              py-3 px-4 rounded-xl flex items-center justify-center text-sm font-medium transition-all
                              ${selectedSlot === slot 
                                ? "bg-[#2FA4A5] text-white shadow-md shadow-[#2FA4A5]/30 border-transparent" 
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2FA4A5] hover:text-[#2FA4A5]"}
                            `}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {formattedTime}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Columna Derecha: Confirmación de Cita */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-8 lg:pt-0 lg:pl-8">
                <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-6">Detalles del Paciente</h4>
                
                {(!selectedDate || !selectedSlot) ? (
                   <div className="text-center text-slate-400 dark:text-slate-500 py-12 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                     <p className="text-sm">Selecciona una fecha y hora primero.</p>
                   </div>
                ) : (
                  <form onSubmit={handleBookAppointment} className="space-y-4 animate-in slide-in-from-right-4">
                    
                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">DNI / Cédula</label>
                      <input 
                        type="text" required 
                        value={patientDni} onChange={(e) => setPatientDni(e.target.value)}
                        disabled={!isStaff && !!user}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-70 dark:text-white outline-none focus:border-[#2FA4A5]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nombre Completo</label>
                      <input 
                        type="text" required 
                        value={patientName} onChange={(e) => setPatientName(e.target.value)}
                        disabled={!isStaff && !!user}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-70 dark:text-white outline-none focus:border-[#2FA4A5]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                      <input 
                        type="text" required 
                        value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                        disabled={!isStaff && !!user}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-70 dark:text-white outline-none focus:border-[#2FA4A5]" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-500">Correo Electrónico</label>
                      <input 
                        type="email" required={!noEmail}
                        value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)}
                        disabled={(!isStaff && !!user) || noEmail}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-70 dark:text-white outline-none focus:border-[#2FA4A5]" 
                      />
                      
                      {/* Checkbox de Cuenta Invitado (Solo Doctores/Asistentes pueden crear invitados puros) */}
                      {isStaff && (
                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2 cursor-pointer bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                          <input 
                            type="checkbox" 
                            checked={noEmail} 
                            onChange={(e) => {
                              setNoEmail(e.target.checked);
                              if (e.target.checked) setPatientEmail("");
                            }}
                            className="rounded border-slate-300 text-[#2FA4A5] focus:ring-[#2FA4A5]" 
                          />
                          <UserMinus className="h-3 w-3" />
                          Reservar sin correo
                        </label>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Motivo de la Consulta (Opcional)</label>
                      <textarea 
                        rows={2}
                        value={reason} onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:border-[#2FA4A5]" 
                      ></textarea>
                    </div>

                    <button 
                      type="submit" disabled={isBooking}
                      className="w-full py-3 bg-[#017EBE] hover:bg-[#016aa1] text-white rounded-xl font-medium shadow-sm transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                      {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Cita"}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
