<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Receipt;
use App\Models\Appointment;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceiptController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $doctorIds = [];

        if ($user->hasRole('Médico')) {
            $doctorIds = [$user->id];
        } elseif ($user->hasRole('Asistente') && $user->tenant_id) {
            $doctorIds = \App\Models\User::role('Médico')
                ->where('tenant_id', $user->tenant_id)
                ->pluck('id')
                ->toArray();
        }

        $receipts = Receipt::with(['patient:id,name,email', 'doctor:id,name,specialty', 'appointment'])
            ->whereIn('doctor_id', $doctorIds)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($receipts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|in:USD,VED',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string',
            'concept' => 'nullable|string',
        ]);

        $appointment = Appointment::findOrFail($validated['appointment_id']);

        $receipt = Receipt::create([
            'tenant_id' => $appointment->tenant_id,
            'appointment_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'doctor_id' => $appointment->doctor_id,
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'payment_method' => $validated['payment_method'],
            'reference' => $validated['reference'],
            'concept' => $validated['concept'] ?? 'Consulta Médica',
            'status' => 'paid',
        ]);

        // Marcar la cita como completada si se pagó
        if ($appointment->status === 'pending') {
            $appointment->update(['status' => 'completed']);
        }

        return response()->json($receipt, 201);
    }

    public function show(Receipt $receipt)
    {
        $receipt->load(['patient', 'doctor', 'appointment']);
        return response()->json($receipt);
    }

    public function generatePdf(Receipt $receipt)
    {
        $receipt->load(['patient', 'doctor', 'appointment']);
        
        $data = [
            'receipt' => $receipt,
            'date' => $receipt->created_at->format('d/m/Y h:i A'),
            'tenant' => $receipt->doctor->tenant,
        ];

        // Ensure you create a view resources/views/pdf/receipt.blade.php
        $pdf = Pdf::loadView('pdf.receipt', $data);
        
        return $pdf->download('recibo_' . $receipt->receipt_number . '.pdf');
    }
}
