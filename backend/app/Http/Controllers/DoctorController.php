<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $query = User::role('Médico')->with(['tenant', 'roles']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('specialty', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $doctor = User::role('Médico')->with(['tenant'])->findOrFail($id);
        return response()->json($doctor);
    }

    public function availability(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d'
        ]);

        $doctor = User::role('Médico')->findOrFail($id);
        $date = Carbon::parse($request->date);
        $dayOfWeek = $date->dayOfWeek; // 0 = Domingo, 1 = Lunes, etc.

        $schedules = $doctor->doctorSchedules()->where('day_of_week', $dayOfWeek)->where('is_active', true)->get();

        if ($schedules->isEmpty()) {
            return response()->json([]);
        }

        $duration = $doctor->appointment_duration ?? 30;
        $buffer = $doctor->buffer_time ?? 0;
        $totalSlotTime = $duration + $buffer;

        // Citas ya reservadas para ese día (para no sobreescribir)
        // Buscamos las citas que pertenezcan a ese doctor ese día
        $bookedAppointments = $doctor->doctorAppointments()
            ->whereDate('appointment_date', $date->format('Y-m-d'))
            ->whereIn('status', ['pending', 'confirmed'])
            ->get()
            ->map(function ($appt) use ($duration) {
                $start = Carbon::parse($appt->appointment_date);
                return [
                    'start' => $start->format('H:i'),
                    'end' => $start->copy()->addMinutes($duration)->format('H:i')
                ];
            });

        $availableSlots = [];

        foreach ($schedules as $schedule) {
            $startTime = Carbon::parse($date->format('Y-m-d') . ' ' . $schedule->start_time);
            $endTime = Carbon::parse($date->format('Y-m-d') . ' ' . $schedule->end_time);

            $currentSlot = $startTime->copy();

            while ($currentSlot->copy()->addMinutes($duration)->lte($endTime)) {
                $slotStartString = $currentSlot->format('H:i');
                $slotEndString = $currentSlot->copy()->addMinutes($duration)->format('H:i');

                // Validar si choca con alguna cita existente
                $isBooked = $bookedAppointments->contains(function ($booked) use ($slotStartString, $slotEndString) {
                    return ($slotStartString >= $booked['start'] && $slotStartString < $booked['end']) ||
                           ($slotEndString > $booked['start'] && $slotEndString <= $booked['end']);
                });

                if (!$isBooked) {
                    $availableSlots[] = $slotStartString;
                }

                $currentSlot->addMinutes($totalSlotTime);
            }
        }

        return response()->json(array_values(array_unique($availableSlots)));
    }
}
