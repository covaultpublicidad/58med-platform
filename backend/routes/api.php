<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AssistantController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReceiptController;

use Illuminate\Foundation\Auth\EmailVerificationRequest;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/debug-db', function () {
    $pass = env('DB_PASSWORD', '');
    return response()->json([
        'host' => env('DB_HOST'),
        'user' => env('DB_USERNAME'),
        'pass_length' => strlen($pass),
        'pass_starts_with' => substr($pass, 0, 2),
        'pass_ends_with' => substr($pass, -2),
        'has_hash' => strpos($pass, '#') !== false,
        'exact_match' => $pass === 'RZ-cQ,XXAEnE.#9'
    ]);
});

// Verificación de correo
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();
    return response()->json(['message' => 'Correo verificado exitosamente.']);
})->middleware(['auth:sanctum', 'signed'])->name('verification.verify');

Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return response()->json(['message' => 'Enlace de verificación enviado.']);
})->middleware(['auth:sanctum', 'throttle:6,1'])->name('verification.send');

// Directorio Público y Disponibilidad (No requieren estar logueado)
Route::get('/directory', [DoctorController::class, 'index']);
Route::get('/directory/{id}', [DoctorController::class, 'show']);
Route::get('/doctors/{id}/availability', [DoctorController::class, 'availability']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/force-change-password', [AuthController::class, 'forceChangePassword']);
    
    // Rutas de Perfil (Profile)
    Route::post('/profile/complete', [ProfileController::class, 'completeProfile']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);
    Route::post('/profile/upload-image', [ProfileController::class, 'uploadImage']);

    // Asistentes
    Route::post('/assistants', [AssistantController::class, 'store']);
    Route::get('/assistants', [AssistantController::class, 'myAssistants']);

    // Horarios
    Route::post('/schedules', [ScheduleController::class, 'store']);
    Route::get('/schedules', [ScheduleController::class, 'getMySchedule']);

    // Citas
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::patch('/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);
    Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
    Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    
    // Recibos
    Route::apiResource('receipts', ReceiptController::class);
    Route::get('receipts/{receipt}/pdf', [ReceiptController::class, 'generatePdf']);
    Route::patch('/appointments/{id}/status', [AppointmentController::class, 'updateStatus']);
    Route::put('/appointments/{id}', [AppointmentController::class, 'update']);

    // Dashboard
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

    // Asistentes
    Route::apiResource('assistants', AssistantController::class)->only(['index', 'store', 'destroy']);

    // Pacientes (para médicos y asistentes)
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);

    // Portal del Paciente (Mi Historial)
    Route::get('/patient/my-records', [PatientController::class, 'myRecords']);

    // Módulo Clínico (Historias, Recetas, Informes)
    Route::get('/medical-records/patient/{patientId}', [App\Http\Controllers\MedicalRecordController::class, 'index']);
    Route::post('/medical-records', [App\Http\Controllers\MedicalRecordController::class, 'store']);
    Route::get('/medical-records/{id}', [App\Http\Controllers\MedicalRecordController::class, 'show']);
    Route::patch('/medical-records/{id}/approve', [App\Http\Controllers\MedicalRecordController::class, 'approve']);
    Route::patch('/prescriptions/{id}/approve', [App\Http\Controllers\PrescriptionController::class, 'approve']);
    Route::patch('/reports/{id}/approve', [App\Http\Controllers\MedicalReportController::class, 'approve']);

    // Fragmentos Compartidos
    Route::post('/fragments/request-access', [App\Http\Controllers\FragmentController::class, 'requestAccess']);
    Route::patch('/fragments/requests/{id}/status', [App\Http\Controllers\FragmentController::class, 'updateRequestStatus']);
    
    // Fragmentos (Portal del Paciente)
    Route::get('/fragments/patient-requests', [App\Http\Controllers\FragmentController::class, 'patientRequests']);
    Route::patch('/fragments/patient-requests/{id}/approve', [App\Http\Controllers\FragmentController::class, 'patientApproveRequest']);

    Route::get('/prescriptions/patient/{patientId}', [App\Http\Controllers\PrescriptionController::class, 'index']);
    Route::post('/prescriptions', [App\Http\Controllers\PrescriptionController::class, 'store']);
    Route::get('/prescriptions/{id}', [App\Http\Controllers\PrescriptionController::class, 'show']);
    Route::patch('/prescriptions/{id}/approve', [App\Http\Controllers\PrescriptionController::class, 'approve']);
    Route::get('/prescriptions/{id}/pdf', [App\Http\Controllers\PrescriptionController::class, 'generatePdf']);

    Route::get('/reports/patient/{patientId}', [App\Http\Controllers\MedicalReportController::class, 'index']);
    Route::post('/reports', [App\Http\Controllers\MedicalReportController::class, 'store']);
    Route::get('/reports/{id}', [App\Http\Controllers\MedicalReportController::class, 'show']);
    Route::patch('/reports/{id}/approve', [App\Http\Controllers\MedicalReportController::class, 'approve']);
    Route::get('/reports/{id}/pdf', [App\Http\Controllers\MedicalReportController::class, 'generatePdf']);

    // Bandeja de Aprobaciones
    Route::get('/approvals/pending', [App\Http\Controllers\ApprovalController::class, 'index']);
});
