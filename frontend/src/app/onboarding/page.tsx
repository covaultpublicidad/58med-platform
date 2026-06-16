"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import axios from "@/lib/axios";

export default function OnboardingPage() {
  const { user } = useAuth();
  const isDoctor = user?.roles?.some(r => r.name === "Médico");
  const isPatient = user?.roles?.some(r => r.name === "Paciente");
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Paso 1: Datos Base Comunes
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");

  // Paso 1 Doctor Específico
  const [specialty, setSpecialty] = useState("");
  const [medicalLicense, setMedicalLicense] = useState("");
  const [collegeNumber, setCollegeNumber] = useState("");

  // Paciente Específico: Paso 1 (Dirección)
  const [address, setAddress] = useState("");

  // Paciente Específico: Paso 2 (Biometría)
  const [bloodType, setBloodType] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Paciente Específico: Paso 3 (Historial Médico)
  const [allergies, setAllergies] = useState("");
  const [preexistingConditions, setPreexistingConditions] = useState("");

  // Paciente Específico: Paso 4 (Contacto de Emergencia)
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Doctor Específico: Paso 2 (Horarios y Citas)
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(0);

  const initialSchedules = [
    { day_of_week: 1, start_time: "08:00", end_time: "12:00", is_active: true },
    { day_of_week: 1, start_time: "13:00", end_time: "17:00", is_active: true },
    { day_of_week: 2, start_time: "08:00", end_time: "12:00", is_active: true },
    { day_of_week: 2, start_time: "13:00", end_time: "17:00", is_active: true },
    { day_of_week: 3, start_time: "08:00", end_time: "12:00", is_active: true },
    { day_of_week: 3, start_time: "13:00", end_time: "17:00", is_active: true },
    { day_of_week: 4, start_time: "08:00", end_time: "12:00", is_active: true },
    { day_of_week: 4, start_time: "13:00", end_time: "17:00", is_active: true },
    { day_of_week: 5, start_time: "08:00", end_time: "12:00", is_active: true },
    { day_of_week: 5, start_time: "13:00", end_time: "17:00", is_active: true },
  ];
  const [schedules, setSchedules] = useState(initialSchedules);

  const totalSteps = isDoctor ? 2 : 4;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setSchedules(newSchedules);
  };

  const addSchedule = (day: number) => {
    setSchedules([...schedules, { day_of_week: day, start_time: "08:00", end_time: "12:00", is_active: true }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (isDoctor && step === 2) {
        await axios.post("/api/schedules", { 
          schedules,
          appointment_duration: appointmentDuration,
          buffer_time: bufferTime
        });
      }

      await axios.post("/api/profile/complete", { 
        phone, 
        dni,
        specialty,
        medical_license: medicalLicense,
        college_number: collegeNumber,
        blood_type: bloodType,
        gender,
        height,
        weight,
        allergies,
        preexisting_conditions: preexistingConditions,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_relation: emergencyContactRelation,
        emergency_contact_phone: emergencyContactPhone
      });
      
      window.location.href = "/";
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = err.response.data.message;
        if (errors?.phone) errorMessage = "Este número de teléfono ya está registrado por otro usuario.";
        if (errors?.dni) errorMessage = "Esta cédula/DNI ya está registrada por otro usuario.";
        setError(errorMessage);
      } else {
        setError(err.response?.data?.message || "Ocurrió un error al completar tu configuración.");
      }
      setIsLoading(false);
    }
  };

  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  
  const groupedSchedules = dayNames.map((dayName, dayIndex) => {
    return {
      dayIndex,
      dayName,
      blocks: schedules.map((sch, originalIndex) => ({ ...sch, originalIndex })).filter(s => s.day_of_week === dayIndex)
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
          Bienvenido, {user?.name}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {isDoctor 
            ? "Para comenzar, necesitamos completar tus credenciales y horarios." 
            : "Por favor, completa tu ficha médica para brindarte la mejor atención."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        {/* Progress Tracker */}
        <div className="flex items-center justify-center mb-8 px-4 overflow-x-auto hide-scrollbar py-2">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNumber = i + 1;
            let stepLabel = "";
            if (isDoctor) {
              stepLabel = stepNumber === 1 ? "Credenciales" : "Horarios";
            } else {
              if (stepNumber === 1) stepLabel = "Personales";
              if (stepNumber === 2) stepLabel = "Biometría";
              if (stepNumber === 3) stepLabel = "Historial Médico";
              if (stepNumber === 4) stepLabel = "Emergencia";
            }

            return (
              <div key={stepNumber} className="flex items-center">
                <div className={`flex flex-col md:flex-row items-center gap-2 ${step >= stepNumber ? "text-[#2FA4A5]" : "text-slate-400"}`}>
                  <div className="h-8 w-8 rounded-full border-2 border-current flex items-center justify-center font-bold text-sm bg-white dark:bg-slate-900 z-10">
                    {stepNumber}
                  </div>
                  <span className="font-medium text-xs md:text-sm whitespace-nowrap">{stepLabel}</span>
                </div>
                {stepNumber < totalSteps && (
                  <div className={`w-8 md:w-12 h-1 mx-2 -ml-4 md:ml-2 rounded-full ${step > stepNumber ? "bg-[#2FA4A5]" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800 py-8 px-4 sm:px-10 shadow-xl sm:rounded-xl border border-slate-200 dark:border-slate-700">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form className="space-y-6 animate-in fade-in slide-in-from-right-4" onSubmit={handleNextStep}>
            
            {/* -------------------- PASO 1 (MÉDICO Y PACIENTE) -------------------- */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Información Base</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cédula de Identidad / DNI</label>
                    <input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="V-12345678" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Número de Teléfono</label>
                    <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="+58 412 1234567" />
                  </div>
                </div>

                {isPatient && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Dirección Residencial</label>
                    <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Av. Principal, Edificio..." />
                  </div>
                )}

                {isDoctor && (
                  <>
                    <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mt-8">Credenciales Médicas</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Especialidad Médica</label>
                      <input type="text" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Ej. Pediatría, Cardiología" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Matrícula Médica (MPPS)</label>
                        <input type="text" required value={medicalLicense} onChange={(e) => setMedicalLicense(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Ej. 12345" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Número de Colegiatura</label>
                        <input type="text" required value={collegeNumber} onChange={(e) => setCollegeNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Ej. 98765" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* -------------------- PASO 2 (PACIENTE: BIOMETRÍA) -------------------- */}
            {step === 2 && isPatient && (
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Datos Biométricos Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Género</label>
                    <select required value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white">
                      <option value="">Selecciona...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Sangre</label>
                    <select required value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white">
                      <option value="">Selecciona...</option>
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Desconocido"].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Altura (Metros)</label>
                    <input type="number" step="0.01" required value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Ej. 1.75" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Peso (Kg)</label>
                    <input type="number" step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Ej. 70.5" />
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- PASO 3 (PACIENTE: HISTORIAL) -------------------- */}
            {step === 3 && isPatient && (
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Historial Médico Importante</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 mb-4">
                  Si no tienes alergias o condiciones preexistentes, por favor escribe <strong>"Ninguna"</strong>. Esta información es obligatoria para tu seguridad médica.
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Alergias Conocidas</label>
                  <textarea required rows={3} value={allergies} onChange={(e) => setAllergies(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Polvo, Maní, Penicilina... o escribe 'Ninguna'"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Condiciones Preexistentes</label>
                  <textarea required rows={3} value={preexistingConditions} onChange={(e) => setPreexistingConditions(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Asma, Hipertensión, Diabetes... o escribe 'Ninguna'"></textarea>
                </div>
              </div>
            )}

            {/* -------------------- PASO 4 (PACIENTE: EMERGENCIA) -------------------- */}
            {step === 4 && isPatient && (
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Contacto de Emergencia</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Contacto</label>
                  <input type="text" required value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Nombre de un familiar o amigo" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Parentesco</label>
                    <input type="text" required value={emergencyContactRelation} onChange={(e) => setEmergencyContactRelation(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="Ej. Padre, Esposa, Hermano" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono de Emergencia</label>
                    <input type="text" required value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-[#2FA4A5] focus:border-[#2FA4A5] sm:text-sm dark:bg-slate-700 dark:text-white" placeholder="+58 414 1234567" />
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- PASO 2 (DOCTOR: HORARIOS) -------------------- */}
            {step === 2 && isDoctor && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                {/* OMITIDO PARA BREVEDAD: La sección de Configuración Base y Calendario del Doctor es idéntica a la que construí en el paso anterior */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Configuración Base de las Citas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duración por Cita</label>
                      <select value={appointmentDuration} onChange={(e) => setAppointmentDuration(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg sm:text-sm dark:bg-slate-800 dark:text-white focus:ring-[#2FA4A5]">
                        <option value={15}>15 minutos</option><option value={20}>20 minutos</option><option value={30}>30 minutos</option><option value={45}>45 minutos</option><option value={60}>1 hora</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiempo de Espera / Descanso</label>
                      <select value={bufferTime} onChange={(e) => setBufferTime(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg sm:text-sm dark:bg-slate-800 dark:text-white focus:ring-[#2FA4A5]">
                        <option value={0}>Sin descanso</option><option value={5}>5 minutos</option><option value={10}>10 minutos</option><option value={15}>15 minutos</option><option value={30}>30 minutos</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
                  <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Disponibilidad Semanal</h3>
                  {groupedSchedules.map((dayGroup) => (
                    <div key={dayGroup.dayIndex} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{dayGroup.dayName}</h4>
                        <button type="button" onClick={() => addSchedule(dayGroup.dayIndex)} className="text-sm flex items-center gap-1 text-[#2FA4A5] hover:text-[#1D7475] font-medium"><Plus className="h-4 w-4" /> Añadir Bloque</button>
                      </div>
                      <div className="p-4 space-y-3">
                        {dayGroup.blocks.length === 0 ? (
                          <p className="text-sm text-slate-400 dark:text-slate-500 italic">Día no laborable / Sin bloques.</p>
                        ) : (
                          dayGroup.blocks.map((block, localIdx) => (
                            <div key={block.originalIndex} className="flex items-center gap-3">
                              <span className="text-sm text-slate-500 w-16 font-medium">Bloque {localIdx + 1}</span>
                              <input type="time" value={block.start_time} onChange={(e) => handleScheduleChange(block.originalIndex, "start_time", e.target.value)} className="w-28 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm dark:bg-slate-900 dark:text-white focus:ring-[#2FA4A5]" />
                              <span className="text-slate-400">a</span>
                              <input type="time" value={block.end_time} onChange={(e) => handleScheduleChange(block.originalIndex, "end_time", e.target.value)} className="w-28 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md text-sm dark:bg-slate-900 dark:text-white focus:ring-[#2FA4A5]" />
                              <button type="button" onClick={() => removeSchedule(block.originalIndex)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors ml-auto"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES DE NAVEGACIÓN GENERAL */}
            <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-[2] flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#017EBE] hover:bg-[#016aa1] disabled:opacity-50 transition-colors items-center gap-2"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : step === totalSteps ? "Finalizar Configuración" : "Siguiente Paso"}
                {!isLoading && (step === totalSteps ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
