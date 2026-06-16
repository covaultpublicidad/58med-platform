"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, Phone, MapPin, Award, Building, Activity, FileText } from "lucide-react";
import Link from "next/link";

export function ProfileTab() {
  const { user } = useAuth();
  const isDoctor = user?.roles?.some(r => r.name === "Médico");
  const isPatient = user?.roles?.some(r => r.name === "Paciente");

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isDoctor ? "Tu información pública para pacientes." : "Tus datos privados de expediente."}
          </p>
        </div>
        <Link href="/dashboard/configuracion" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          Editar Perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identidad y Contacto - Común */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-[#2FA4A5]" />
            Información Básica
          </h4>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Nombre Completo</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Correo Electrónico</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Teléfono</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {user?.phone || "No especificado"}
              </dd>
            </div>
            {isPatient && (
              <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">DNI / Cédula</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.dni || "No especificado"}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Sección Específica para Médicos */}
        {isDoctor && (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-[#2FA4A5]" />
                Credenciales Profesionales
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Especialidad</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.specialty || "Médico General"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Matrícula Médica (MPPS)</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.medical_license || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Número de Colegiatura</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.college_number || "No especificado"}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Building className="h-5 w-5 text-[#2FA4A5]" />
                Información Operativa
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Consultorio / Clínica Principal</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">
                    {user?.tenant?.name || "Independiente"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Dirección</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {user?.tenant?.address || "No especificada"}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}

        {/* Sección Específica para Pacientes */}
        {isPatient && (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#2FA4A5]" />
                Perfil Médico Base
              </h4>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Tipo de Sangre</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.patient_profile?.blood_type || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Sexo / Género</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.patient_profile?.gender || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Altura (cm)</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.patient_profile?.height || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Peso (kg)</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.patient_profile?.weight || "-"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Alergias Conocidas</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    {user?.patient_profile?.allergies || "Ninguna registrada"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Condiciones Preexistentes Básicas</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                    {user?.patient_profile?.preexisting_conditions || "Ninguna registrada"}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                Contactos de Emergencia
              </h4>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Nombre del Contacto</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.patient_profile?.emergency_contact_name || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Parentesco</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{user?.patient_profile?.emergency_contact_relation || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Teléfono de Emergencia</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {user?.patient_profile?.emergency_contact_phone || "No especificado"}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
