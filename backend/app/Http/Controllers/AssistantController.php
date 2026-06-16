<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AssistantController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('Médico')) {
            return response()->json(['message' => 'Solo los médicos pueden ver sus asistentes.'], 403);
        }

        return response()->json($user->assignedAssistants()->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('Médico')) {
            return response()->json(['message' => 'Solo los médicos pueden agregar asistentes.'], 403);
        }

        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'dni' => 'nullable|string|max:255',
        ]);

        $assistant = User::where('email', $request->email)->first();

        if ($assistant) {
            // Usuario existe
            if (!$assistant->hasRole('Asistente')) {
                $assistant->assignRole('Asistente');
            }
        } else {
            // Crear el usuario con password temporal
            $assistant = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'dni' => $request->dni,
                'password' => Hash::make('password123'),
                'must_change_password' => true,
                'is_profile_complete' => true, // Para que no se le pida setup-profile
                'email_verified_at' => now(), // Auto-verificar correo porque fue creado por un médico
            ]);
            $assistant->assignRole('Asistente');
        }

        // Vincular al médico
        if (!$user->assignedAssistants()->where('assistant_id', $assistant->id)->exists()) {
            $user->assignedAssistants()->attach($assistant->id);
        }

        return response()->json([
            'message' => 'Asistente agregado exitosamente',
            'assistant' => $assistant
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->hasRole('Médico')) {
            return response()->json(['message' => 'Solo los médicos pueden desvincular asistentes.'], 403);
        }

        $user->assignedAssistants()->detach($id);

        return response()->json(['message' => 'Asistente desvinculado exitosamente']);
    }
}
