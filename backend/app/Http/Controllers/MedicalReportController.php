<?php

namespace App\Http\Controllers;

use App\Models\MedicalReport;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class MedicalReportController extends Controller
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

        $reports = MedicalReport::with(['creator', 'doctor'])
            ->where('patient_id', $patientId)
            ->whereIn('doctor_id', $allowedDoctorIds)
            ->orderBy('date', 'desc')
            ->get();
            
        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'title' => 'required|string',
            'content' => 'required|string',
            'date' => 'required|date',
        ]);

        $user = $request->user();
        $isAssistant = $user->hasRole('Asistente');
        
        $report = MedicalReport::create([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'created_by' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'date' => $request->date,
            'status' => $isAssistant ? 'pending_approval' : 'approved',
        ]);

        return response()->json($report, 201);
    }

    public function show($id)
    {
        $report = MedicalReport::with(['creator', 'doctor', 'patient'])->findOrFail($id);
        return response()->json($report);
    }

    public function approve(Request $request, $id)
    {
        $report = MedicalReport::findOrFail($id);
        
        if (!$request->user()->hasRole('Médico')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $report->status = 'approved';
        $report->save();

        return response()->json(['message' => 'Informe aprobado.', 'report' => $report]);
    }

    public function generatePdf($id)
    {
        $report = MedicalReport::with(['doctor.tenant', 'patient'])->findOrFail($id);
        
        if ($report->status !== 'approved') {
            return response()->json(['message' => 'No se puede generar PDF de un documento pendiente de aprobación.'], 403);
        }

        // Generar texto para el QR
        $qrText = "58MED INFORME VALIDADO\n";
        $qrText .= "Dr. " . $report->doctor->name . "\n";
        $qrText .= "Paciente: " . $report->patient->name . "\n";
        $qrText .= "Fecha: " . $report->date . "\n";
        $qrText .= "Título: " . $report->title . "\n";
        $qrText .= "\nValidar online: " . url('/verify/report/' . $report->id);

        $qrCode = base64_encode(QrCode::format('svg')->size(150)->generate($qrText));

        $pdf = Pdf::loadView('pdfs.report', compact('report', 'qrCode'));
        
        return $pdf->download('informe_' . $report->id . '.pdf');
    }
}
