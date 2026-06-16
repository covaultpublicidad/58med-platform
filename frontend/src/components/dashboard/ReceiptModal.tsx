"use client";

import { useState } from "react";
import axios from "@/lib/axios";
import { X, DollarSign, CreditCard, FileText } from "lucide-react";

interface Appointment {
  id: number;
  patient?: { name: string };
  doctor?: { name: string };
}

interface ReceiptModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiptModal({ appointment, onClose, onSuccess }: ReceiptModalProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [reference, setReference] = useState("");
  const [concept, setConcept] = useState("Consulta Médica");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      setError("Monto inválido");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await axios.post("/api/receipts", {
        appointment_id: appointment.id,
        amount: Number(amount),
        currency,
        payment_method: paymentMethod,
        reference,
        concept,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar el pago");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-500" /> Registrar Pago
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Concepto</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={concept} onChange={e => setConcept(e.target.value)} required className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                     <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500" />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Moneda</label>
                   <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500">
                     <option value="USD">USD ($)</option>
                     <option value="VED">VED (Bs)</option>
                   </select>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500">
                    <option value="Zelle">Zelle</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Punto de Venta">Punto de Venta</option>
                  </select>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Referencia (Opcional)</label>
                <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Ej: 123456789" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500" />
             </div>
          </div>

          <div className="mt-8 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
               Cancelar
             </button>
             <button type="submit" disabled={isSubmitting} className="flex-1 py-2 px-4 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 transition-colors shadow-md shadow-teal-500/20">
               {isSubmitting ? "Registrando..." : "Registrar"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
