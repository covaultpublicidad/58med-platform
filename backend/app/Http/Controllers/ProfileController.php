<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    public function completeProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'specialty' => 'nullable|string|max:255',
            'medical_license' => 'nullable|string|max:255',
            'college_number' => 'nullable|string|max:255',
            'dni' => 'nullable|string|max:255|unique:users,dni,' . $user->id,

            // Datos de Paciente
            'blood_type' => 'nullable|string|max:10',
            'gender' => 'nullable|string|max:50',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'allergies' => 'nullable|string',
            'preexisting_conditions' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_relation' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
        ]);

        $user->update([
            'phone' => $validated['phone'] ?? $user->phone,
            'specialty' => $validated['specialty'] ?? $user->specialty,
            'medical_license' => $validated['medical_license'] ?? $user->medical_license,
            'college_number' => $validated['college_number'] ?? $user->college_number,
            'dni' => $validated['dni'] ?? $user->dni,
            'is_profile_complete' => true,
        ]);

        if ($user->hasRole('Paciente')) {
            $user->patientProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'blood_type' => $validated['blood_type'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'height' => $validated['height'] ?? null,
                    'weight' => $validated['weight'] ?? null,
                    'allergies' => $validated['allergies'] ?? null,
                    'preexisting_conditions' => $validated['preexisting_conditions'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                    'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
                    'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                ]
            );
        }

        return response()->json([
            'message' => 'Perfil completado exitosamente',
            'user' => $user
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'specialty' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'medical_license' => 'nullable|string|max:255',
            'college_number' => 'nullable|string|max:255',
            'dni' => 'nullable|string|max:255|unique:users,dni,' . $user->id,
            // Tenant info
            'tenant_name' => 'nullable|string|max:255',
            'tenant_address' => 'nullable|string|max:255',
            // Patient info
            'blood_type' => 'nullable|string|max:10',
            'gender' => 'nullable|string|max:50',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'allergies' => 'nullable|string',
            'preexisting_conditions' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_relation' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            Log::error('Update Profile Validation Failed', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
            'specialty' => $validated['specialty'] ?? $user->specialty,
            'bio' => $validated['bio'] ?? $user->bio,
            'medical_license' => $validated['medical_license'] ?? $user->medical_license,
            'college_number' => $validated['college_number'] ?? $user->college_number,
            'dni' => $validated['dni'] ?? $user->dni,
        ]);

        if ($user->tenant && $user->tenant->subscription_plan === 'independent') {
            $user->tenant->update([
                'name' => $validated['tenant_name'] ?? $user->tenant->name,
                'address' => $validated['tenant_address'] ?? $user->tenant->address,
            ]);
        }

        if ($user->hasRole('Paciente')) {
            $user->patientProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'blood_type' => $validated['blood_type'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'height' => $validated['height'] ?? null,
                    'weight' => $validated['weight'] ?? null,
                    'allergies' => $validated['allergies'] ?? null,
                    'preexisting_conditions' => $validated['preexisting_conditions'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                    'emergency_contact_relation' => $validated['emergency_contact_relation'] ?? null,
                    'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                ]
            );
        }

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'user' => $user->load('tenant')
        ]);
    }

    public function uploadImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|max:5120', // 5MB Max
            'type' => 'required|string|in:avatar,cover,signature,tenant_logo,tenant_stamp',
        ]);

        if ($validator->fails()) {
            Log::error('Upload Image Validation Failed', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $file = $request->file('image');
        $type = $request->input('type');
        
        $extension = $file->getClientOriginalExtension();
        if (!$extension) {
            $extension = 'jpg';
        }
        $filename = $user->id . '_' . $type . '_' . time() . '.' . $extension;

        $path = $file->storeAs('profiles', $filename, 'public');
        $url = Storage::url($path);

        if ($type === 'avatar') {
            $user->update(['profile_photo_url' => $url, 'profile_photo_path' => $path]);
        } elseif ($type === 'cover') {
            $user->update(['cover_photo_url' => $url, 'cover_photo_path' => $path]);
        } elseif ($type === 'signature') {
            $user->update(['signature_url' => $url]);
        } elseif ($type === 'tenant_logo') {
            if ($user->tenant && $user->tenant->subscription_plan === 'independent') {
                $user->tenant->update(['logo_url' => $url]);
            }
        } elseif ($type === 'tenant_stamp') {
            if ($user->tenant && $user->tenant->subscription_plan === 'independent') {
                $user->tenant->update(['stamp_url' => $url]);
            }
        }

        return response()->json([
            'message' => 'Imagen subida exitosamente',
            'url' => $url,
            'user' => $user->fresh('tenant')
        ]);
    }
}
