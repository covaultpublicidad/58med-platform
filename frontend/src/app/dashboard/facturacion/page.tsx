"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { DollarSign, FileText, Download, Calendar as CalendarIcon, User, Search, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Receipt {
  id: number;
  receipt_number: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference: string | null;
  concept: string;
  status: string;
  created_at: string;
  patient: {
    name: string;
    email: string;
  };
  doctor: {
    name: string;
  };
}

export default function FacturacionPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/api/receipts");
      setReceipts(res.data.data || res.data); // Support pagination if present
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (receiptId: number, receiptNumber: string) => {
    try {
      const res = await axios.get(`/api/receipts/${receiptId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo_${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Error al descargar el recibo.");
    }
  };

  const filteredReceipts = receipts.filter(receipt => 
    receipt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.concept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUSD = receipts.filter(r => r.currency === "USD").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalVED = receipts.filter(r => r.currency === "VED").reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-teal-500" />
          Facturación y Cobranza
        </h1>
        <p className="text-slate-500 mt-2">Historial de pagos, recibos emitidos y control de caja.</p>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Ingresos USD</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${totalUSD.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Ingresos VED</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Bs. {totalVED.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Recibos</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{receipts.length}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por paciente, recibo o concepto..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm shadow-sm">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {/* Receipts List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No hay recibos</h3>
            <p className="text-slate-500">Aún no has registrado ningún pago.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Recibo</th>
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Paciente</th>
                  <th className="p-4 font-semibold">Concepto</th>
                  <th className="p-4 font-semibold">Método</th>
                  <th className="p-4 font-semibold text-right">Monto</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceipts.map(receipt => (
                  <tr key={receipt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-slate-900 dark:text-white">{receipt.receipt_number}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <span>{format(parseISO(receipt.created_at), "dd MMM yyyy", { locale: es })}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{receipt.patient.name}</p>
                          <p className="text-xs text-slate-500">{receipt.patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {receipt.concept}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {receipt.payment_method}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {receipt.currency === 'USD' ? '$' : 'Bs.'} {Number(receipt.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDownloadPdf(receipt.id, receipt.receipt_number)}
                        className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
