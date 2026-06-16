<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FragmentAccessRequest;

class FragmentController extends Controller
{
    public function requestAccess(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            'owner_doctor_id' => 'required|exists:users,id',
        ]);

        $requesterId = $request->user()->id;

        // Verificar si ya existe una solicitud
        $existing = FragmentAccessRequest::where('patient_id', $request->patient_id)
            ->where('requester_doctor_id', $requesterId)
            ->where('owner_doctor_id', $request->owner_doctor_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Ya existe una solicitud para este fragmento.', 'status' => $existing->status], 400);
        }

        $accessRequest = FragmentAccessRequest::create([
            'patient_id' => $request->patient_id,
            'requester_doctor_id' => $requesterId,
            'owner_doctor_id' => $request->owner_doctor_id,
            'patient_approved' => false, 
            'doctor_approved' => false,
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Solicitud enviada exitosamente.', 'data' => $accessRequest], 201);
    }

    public function updateRequestStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,revoked'
        ]);

        $accessRequest = FragmentAccessRequest::findOrFail($id);
        
        // Validar que el que aprueba es el dueño del fragmento
        if ($accessRequest->owner_doctor_id !== $request->user()->id) {
            return response()->json(['message' => 'No autorizado para gestionar esta solicitud.'], 403);
        }

        $accessRequest->doctor_approved = in_array($request->status, ['approved']);
        
        // Si el paciente también lo aprobó, pasa a approved, si no queda pending
        if ($request->status === 'approved' && $accessRequest->patient_approved) {
            $accessRequest->status = 'approved';
        } else {
            $accessRequest->status = $request->status;
        }

        $accessRequest->save();

        return response()->json(['message' => 'Estado actualizado.', 'data' => $accessRequest]);
    }

    public function patientRequests(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('Paciente')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Obtener solicitudes donde doctor_approved es true y patient_approved es false
        $requests = FragmentAccessRequest::with(['requester', 'owner'])
            ->where('patient_id', $user->id)
            ->where('status', 'pending')
            ->get();

        return response()->json($requests);
    }

    public function patientApproveRequest(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $user = $request->user();

        if (!$user->hasRole('Paciente')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $accessRequest = FragmentAccessRequest::findOrFail($id);

        if ($accessRequest->patient_id !== $user->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $accessRequest->patient_approved = $request->status === 'approved';
        
        // Si ambos aprueban, cambiar a approved
        if ($accessRequest->patient_approved && $accessRequest->doctor_approved) {
            $accessRequest->status = 'approved';
        } else if ($request->status === 'rejected') {
            $accessRequest->status = 'rejected';
        }

        $accessRequest->save();

        return response()->json(['message' => 'Estado actualizado.', 'data' => $accessRequest]);
    }
}
