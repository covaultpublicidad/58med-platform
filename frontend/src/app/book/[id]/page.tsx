"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as CalendarIcon, ChevronLeft, Clock, Info, CheckCircle2, Loader2, User } from "lucide-react";
import axios from "@/lib/axios";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfToday, parse, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";

export default function PublicBookingFlow() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Formulario del Paciente
  const [patientName, setPatientName] = useState(user?.name || "");
  const [patientDni, setPatientDni] = useState(user?.dni || "");
  const [patientPhone, setPatientPhone] = useState(user?.phone || "");
  const [patientEmail, setPatientEmail] = useState(user?.email || "");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchDoctor();
    }
  }, [params.id]);

  useEffect(() => {
    if (user) {
      setPatientName(user.name);
      setPatientEmail(user.email);
      setPatientDni((user as any).dni || "");
      setPatientPhone((user as any).phone || "");
    }
  }, [user]);

  const fetchDoctor = async () => {
    try {
      const res = await axios.get(`/api/directory/${params.id}`);
      setDoctor(res.data);
    } catch (error) {
      setError("No se pudo cargar la información del médico.");
    }
  };

  useEffect(() => {
    if (selectedDate && doctor) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, doctor]);

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setError("");
    try {
      const res = await axios.get(`/api/doctors/${doctor.id}/availability`, {
        params: { date: format(selectedDate!, "yyyy-MM-dd") }
      });
      setAvailableSlots(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar la disponibilidad.");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setError("Por favor selecciona una fecha y hora.");
      return;
    }
    
    // Si no está logueado, mostrar modal de Auth vs Guest
    if (!user) {
      setShowAuthModal(true);
    } else {
      submitBooking();
    }
  };

  const submitBooking = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        doctor_id: doctor.id,
        date: format(selectedDate!, "yyyy-MM-dd"),
        time: selectedSlot,
        reason,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_dni: patientDni,
        patient_email: patientEmail || null,
      };

      await axios.post("/api/appointments", payload);
      setSuccess(true);
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Error al agendar la cita.");
      setShowAuthModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendario Helpers
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDay = startOfMonth(currentMonth).getDay();

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2FA4A5]"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full border border-slate-100 dark:border-slate-800">
          <CheckCircle2 className="h-20 w-20 text-[#2FA4A5] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">¡Cita Confirmada!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Tu cita con <strong>{doctor.name}</strong> para el {format(selectedDate!, "dd 'de' MMMM", { locale: es })} a las {selectedSlot} ha sido agendada con éxito.
          </p>
          <div className="flex flex-col gap-3">
             {!user && (
               <Link href="/register" className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#2FA4A5] hover:bg-[#258a8a] transition-all">
                 Crear Cuenta (Recomendado)
               </Link>
             )}
             <Link href="/" className="w-full inline-flex justify-center items-center px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
               Volver al Inicio
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="font-medium hidden sm:inline">Atrás</span>
            </button>
            <Link href="/" className="flex items-center">
               <Image src="/logo.png" alt="58 MED Logo" width={100} height={40} className="h-8 w-auto object-contain" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 mb-8">
          
          {/* Cabecera del Doctor */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
             <div className="h-24 w-24 rounded-full border-2 border-[#2FA4A5]/20 overflow-hidden bg-slate-50 flex-shrink-0">
               {doctor.profile_photo_url ? (
                 <img src={doctor.profile_photo_url} alt={doctor.name} className="h-full w-full object-cover" />
               ) : (
                 <div className="h-full w-full flex items-center justify-center">
                   <User className="h-10 w-10 text-slate-400" />
                 </div>
               )}
             </div>
             <div className="text-center md:text-left">
               <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Agendar Cita con {doctor.name}</h1>
               <p className="text-lg text-[#2FA4A5] font-medium">{doctor.specialty || "Médico General"}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Izquierda: Calendario */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="flex items-center justify-between mb-8">
                <button onClick={prevMonth} className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h2>
                <button onClick={nextMonth} className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300 rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4 text-center">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((day) => (
                  <div key={day} className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 lg:gap-3">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const isPast = isBefore(day, startOfToday());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toString()}
                      disabled={isPast}
                      onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                      className={`
                        aspect-square rounded-xl flex items-center justify-center text-sm md:text-base font-medium transition-all
                        ${isPast ? "text-slate-300 dark:text-slate-700 cursor-not-allowed" : "hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-[#2FA4A5]"}
                        ${isSelected ? "bg-[#2FA4A5] text-white hover:bg-[#2FA4A5] hover:text-white shadow-md shadow-[#2FA4A5]/30 scale-105" : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200"}
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Derecha: Horas y Formulario */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Horas Disponibles</h3>
              
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

                if (loadingSlots) {
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

              {/* Formulario (Aparece al seleccionar hora) */}
              {selectedSlot && (
                <div className="mt-auto animate-fade-in">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Tus Datos</h4>
                    
                    {error && (
                      <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-800/30">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleInitialSubmit} className="space-y-4">
                      {!user && (
                        <>
                          <div>
                            <input required type="text" placeholder="Cédula / DNI" value={patientDni} onChange={e => setPatientDni(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#2FA4A5] outline-none" />
                          </div>
                          <div>
                            <input required type="text" placeholder="Nombre Completo" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#2FA4A5] outline-none" />
                          </div>
                          <div>
                            <input required type="tel" placeholder="Teléfono" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#2FA4A5] outline-none" />
                          </div>
                          <div>
                            <input type="email" placeholder="Correo Electrónico (Opcional)" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#2FA4A5] outline-none" />
                          </div>
                        </>
                      )}
                      <div>
                        <textarea placeholder="Motivo de la consulta (Opcional)" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#2FA4A5] outline-none resize-none h-24" />
                      </div>
                      
                      <button type="submit" className="w-full py-4 bg-[#2FA4A5] hover:bg-[#258a8a] text-white rounded-xl font-bold shadow-md shadow-[#2FA4A5]/30 transition-all flex items-center justify-center">
                        Confirmar Cita
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Modal de Invitación a Registro */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-[#2FA4A5]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Casi Listo!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Para llevar un mejor control de tus citas y ver tu historial médico, te recomendamos iniciar sesión. Si tienes prisa, puedes continuar como invitado.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => router.push(`/login?redirect=/book/${doctor.id}`)}
                  className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => router.push(`/register?redirect=/book/${doctor.id}`)}
                  className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Registrarse
                </button>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-slate-900 px-4 text-sm text-slate-500">o</span>
                  </div>
                </div>
                <button 
                  onClick={submitBooking}
                  disabled={isSubmitting}
                  className="w-full py-3.5 border-2 border-[#2FA4A5] text-[#2FA4A5] rounded-xl font-bold hover:bg-[#2FA4A5] hover:text-white transition-all flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continuar como Invitado"}
                </button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
               <button onClick={() => setShowAuthModal(false)} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
                 Cancelar y volver
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
