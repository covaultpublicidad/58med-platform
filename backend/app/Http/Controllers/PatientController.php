<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    /**
     * Obtener la lista de pacientes de los médicos (para Doctores o Asistentes).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $doctorIds = [];
        if ($user->hasRole('Médico')) {
            $doctorIds = [$user->id];
        } elseif ($user->hasRole('Asistente')) {
            $doctorIds = $user->assignedDoctors()->pluck('users.id')->toArray();
        } else {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if (empty($doctorIds)) {
            return response()->json([]);
        }

        // Obtener IDs únicos de pacientes que tienen citas con estos doctores
        $patientIds = Appointment::whereIn('doctor_id', $doctorIds)
            ->distinct()
            ->pluck('patient_id');

        // Cargar los usuarios pacientes con su perfil médico y sus últimas citas
        $patients = User::with(['patientProfile'])
            ->whereIn('id', $patientIds)
            ->get()
            ->map(function ($patient) use ($doctorIds) {
                // Obtener datos resumidos de las citas
                $appointments = Appointment::with('doctor:id,name')
                    ->where('patient_id', $patient->id)
                    ->whereIn('doctor_id', $doctorIds)
                    ->orderBy('appointment_date', 'desc')
                    ->get();

                return [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'dni' => $patient->dni,
                    'profile_photo_url' => $patient->profile_photo_url,
                    'blood_type' => $patient->patientProfile->blood_type ?? null,
                    'allergies' => $patient->patientProfile->allergies ?? null,
                    'appointments_count' => $appointments->count(),
                    'last_appointment' => $appointments->first(),
                ];
            });

        return response()->json($patients);
    }

    /**
     * Obtener el historial completo del paciente logueado (Récipes e Informes aprobados).
     */
    public function myRecords(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('Paciente')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $prescriptions = \App\Models\Prescription::with(['doctor'])
            ->where('patient_id', $user->id)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        $reports = \App\Models\MedicalReport::with(['doctor'])
            ->where('patient_id', $user->id)
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'prescriptions' => $prescriptions,
            'reports' => $reports
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $doctorIds = [];
        if ($user->hasRole('Médico')) {
            $doctorIds = [$user->id];
        } elseif ($user->hasRole('Asistente')) {
            $doctorIds = $user->assignedDoctors()->pluck('users.id')->toArray();
        } else {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if (empty($doctorIds)) {
            return response()->json(['message' => 'Paciente no encontrado o no tiene acceso.'], 404);
        }

        $patient = User::with(['patientProfile'])->findOrFail($id);

        // Opcional: Validar si este paciente tiene alguna cita con estos doctores para evitar que vean a cualquier usuario.
        $hasAccess = Appointment::where('patient_id', $id)->whereIn('doctor_id', $doctorIds)->exists();
        
        if (!$hasAccess) {
            // Si el paciente nunca ha tenido cita con este médico, denegar
            return response()->json(['message' => 'No autorizado a ver este expediente.'], 403);
        }

        // Buscar fragmentos ocultos (otros doctores que han atendido al paciente)
        $otherDoctorIds = Appointment::where('patient_id', $id)
            ->whereNotIn('doctor_id', $doctorIds)
            ->distinct()
            ->pluck('doctor_id');

        $otherDoctors = User::whereIn('id', $otherDoctorIds)->select('id', 'name', 'specialty')->get();

        foreach ($otherDoctors as $doc) {
            $req = \App\Models\FragmentAccessRequest::where('patient_id', $id)
                ->where('owner_doctor_id', $doc->id)
                ->where('requester_doctor_id', $user->id)
                ->first();
            $doc->access_status = $req ? $req->status : null;
        }

        return response()->json([
            'id' => $patient->id,
            'name' => $patient->name,
            'email' => $patient->email,
            'phone' => $patient->phone,
            'dni' => $patient->dni,
            'profile_photo_url' => $patient->profile_photo_url,
            'blood_type' => $patient->patientProfile->blood_type ?? null,
            'allergies' => $patient->patientProfile->allergies ?? null,
            'gender' => $patient->patientProfile->gender ?? null,
            'height' => $patient->patientProfile->height ?? null,
            'weight' => $patient->patientProfile->weight ?? null,
            'preexisting_conditions' => $patient->patientProfile->preexisting_conditions ?? null,
            'address' => $patient->patientProfile->address ?? null,
            'hidden_fragments' => $otherDoctors,
            'granted_accesses' => \App\Models\FragmentAccessRequest::with('requester')
                ->where('patient_id', $id)
                ->where('owner_doctor_id', $user->id)
                ->where('status', 'approved')
                ->get(),
        ]);
    }
}
