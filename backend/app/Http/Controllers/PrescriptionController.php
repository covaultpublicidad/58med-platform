<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class PrescriptionController extends Controller
{
    public function index(Request $request, $patientId)
    {
        $user = $request->user();
        $allowedDoctorIds = [];
        
        if ($user->hasRole('Médico')) {
            $allowedDoctorIds[] = $user->id;
            $sharedDoctorIds = \App\Models\FragmentAccessRequest::where('patient_id', $patientId)
                ->where('requester_doctor_id', $user->id)
                ->where('status', 'approved')
                ->pluck('owner_doctor_id')->toArray();
            $allowedDoctorIds = array_merge($allowedDoctorIds, $sharedDoctorIds);
            
        } elseif ($user->hasRole('Asistente')) {
            $assignedDoctorIds = $user->assignedDoctors()->pluck('users.id')->toArray();
            $allowedDoctorIds = $assignedDoctorIds;
            if (!empty($assignedDoctorIds)) {
                $sharedDoctorIds = \App\Models\FragmentAccessRequest::where('patient_id', $patientId)
                    ->whereIn('requester_doctor_id', $assignedDoctorIds)
                    ->where('status', 'approved')
                    ->pluck('owner_doctor_id')->toArray();
                $allowedDoctorIds = array_merge($allowedDoctorIds, $sharedDoctorIds);
            }
        }

        $prescriptions = Prescription::with(['creator', 'doctor'])
            ->where('patient_id', $patientId)
            ->whereIn('doctor_id', $allowedDoctorIds)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($prescriptions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'medications' => 'required|array',
            'general_instructions' => 'nullable|string',
            'medical_record_id' => 'nullable|exists:medical_records,id'
        ]);

        $user = $request->user();
        $isAssistant = $user->hasRole('Asistente');
        
        $prescription = Prescription::create([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'medical_record_id' => $request->medical_record_id,
            'created_by' => $user->id,
            'medications' => $request->medications,
            'general_instructions' => $request->general_instructions,
            'status' => $isAssistant ? 'pending_approval' : 'approved',
        ]);

        return response()->json($prescription, 201);
    }

    public function show($id)
    {
        $prescription = Prescription::with(['creator', 'doctor', 'patient'])->findOrFail($id);
        return response()->json($prescription);
    }

    public function approve(Request $request, $id)
    {
        $prescription = Prescription::findOrFail($id);
        
        if (!$request->user()->hasRole('Médico')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $prescription->status = 'approved';
        $prescription->save();

        return response()->json(['message' => 'Receta aprobada.', 'prescription' => $prescription]);
    }

    public function generatePdf($id)
    {
        $prescription = Prescription::with(['doctor.tenant', 'patient'])->findOrFail($id);
        
        if ($prescription->status !== 'approved') {
            return response()->json(['message' => 'No se puede generar PDF de un documento pendiente de aprobación.'], 403);
        }

        // Generar texto para el QR
        $qrText = "58MED RECETA VALIDADA\n";
        $qrText .= "Dr. " . $prescription->doctor->name . "\n";
        if ($prescription->doctor->medical_license) {
            $qrText .= "Licencia: " . $prescription->doctor->medical_license . "\n";
        }
        $qrText .= "Paciente: " . $prescription->patient->name . "\n";
        $qrText .= "Fecha: " . $prescription->created_at->format('d/m/Y') . "\n";
        $qrText .= "Medicamentos:\n";
        foreach ($prescription->medications as $med) {
            $qrText .= "- " . ($med['name'] ?? 'Med') . " (" . ($med['dose'] ?? '') . ") - " . ($med['frequency'] ?? '') . "\n";
        }
        $qrText .= "\nValidar online: " . url('/verify/prescription/' . $prescription->id);

        $qrCode = base64_encode(QrCode::format('svg')->size(150)->generate($qrText));

        $pdf = Pdf::loadView('pdfs.prescription', compact('prescription', 'qrCode'));
        
        return $pdf->download('receta_' . $prescription->id . '.pdf');
    }
}
