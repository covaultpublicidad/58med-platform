<?php

namespace App\Http\Controllers;

use App\Models\MedicalRecord;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
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

        $records = MedicalRecord::with(['creator', 'doctor'])
            ->where('patient_id', $patientId)
            ->whereIn('doctor_id', $allowedDoctorIds)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($records);
    }

    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'symptoms' => 'nullable|string',
            'physical_exam' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'treatment_plan' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'appointment_id' => 'nullable|exists:appointments,id'
        ]);

        $user = $request->user();
        $isAssistant = $user->hasRole('Asistente');
        
        $record = MedicalRecord::create([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'appointment_id' => $request->appointment_id,
            'created_by' => $user->id,
            'vital_signs' => $request->vital_signs,
            'symptoms' => $request->symptoms,
            'physical_exam' => $request->physical_exam,
            'diagnosis' => $request->diagnosis,
            'treatment_plan' => $request->treatment_plan,
            'status' => $isAssistant ? 'pending_approval' : 'approved',
        ]);

        return response()->json($record, 201);
    }

    public function show($id)
    {
        $record = MedicalRecord::with(['creator', 'doctor'])->findOrFail($id);
        return response()->json($record);
    }

    public function approve(Request $request, $id)
    {
        $record = MedicalRecord::findOrFail($id);
        
        // Solo el médico asignado o con rol de Médico puede aprobar
        if (!$request->user()->hasRole('Médico')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $record->status = 'approved';
        $record->save();

        return response()->json(['message' => 'Historia Clínica aprobada.', 'record' => $record]);
    }
}
