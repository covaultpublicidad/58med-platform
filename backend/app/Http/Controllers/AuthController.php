<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\Registered;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:Paciente,Médico',
            'dni' => 'nullable|string|max:255', // Permite buscar una cuenta fantasma por DNI
        ], [
            'email.unique' => 'Este correo electrónico ya se encuentra registrado.',
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'role.required' => 'Debes seleccionar un rol para tu cuenta.',
            'role.in' => 'El rol seleccionado no es válido.',
        ]);

        // Account Claiming: Verificar si hay una cuenta fantasma con este DNI y/o Nombre si se envía
        $user = null;
        if ($request->filled('dni')) {
            $user = User::where('dni', $request->dni)->whereNull('email')->first();
        }

        if ($user) {
            // Actualizar cuenta fantasma
            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
        } else {
            // Crear cuenta nueva
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
            $user->assignRole($request->role);
        }

        // Crear y asignar Tenant Independiente si es Médico y no tiene
        if ($user->hasRole('Médico') && !$user->tenant_id) {
            $tenant = Tenant::create([
                'name' => 'Consultorio de ' . $user->name,
                'subscription_plan' => 'independent',
                'is_active' => true,
            ]);
            $user->update(['tenant_id' => $tenant->id]);
        }

        event(new Registered($user));

        Auth::login($user);

        return response()->json($user->load('roles'), 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ], [
            'email.required' => 'El correo electrónico es obligatorio.',
            'password.required' => 'La contraseña es obligatoria.',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json(Auth::user());
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada exitosamente']);
    }

    public function forceChangePassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!$user->must_change_password) {
            return response()->json(['message' => 'No necesitas cambiar tu contraseña.'], 400);
        }

        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles', 'tenant', 'patientProfile');
        if ($user->hasRole('Asistente')) {
            $user->load('assignedDoctors');
        }
        return response()->json($user);
    }
}
