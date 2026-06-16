"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Users, UserPlus, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Assistant {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  dni: string | null;
}

export default function AsistentesPage() {
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dni: ""
  });

  useEffect(() => {
    fetchAssistants();
  }, []);

  const fetchAssistants = async () => {
    try {
      const res = await axios.get('/api/assistants');
      setAssistants(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/assistants', formData);
      alert("Asistente añadido exitosamente.");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", dni: "" });
      fetchAssistants();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al añadir asistente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssistant = async (id: number) => {
    if (!confirm("¿Seguro que deseas desvincular a este asistente?")) return;
    try {
      await axios.delete(`/api/assistants/${id}`);
      fetchAssistants();
    } catch (error: any) {
      alert("Error al desvincular asistente.");
    }
  };

  if (!user?.roles?.some(r => r.name === "Médico")) {
    return <div className="p-8">No tienes permiso para ver esta página.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" /> Volver al Perfil
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-500" />
            Mis Asistentes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestiona el acceso de tus asistentes para que administren tu agenda y citas.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors shadow-sm shadow-teal-500/20 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Añadir Asistente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Cargando asistentes...</div>
        ) : assistants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aún no tienes asistentes vinculados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Nombre</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Correo Electrónico</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Teléfono</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {assistants.map(asst => (
                  <tr key={asst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{asst.name}</td>
                    <td className="px-6 py-4 text-slate-500">{asst.email}</td>
                    <td className="px-6 py-4 text-slate-500">{asst.phone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemoveAssistant(asst.id)}
                        className="text-red-500 hover:text-red-700 transition-colors font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                      >
                        <XCircle className="w-4 h-4" /> Desvincular
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Añadir Asistente</h3>
            <p className="text-slate-500 mb-6 text-sm">Si el correo ya está registrado en la plataforma, simplemente se vinculará a tu cuenta. Si no, se le creará una cuenta nueva con contraseña temporal ("password123").</p>
            
            <form onSubmit={handleAddAssistant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DNI / Cédula</label>
                  <input type="text" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
