<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        $user = $request->user();
        $doctorIds = [];

        if ($user->hasRole('Médico')) {
            $doctorIds = [$user->id];
        } elseif ($user->hasRole('Asistente')) {
            $doctorIds = DB::table('assistant_doctor')
                ->where('assistant_id', $user->id)
                ->pluck('doctor_id')
                ->toArray();
        } else {
            // Para el paciente, métricas diferentes o error
            return response()->json(['message' => 'Not available for this role'], 403);
        }

        // Citas de hoy
        $todayAppointments = Appointment::whereIn('doctor_id', $doctorIds)
            ->whereBetween('appointment_date', [Carbon::today()->startOfDay(), Carbon::today()->endOfDay()])
            ->count();

        // Pacientes únicos
        $totalPatients = Appointment::whereIn('doctor_id', $doctorIds)
            ->distinct('patient_id')
            ->count('patient_id');

        // Próximas 5 citas
        $upcomingAppointments = Appointment::with('patient:id,name,profile_photo_url')
            ->whereIn('doctor_id', $doctorIds)
            ->where('appointment_date', '>=', Carbon::today()->startOfDay())
            ->orderBy('appointment_date')
            ->limit(5)
            ->get()->map(function($apt) {
                $apt->date = Carbon::parse($apt->appointment_date)->format('Y-m-d');
                $apt->time = Carbon::parse($apt->appointment_date)->format('H:i');
                return $apt;
            });

        // Datos para gráfico: Últimos 7 días
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $count = Appointment::whereIn('doctor_id', $doctorIds)
                ->whereBetween('appointment_date', [$date->copy()->startOfDay(), $date->copy()->endOfDay()])
                ->count();
            
            $chartData[] = [
                'day' => $date->locale('es')->shortDayName,
                'citas' => $count
            ];
        }

        return response()->json([
            'today_appointments' => $todayAppointments,
            'total_patients' => $totalPatients,
            'upcoming' => $upcomingAppointments,
            'chart_data' => $chartData
        ]);
    }
}
