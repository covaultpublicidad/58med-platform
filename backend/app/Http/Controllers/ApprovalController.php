<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\MedicalReport;

class ApprovalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user->hasRole('Médico')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $records = MedicalRecord::with(['creator', 'patient'])
            ->where('doctor_id', $user->id)
            ->where('status', 'pending_approval')
            ->orderBy('created_at', 'desc')
            ->get();

        $prescriptions = Prescription::with(['creator', 'patient'])
            ->where('doctor_id', $user->id)
            ->where('status', 'pending_approval')
            ->orderBy('created_at', 'desc')
            ->get();

        $reports = \App\Models\MedicalReport::with(['creator', 'patient'])
            ->where('doctor_id', $user->id)
            ->where('status', 'pending_approval')
            ->get();

        $fragmentRequests = \App\Models\FragmentAccessRequest::with(['requester', 'patient'])
            ->where('owner_doctor_id', $user->id)
            ->where('status', 'pending')
            ->get();

        return response()->json([
            'medical_records' => $records,
            'prescriptions' => $prescriptions,
            'medical_reports' => $reports,
            'fragment_requests' => $fragmentRequests
        ]);
    }
}
