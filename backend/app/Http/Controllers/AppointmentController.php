<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\AppointmentCreated;
use App\Mail\AppointmentConfirmed;
use App\Mail\AppointmentRescheduled;
use App\Mail\AppointmentCancelled;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Si es médico, cargar sus citas como doctor y obtener los datos del paciente
        if ($user->hasRole('Médico')) {
            $appointments = Appointment::with(['patient.patientProfile', 'doctor'])
                ->where('doctor_id', $user->id)
                ->orderBy('appointment_date', 'asc')
                ->get();
            return response()->json($appointments);
        } elseif ($user->hasRole('Asistente')) {
            $doctorIds = $user->assignedDoctors()->pluck('users.id');
            $appointments = Appointment::with(['patient.patientProfile', 'doctor'])
                ->whereIn('doctor_id', $doctorIds)
                ->orderBy('appointment_date', 'asc')
                ->get();
            return response()->json($appointments);
        } elseif ($user->hasRole('Paciente')) {
            $appointments = Appointment::with('doctor')
                ->where('patient_id', $user->id)
                ->orderBy('appointment_date', 'asc')
                ->get();
            return response()->json($appointments);
        }

        return response()->json([], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'date' => 'required|date_format:Y-m-d',
            'time' => 'required|date_format:H:i',
            'reason' => 'nullable|string',
            
            // Campos para paciente (Fantasma o logueado)
            'patient_name' => 'required_without:patient_id|string|max:255',
            'patient_phone' => 'required_without:patient_id|string|max:20',
            'patient_dni' => 'required_without:patient_id|string|max:255',
            'patient_email' => 'nullable|email',
            'patient_id' => 'nullable|exists:users,id'
        ]);

        $doctor = User::role('Médico')->findOrFail($request->doctor_id);
        $appointmentDateTime = Carbon::parse($request->date . ' ' . $request->time);

        DB::beginTransaction();

        try {
            // Verificar sobre-reserva en tiempo real (Lock para concurrencia)
            $duration = $doctor->appointment_duration ?? 30;
            $conflictingAppointment = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $request->date)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where(function ($query) use ($appointmentDateTime, $duration) {
                    $query->where('appointment_date', $appointmentDateTime)
                          ->orWhereBetween('appointment_date', [
                              $appointmentDateTime->copy()->subMinutes($duration - 1),
                              $appointmentDateTime->copy()->addMinutes($duration - 1)
                          ]);
                })
                ->lockForUpdate()
                ->first();

            if ($conflictingAppointment) {
                return response()->json(['message' => 'El horario seleccionado ya no está disponible.'], 409);
            }

            // Gestionar Paciente (Fantasma o Real)
            $patient = null;
            $user = $request->user();
            
            if ($user && $user->hasRole('Paciente')) {
                $patient = $user;
            } elseif ($user && ($user->hasRole('Médico') || $user->hasRole('Asistente'))) {
                if ($request->has('patient_id')) {
                    $patient = User::findOrFail($request->patient_id);
                } else {
                    $patient = User::where('dni', $request->patient_dni)
                                   ->orWhere('phone', $request->patient_phone)
                                   ->first();
                    if (!$patient) {
                        $patient = User::create([
                            'name' => $request->patient_name,
                            'phone' => $request->patient_phone,
                            'dni' => $request->patient_dni,
                            'email' => $request->patient_email,
                            'password' => null,
                            'is_profile_complete' => false,
                        ]);
                        $patient->assignRole('Paciente');
                    }
                }
                
                if ($user->hasRole('Asistente') && !$user->assignedDoctors()->where('users.id', $doctor->id)->exists()) {
                    return response()->json(['message' => 'No estás asignado a este médico.'], 403);
                }
            } else {
                $patient = User::where('dni', $request->patient_dni)
                               ->orWhere('phone', $request->patient_phone)
                               ->first();

                if (!$patient) {
                    $patient = User::create([
                        'name' => $request->patient_name,
                        'phone' => $request->patient_phone,
                        'dni' => $request->patient_dni,
                        'email' => $request->patient_email,
                        'password' => null,
                        'is_profile_complete' => false,
                    ]);
                    $patient->assignRole('Paciente');
                }
            }

            // Crear Cita
            $appointment = Appointment::create([
                'tenant_id' => $doctor->tenant_id,
                'doctor_id' => $doctor->id,
                'patient_id' => $patient->id,
                'appointment_date' => $appointmentDateTime,
                'status' => 'pending',
                'reason' => $request->reason,
            ]);

            DB::commit();

            // Enviar correos si hay email configurado
            if ($patient->email) {
                Mail::to($patient->email)->send(new AppointmentCreated($appointment, false));
            }
            if ($doctor->email) {
                Mail::to($doctor->email)->send(new AppointmentCreated($appointment, true));
            }

            return response()->json(['message' => 'Cita agendada exitosamente', 'appointment' => $appointment], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Ocurrió un error al agendar la cita.', 'error' => $e->getMessage()], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,cancelled,completed',
        ]);

        $user = $request->user();
        $appointment = Appointment::findOrFail($id);

        // Permisos
        if ($user->hasRole('Paciente')) {
            if ($appointment->patient_id !== $user->id) {
                return response()->json(['message' => 'No tienes permiso para modificar esta cita.'], 403);
            }
            if (!in_array($request->status, ['cancelled', 'confirmed'])) {
                return response()->json(['message' => 'Los pacientes solo pueden confirmar o cancelar citas.'], 403);
            }
        } elseif ($user->hasRole('Médico')) {
            if ($appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'No tienes permiso para modificar esta cita.'], 403);
            }
        } elseif ($user->hasRole('Asistente')) {
            if (!$user->assignedDoctors()->where('users.id', $appointment->doctor_id)->exists()) {
                return response()->json(['message' => 'No tienes permiso para modificar esta cita.'], 403);
            }
        } else {
            return response()->json(['message' => 'Rol no autorizado.'], 403);
        }

        // Reglas de negocio básicas:
        if (in_array($appointment->status, ['completed', 'cancelled'])) {
            return response()->json(['message' => 'No se puede modificar una cita que ya ha finalizado o sido cancelada.'], 422);
        }

        $appointment->status = $request->status;
        $appointment->save();

        // Enviar correos
        if ($appointment->status === 'confirmed' && $appointment->patient->email) {
            Mail::to($appointment->patient->email)->send(new AppointmentConfirmed($appointment));
        }

        if ($appointment->status === 'cancelled') {
            if ($user->hasRole('Médico') && $appointment->patient->email) {
                Mail::to($appointment->patient->email)->send(new AppointmentCancelled($appointment, 'doctor'));
            } elseif ($user->hasRole('Paciente') && $appointment->doctor->email) {
                Mail::to($appointment->doctor->email)->send(new AppointmentCancelled($appointment, 'patient'));
            }
        }

        return response()->json([
            'message' => 'Estado de la cita actualizado',
            'appointment' => $appointment
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'time' => 'required|date_format:H:i',
        ]);

        $user = $request->user();
        if (!$user->hasRole('Médico') && !$user->hasRole('Asistente')) {
            return response()->json(['message' => 'Solo los médicos y asistentes pueden reprogramar citas.'], 403);
        }

        $appointment = Appointment::findOrFail($id);
        if ($user->hasRole('Médico') && $appointment->doctor_id !== $user->id) {
            return response()->json(['message' => 'No tienes permiso.'], 403);
        }
        if ($user->hasRole('Asistente') && !$user->assignedDoctors()->where('users.id', $appointment->doctor_id)->exists()) {
            return response()->json(['message' => 'No tienes permiso.'], 403);
        }

        if (in_array($appointment->status, ['completed', 'cancelled'])) {
            return response()->json(['message' => 'No se puede modificar una cita finalizada o cancelada.'], 422);
        }

        $doctor = User::findOrFail($appointment->doctor_id);
        $newDateTime = Carbon::parse($request->date . ' ' . $request->time);
        $oldDate = $appointment->appointment_date;

        // Verificar conflictos
        $duration = $doctor->appointment_duration ?? 30;
        $conflictingAppointment = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $request->date)
            ->where('id', '!=', $appointment->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($newDateTime, $duration) {
                $query->where('appointment_date', $newDateTime)
                      ->orWhereBetween('appointment_date', [
                          $newDateTime->copy()->subMinutes($duration - 1),
                          $newDateTime->copy()->addMinutes($duration - 1)
                      ]);
            })
            ->first();

        if ($conflictingAppointment) {
            return response()->json(['message' => 'El horario seleccionado no está disponible.'], 409);
        }

        $appointment->appointment_date = $newDateTime;
        // Al reprogramar, vuelve a estado pendiente según reglas de negocio
        $appointment->status = 'pending';
        $appointment->save();

        if ($appointment->patient->email) {
            Mail::to($appointment->patient->email)->send(new AppointmentRescheduled($appointment, $oldDate));
        }

        return response()->json([
            'message' => 'Cita reprogramada exitosamente',
            'appointment' => $appointment
        ]);
    }
}
