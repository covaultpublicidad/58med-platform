<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DoctorSchedule;

class ScheduleController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        
        $targetDoctor = $user;
        if ($user->hasRole('Asistente')) {
            $request->validate(['doctor_id' => 'required|exists:users,id']);
            if (!$user->assignedDoctors()->where('users.id', $request->doctor_id)->exists()) {
                return response()->json(['message' => 'No estás asignado a este médico.'], 403);
            }
            $targetDoctor = \App\Models\User::find($request->doctor_id);
        }
        $validated = $request->validate([
            'appointment_duration' => 'nullable|integer|min:5|max:120',
            'buffer_time' => 'nullable|integer|min:0|max:60',
            'schedules' => 'required|array',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            'schedules.*.is_active' => 'boolean',
        ]);

        $targetDoctor->update([
            'appointment_duration' => $validated['appointment_duration'] ?? 30,
            'buffer_time' => $validated['buffer_time'] ?? 0,
        ]);

        $targetDoctor->doctorSchedules()->delete();

        $createdSchedules = [];
        foreach ($validated['schedules'] as $schedule) {
            $createdSchedules[] = $targetDoctor->doctorSchedules()->create([
                'day_of_week' => $schedule['day_of_week'],
                'start_time' => $schedule['start_time'],
                'end_time' => $schedule['end_time'],
                'is_active' => $schedule['is_active'] ?? true,
            ]);
        }

        return response()->json([
            'message' => 'Horario actualizado correctamente',
            'schedules' => $createdSchedules
        ]);
    }

    public function getMySchedule(Request $request)
    {
        $user = $request->user();
        $targetDoctor = $user;
        if ($user->hasRole('Asistente')) {
            if (!$request->has('doctor_id')) {
                return response()->json(['message' => 'doctor_id es requerido para el asistente.'], 400);
            }
            if (!$user->assignedDoctors()->where('users.id', $request->doctor_id)->exists()) {
                return response()->json(['message' => 'No estás asignado a este médico.'], 403);
            }
            $targetDoctor = \App\Models\User::find($request->doctor_id);
        }

        $schedules = $targetDoctor->doctorSchedules;
        return response()->json($schedules);
    }
}
