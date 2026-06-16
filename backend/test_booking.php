<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $doctor = App\Models\User::role('Médico')->first();
    if (!$doctor) throw new Exception("No doctor");

    $patient = App\Models\User::role('Paciente')->first();
    if (!$patient) throw new Exception("No patient");

    $appointmentDateTime = Carbon\Carbon::parse('2026-06-17 10:20');
    
    $appointment = App\Models\Appointment::create([
        'tenant_id' => $doctor->tenant_id ?? 1,
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'appointment_date' => $appointmentDateTime,
        'status' => 'pending',
        'reason' => 'cita para chequeo anual',
    ]);
    
    echo "Success: " . $appointment->id;
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
