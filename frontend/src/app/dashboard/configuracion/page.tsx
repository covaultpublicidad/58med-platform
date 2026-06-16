"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Settings, Image as ImageIcon, Camera, Building2, PenTool, CheckCircle2, CalendarClock, XCircle } from "lucide-react";
import axios from "@/lib/axios";
import { ImageCropperModal } from "@/components/ImageCropperModal";
import { getCroppedImg } from "@/lib/cropImage";

export default function ConfigurationPage() {
  const { user, checkUser } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [assignedDoctors, setAssignedDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  
  // States for basic info
  const [basicData, setBasicData] = useState({
    name: "",
    phone: "",
    specialty: "",
    bio: "",
    dni: "",
    medical_license: "",
    college_number: "",
  });

  // States for patient info
  const [patientData, setPatientData] = useState({
    blood_type: "",
    gender: "",
    height: "",
    weight: "",
    allergies: "",
    preexisting_conditions: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",
  });

  // States for tenant info
  const [tenantData, setTenantData] = useState({
    name: "",
    address: "",
  });

  // States for schedule info
  const [scheduleConfig, setScheduleConfig] = useState({
    appointment_duration: 30,
    buffer_time: 0,
  });

  const [schedules, setSchedules] = useState([
    { day_of_week: 1, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
    { day_of_week: 2, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
    { day_of_week: 3, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
    { day_of_week: 4, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
    { day_of_week: 5, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
    { day_of_week: 6, start_time: "08:00", end_time: "13:00", has_second_shift: false, start_time_2: "14:00", end_time_2: "18:00", is_active: false },
    { day_of_week: 0, start_time: "08:00", end_time: "13:00", has_second_shift: false, start_time_2: "14:00", end_time_2: "18:00", is_active: false },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // States for Cropper
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "cover" | "signature" | "tenant_logo" | "tenant_stamp" | null>(null);

  useEffect(() => {
    if (user) {
      setBasicData({
        name: user.name || "",
        phone: user.phone || "",
        specialty: user.specialty || "",
        bio: user.bio || "",
        dni: user.dni || "",
        medical_license: user.medical_license || "",
        college_number: user.college_number || "",
      });
      if (user.tenant) {
        setTenantData({
          name: user.tenant.name || "",
          address: user.tenant.address || "",
        });
      }
      if (user.patient_profile) {
        setPatientData({
          blood_type: user.patient_profile.blood_type || "",
          gender: user.patient_profile.gender || "",
          height: user.patient_profile.height?.toString() || "",
          weight: user.patient_profile.weight?.toString() || "",
          allergies: user.patient_profile.allergies || "",
          preexisting_conditions: user.patient_profile.preexisting_conditions || "",
          address: user.patient_profile.address || "",
          emergency_contact_name: user.patient_profile.emergency_contact_name || "",
          emergency_contact_relation: user.patient_profile.emergency_contact_relation || "",
          emergency_contact_phone: user.patient_profile.emergency_contact_phone || "",
        });
      }

      setScheduleConfig({
        appointment_duration: user.appointment_duration || 30,
        buffer_time: user.buffer_time || 0,
      });

      // Load schedules from API
      if (user?.roles?.some((r: any) => r.name === "Médico")) {
        fetchSchedules();
      } else if (user?.roles?.some((r: any) => r.name === "Asistente")) {
        setActiveTab("schedule");
        fetchAssignedDoctors();
      }
    }
  }, [user]);

  const fetchAssignedDoctors = async () => {
    try {
      if (user?.assigned_doctors) {
        setAssignedDoctors(user.assigned_doctors);
        if (user.assigned_doctors.length > 0) {
          setSelectedDoctorId(user.assigned_doctors[0].id);
        }
      }
    } catch (e) {}
  };

  const fetchSchedules = async (doctorId?: number) => {
    try {
      const url = doctorId ? `/api/schedules?doctor_id=${doctorId}` : '/api/schedules';
      const res = await axios.get(url);
      
      // Reiniciar a predeterminado
      const defaultSchedules = [
        { day_of_week: 1, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
        { day_of_week: 2, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
        { day_of_week: 3, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
        { day_of_week: 4, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
        { day_of_week: 5, start_time: "08:00", end_time: "12:00", has_second_shift: false, start_time_2: "13:00", end_time_2: "17:00", is_active: false },
        { day_of_week: 6, start_time: "08:00", end_time: "13:00", has_second_shift: false, start_time_2: "14:00", end_time_2: "18:00", is_active: false },
        { day_of_week: 0, start_time: "08:00", end_time: "13:00", has_second_shift: false, start_time_2: "14:00", end_time_2: "18:00", is_active: false },
      ];

      if (res.data && res.data.length > 0) {
        const updatedSchedules = [...defaultSchedules];
        res.data.forEach((apiSched: any) => {
          const index = updatedSchedules.findIndex(s => s.day_of_week === apiSched.day_of_week);
          if (index !== -1) {
            // Check if this day already has the first shift loaded
            if (updatedSchedules[index].is_active && updatedSchedules[index].start_time !== apiSched.start_time.slice(0, 5)) {
              updatedSchedules[index].has_second_shift = true;
              updatedSchedules[index].start_time_2 = apiSched.start_time.slice(0, 5);
              updatedSchedules[index].end_time_2 = apiSched.end_time.slice(0, 5);
            } else {
              updatedSchedules[index].start_time = apiSched.start_time.slice(0, 5);
              updatedSchedules[index].end_time = apiSched.end_time.slice(0, 5);
              updatedSchedules[index].is_active = apiSched.is_active === 1 || apiSched.is_active === true;
            }
          }
        });
        setSchedules(updatedSchedules);
      }
    } catch (error) {
      console.error("Error loading schedules", error);
    }
  };

  const isDoctor = user?.roles?.some((r: any) => r.name === "Médico");
  const isPatient = user?.roles?.some((r: any) => r.name === "Paciente");
  const isAssistant = user?.roles?.some((r: any) => r.name === "Asistente");

  useEffect(() => {
    if (isAssistant && selectedDoctorId) {
      fetchSchedules(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBasicData({ ...basicData, [e.target.name]: e.target.value });
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleTenantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTenantData({ ...tenantData, [e.target.name]: e.target.value });
  };

  const handleScheduleToggle = (index: number, field: 'is_active' | 'has_second_shift' = 'is_active') => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = !newSchedules[index][field];
    setSchedules(newSchedules);
  };

  const handleScheduleTimeChange = (index: number, field: 'start_time' | 'end_time' | 'start_time_2' | 'end_time_2', value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleScheduleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setScheduleConfig({ ...scheduleConfig, [e.target.name]: parseInt(e.target.value) || 0 });
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await axios.post("/api/profile/update", {
        ...basicData,
        ...patientData,
        tenant_name: tenantData.name,
        tenant_address: tenantData.address,
      });

      if (activeTab === 'schedule' && (isDoctor || isAssistant)) {
        const payloadSchedules: any[] = [];
        schedules.forEach(s => {
          if (s.is_active) {
            payloadSchedules.push({ day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_active: true });
            if (s.has_second_shift) {
               payloadSchedules.push({ day_of_week: s.day_of_week, start_time: s.start_time_2, end_time: s.end_time_2, is_active: true });
            }
          }
        });

        const payload: any = {
          appointment_duration: scheduleConfig.appointment_duration,
          buffer_time: scheduleConfig.buffer_time,
          schedules: payloadSchedules
        };

        if (isAssistant) {
          payload.doctor_id = selectedDoctorId;
        }

        await axios.post("/api/schedules", payload);
      }

      await checkUser();
      setSuccessMsg("Información actualizada correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      console.error("Error updating profile", error);
      if (error.response?.data?.errors) {
        setErrorMsg(Object.values(error.response.data.errors).flat().join(" "));
      } else {
        setErrorMsg("Ocurrió un error al guardar la información.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (['signature', 'tenant_logo', 'tenant_stamp'].includes(type)) {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('type', type);
          await axios.post("/api/profile/upload-image", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          await checkUser();
          setSuccessMsg(`Imagen (${type}) actualizada correctamente.`);
          setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error: any) {
          console.error("Upload error:", error);
          if (error.response?.data?.errors) {
            setErrorMsg(Object.values(error.response.data.errors).flat().join(" "));
          } else {
            setErrorMsg("Error al subir la imagen. Verifica el tamaño o formato.");
          }
        } finally {
          setIsLoading(false);
          e.target.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result?.toString() || "");
        setCropType(type);
        setCropModalOpen(true);
        e.target.value = '';
      });
      reader.readAsDataURL(file);
    } else {
      e.target.value = '';
    }
  };

  const onCropCompleteAction = async (croppedArea: any, croppedAreaPixels: any) => {
    if (!imageToCrop || !cropType) return;
    
    setIsLoading(true);
    setCropModalOpen(false);

    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Error cropping image");

      const formData = new FormData();
      formData.append('image', croppedImageBlob, `image.jpg`);
      formData.append('type', cropType);

      await axios.post("/api/profile/upload-image", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await checkUser();
      setSuccessMsg(`Imagen (${cropType}) actualizada correctamente.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      console.error("Upload error:", error);
      if (error.response?.data?.errors) {
        setErrorMsg(Object.values(error.response.data.errors).flat().join(" "));
      } else {
        setErrorMsg("Error al subir la imagen. Verifica el tamaño o formato.");
      }
    } finally {
      setIsLoading(false);
      setImageToCrop(null);
      setCropType(null);
    }
  };

  const isIndependent = user?.tenant?.subscription_plan === 'independent';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Editar Perfil</h1>
        <p className="text-slate-500 mt-1">Configura tu información pública y privada</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3">
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {!isAssistant && (
            <button 
              onClick={() => setActiveTab('basic')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'basic' ? 'bg-[#2FA4A5] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            >
              <User className="h-5 w-5" /> Información Básica
            </button>
          )}
          
          {isPatient && (
            <button 
              onClick={() => setActiveTab('patient')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'patient' ? 'bg-[#2FA4A5] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            >
              <User className="h-5 w-5" /> Expediente Médico
            </button>
          )}

          {(isDoctor || isAssistant) && (
            <>
              {isDoctor && (
                <button 
                  onClick={() => setActiveTab('tenant')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'tenant' ? 'bg-[#2FA4A5] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                >
                  <Building2 className="h-5 w-5" /> Consultorio / Clínica
                </button>
              )}
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'schedule' ? 'bg-[#2FA4A5] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
              >
                <CalendarClock className="h-5 w-5" /> Horarios de Atención
              </button>
            </>
          )}

          {!isAssistant && (
            <button 
              onClick={() => setActiveTab('images')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'images' ? 'bg-[#2FA4A5] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            >
              <ImageIcon className="h-5 w-5" /> Imágenes{isDoctor ? ' y Firma' : ''}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* TAB: BÁSICOS */}
          {activeTab === 'basic' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Información Básica</h2>
              <form onSubmit={handleSaveInfo} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Completo</label>
                    <input type="text" name="name" value={basicData.name} onChange={handleBasicChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono Público</label>
                    <input type="text" name="phone" value={basicData.phone} onChange={handleBasicChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  </div>
                  {isDoctor && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Especialidad</label>
                        <input type="text" name="specialty" value={basicData.specialty} onChange={handleBasicChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Matrícula Médica (MPPS)</label>
                        <input type="text" name="medical_license" value={basicData.medical_license} onChange={handleBasicChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Número de Colegio</label>
                        <input type="text" name="college_number" value={basicData.college_number} onChange={handleBasicChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                      </div>
                    </>
                  )}
                  {isPatient && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">DNI / Cédula</label>
                      <input type="text" name="dni" value={basicData.dni} onChange={handleBasicChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                    </div>
                  )}
                </div>

                {isDoctor && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sobre el Especialista (Biografía)</label>
                    <textarea name="bio" value={basicData.bio} onChange={handleBasicChange} rows={4} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" placeholder="Escribe un poco sobre tu experiencia y servicios..." />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#2FA4A5] hover:bg-[#258a8a] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PATIENT */}
          {activeTab === 'patient' && isPatient && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Expediente Médico</h2>
              <form onSubmit={handleSaveInfo} className="space-y-6">
                
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Condiciones Físicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Sangre</label>
                    <select name="blood_type" value={patientData.blood_type} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white">
                      <option value="">Seleccione...</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sexo / Género</label>
                    <select name="gender" value={patientData.gender} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white">
                      <option value="">Seleccione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Altura (cm)</label>
                    <input type="number" step="0.01" name="height" value={patientData.height} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Peso (kg)</label>
                    <input type="number" step="0.01" name="weight" value={patientData.weight} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alergias Conocidas</label>
                    <textarea name="allergies" value={patientData.allergies} onChange={handlePatientChange} rows={3} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" placeholder="Ej. Penicilina, Mariscos..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Condiciones Preexistentes</label>
                    <textarea name="preexisting_conditions" value={patientData.preexisting_conditions} onChange={handlePatientChange} rows={3} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" placeholder="Ej. Hipertensión, Asma, Diabetes..." />
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Ubicación y Contacto de Emergencia</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dirección de Residencia</label>
                  <input type="text" name="address" value={patientData.address} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre del Contacto</label>
                    <input type="text" name="emergency_contact_name" value={patientData.emergency_contact_name} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parentesco</label>
                    <input type="text" name="emergency_contact_relation" value={patientData.emergency_contact_relation} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono de Emergencia</label>
                    <input type="text" name="emergency_contact_phone" value={patientData.emergency_contact_phone} onChange={handlePatientChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#2FA4A5] hover:bg-[#258a8a] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: TENANT */}
          {activeTab === 'tenant' && isDoctor && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Información del Consultorio / Clínica</h2>
              
              {!isIndependent ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-800 dark:text-amber-200 text-sm mb-6 flex items-start gap-3">
                   <Settings className="h-5 w-5 flex-shrink-0 mt-0.5" />
                   <div>
                     <p className="font-semibold mb-1">Acción Restringida</p>
                     <p>Perteneces a una suscripción organizacional ({user?.tenant?.subscription_plan}). Solo el administrador de la clínica puede modificar estos datos de identidad corporativa.</p>
                   </div>
                </div>
              ) : null}

              <form onSubmit={handleSaveInfo} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre del Consultorio</label>
                  <input type="text" name="name" value={tenantData.name} onChange={handleTenantChange} disabled={!isIndependent} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:bg-slate-100" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dirección Física</label>
                  <input type="text" name="address" value={tenantData.address} onChange={handleTenantChange} disabled={!isIndependent} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:bg-slate-100" />
                </div>

                {isIndependent && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#2FA4A5] hover:bg-[#258a8a] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                      {isLoading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB: SCHEDULE */}
          {activeTab === 'schedule' && (isDoctor || isAssistant) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Horarios de Atención</h2>
              
              {isAssistant && (
                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Selecciona el Médico para gestionar su horario</label>
                  <select 
                    value={selectedDoctorId || ""} 
                    onChange={(e) => setSelectedDoctorId(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[#2FA4A5] outline-none"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {assignedDoctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {(!isAssistant || selectedDoctorId) && (
                <form onSubmit={handleSaveInfo} className="space-y-8">
                
                {/* Duración de citas */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Configuración General de Citas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duración de cada cita (Minutos)</label>
                      <select name="appointment_duration" value={scheduleConfig.appointment_duration} onChange={handleScheduleConfigChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white">
                        <option value="15">15 Minutos</option>
                        <option value="30">30 Minutos</option>
                        <option value="45">45 Minutos</option>
                        <option value="60">1 Hora</option>
                        <option value="90">1.5 Horas</option>
                        <option value="120">2 Horas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tiempo de descanso entre citas (Minutos)</label>
                      <select name="buffer_time" value={scheduleConfig.buffer_time} onChange={handleScheduleConfigChange} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2FA4A5] focus:border-transparent dark:bg-slate-800 dark:text-white">
                        <option value="0">Sin descanso</option>
                        <option value="5">5 Minutos</option>
                        <option value="10">10 Minutos</option>
                        <option value="15">15 Minutos</option>
                        <option value="30">30 Minutos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Días y Horas */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Días y Horarios Disponibles</h3>
                  <div className="space-y-3">
                    {[
                      { index: 0, label: "Lunes" },
                      { index: 1, label: "Martes" },
                      { index: 2, label: "Miércoles" },
                      { index: 3, label: "Jueves" },
                      { index: 4, label: "Viernes" },
                      { index: 5, label: "Sábado" },
                      { index: 6, label: "Domingo" }
                    ].map((dayItem) => {
                      const sIndex = schedules.findIndex(s => s.day_of_week === (dayItem.index === 6 ? 0 : dayItem.index + 1));
                      if (sIndex === -1) return null;
                      const s = schedules[sIndex];

                      return (
                        <div key={dayItem.label} className={`flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border ${s.is_active ? 'border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} transition-colors`}>
                          <div className="flex items-center gap-3 mb-4 sm:mb-0 sm:mt-2">
                            <input 
                              type="checkbox" 
                              checked={s.is_active} 
                              onChange={() => handleScheduleToggle(sIndex, 'is_active')}
                              className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="font-medium text-slate-900 dark:text-white w-24">{dayItem.label}</span>
                          </div>
                          
                          {s.is_active ? (
                            <div className="flex flex-col gap-3 ml-8 sm:ml-0">
                              {/* Shift 1 */}
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase w-12">Turno 1</span>
                                <input 
                                  type="time" 
                                  value={s.start_time} 
                                  onChange={(e) => handleScheduleTimeChange(sIndex, 'start_time', e.target.value)}
                                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white"
                                />
                                <span className="text-slate-400">a</span>
                                <input 
                                  type="time" 
                                  value={s.end_time} 
                                  onChange={(e) => handleScheduleTimeChange(sIndex, 'end_time', e.target.value)}
                                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white"
                                />
                              </div>

                              {/* Shift 2 Toggle */}
                              {!s.has_second_shift ? (
                                <button type="button" onClick={() => handleScheduleToggle(sIndex, 'has_second_shift')} className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 text-left">
                                  + Añadir turno de tarde
                                </button>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-semibold text-slate-400 uppercase w-12">Turno 2</span>
                                  <input 
                                    type="time" 
                                    value={s.start_time_2} 
                                    onChange={(e) => handleScheduleTimeChange(sIndex, 'start_time_2', e.target.value)}
                                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white"
                                  />
                                  <span className="text-slate-400">a</span>
                                  <input 
                                    type="time" 
                                    value={s.end_time_2} 
                                    onChange={(e) => handleScheduleTimeChange(sIndex, 'end_time_2', e.target.value)}
                                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white"
                                  />
                                  <button type="button" onClick={() => handleScheduleToggle(sIndex, 'has_second_shift')} className="ml-2 text-slate-400 hover:text-red-500">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 ml-8 sm:ml-0 sm:mt-2">No disponible</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-[#2FA4A5] hover:bg-[#258a8a] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                      {isLoading ? "Guardando..." : "Guardar Horarios"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: IMAGES */}
          {activeTab === 'images' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Imágenes y Firma</h2>
              <p className="text-sm text-slate-500 mb-8">Personaliza tu aspecto visual en el directorio y tus récipes médicos.</p>
              
              <div className="space-y-8">
                
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div className="h-32 w-32 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    {user?.profile_photo_url ? (
                      <img src={user.profile_photo_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Foto de Perfil</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Esta foto será visible en el Directorio Público y en tu cuenta. Usa una foto profesional y clara (1:1).</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Camera className="h-4 w-4" /> Subir Nueva Foto
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'avatar')} disabled={isLoading} />
                    </label>
                  </div>
                </div>

                {/* Cover */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div className="h-24 w-48 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    {user?.cover_photo_url ? (
                      <img src={user.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Foto de Portada</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Imagen de fondo para tu perfil público. Relación de aspecto recomendada panorámica (16:9).</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Camera className="h-4 w-4" /> Cambiar Portada
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'cover')} disabled={isLoading} />
                    </label>
                  </div>
                </div>

                {/* Signature */}
                {isDoctor && (
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <div className="h-24 w-48 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                      {user?.signature_url ? (
                        <img src={user.signature_url} alt="Signature" className="w-full h-full object-contain bg-white" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <PenTool className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Firma del Médico</h3>
                      <p className="text-sm text-slate-500 mt-1 mb-4">Se utilizará para la emisión automatizada de récipes e informes médicos. Sube una imagen de tu firma (idealmente con fondo transparente).</p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Camera className="h-4 w-4" /> Cargar Firma
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'signature')} disabled={isLoading} />
                      </label>
                    </div>
                  </div>
                )}

                {/* Tenant Logo & Stamp (Restricted) */}
                {isDoctor && (
                  <div className={`pt-4 ${!isIndependent ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Branding Corporativo (Consultorio / Clínica)</h3>
                  {!isIndependent && <p className="text-sm text-amber-600 mb-6">El logo y sello corporativo están gestionados por la Clínica.</p>}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="flex flex-col items-center sm:items-start gap-4">
                      <div className="h-24 w-24 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white flex-shrink-0 p-2 shadow-sm">
                        {user?.tenant?.logo_url ? (
                          <img src={user.tenant.logo_url} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                            <Building2 className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-medium text-sm text-slate-900 dark:text-white mb-2">Logo de Empresa</p>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <Camera className="h-3 w-3" /> Subir Logo
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'tenant_logo')} disabled={isLoading || !isIndependent} />
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-col items-center sm:items-start gap-4">
                      <div className="h-24 w-24 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden bg-white flex-shrink-0 p-2 shadow-sm">
                        {user?.tenant?.stamp_url ? (
                          <img src={user.tenant.stamp_url} alt="Sello" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-full">
                            <PenTool className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="font-medium text-sm text-slate-900 dark:text-white mb-2">Sello Humedo</p>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <Camera className="h-3 w-3" /> Subir Sello
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'tenant_stamp')} disabled={isLoading || !isIndependent} />
                        </label>
                      </div>
                    </div>
                  </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      {cropModalOpen && imageToCrop && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          aspectRatio={cropType === 'cover' ? 16/9 : cropType === 'signature' ? 3/1 : 1}
          onClose={() => { setCropModalOpen(false); setImageToCrop(null); }}
          onCropComplete={onCropCompleteAction}
        />
      )}

    </div>
  );
}
