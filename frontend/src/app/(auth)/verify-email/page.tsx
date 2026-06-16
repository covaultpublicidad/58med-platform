"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck, AlertCircle, RefreshCw } from "lucide-react";
import axios from "@/lib/axios";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const verifyUrl = searchParams.get("url");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (verifyUrl && status === "idle") {
      verifyEmail(verifyUrl);
    }
  }, [verifyUrl, status]);

  const verifyEmail = async (url: string) => {
    setStatus("verifying");
    try {
      await axios.get(url);
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (error) {
      setStatus("error");
    }
  };

  const resendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await axios.post("/api/email/verification-notification");
      setResendSuccess(true);
    } catch (error) {
      // Handle error gracefully
    } finally {
      setIsResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in duration-500">
        
        {status === "verifying" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-[#2FA4A5] mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verificando tu correo...</h2>
            <p className="text-slate-500 mt-2">Por favor, espera un momento.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <MailCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Correo Verificado!</h2>
            <p className="text-slate-500 mt-2">Tu cuenta ha sido activada correctamente.</p>
            <p className="text-sm text-slate-400 mt-4 animate-pulse">Redirigiendo al sistema...</p>
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center justify-center py-4">
            {status === "error" ? (
              <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <MailCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {status === "error" ? "Enlace Inválido o Expirado" : "Verifica tu Correo"}
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {status === "error" 
                ? "El enlace de verificación que usaste no es válido o ha expirado. Por favor solicita uno nuevo."
                : `Hemos enviado un enlace de verificación a ${user.email}. Por favor revisa tu bandeja de entrada o carpeta de spam.`
              }
            </p>

            <button
              onClick={resendEmail}
              disabled={isResending || resendSuccess}
              className="w-full bg-[#2FA4A5] hover:bg-[#1D7475] text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mb-4"
            >
              {isResending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : resendSuccess ? (
                "¡Enlace Enviado!"
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reenviar correo de verificación
                </>
              )}
            </button>
            
            {resendSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Se ha enviado un nuevo enlace. Por favor revisa tu correo.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
