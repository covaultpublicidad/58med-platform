<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        // 1. Crear un Médico Independiente
        $independentTenant = Tenant::create([
            'name' => 'Consultorio Dr. Miguel Eduardo',
            'subscription_plan' => 'independent',
            'is_active' => true,
        ]);

        $doctor1 = User::create([
            'name' => 'Dr. Miguel Eduardo MED',
            'email' => 'miguel@58med.com',
            'password' => Hash::make('password123'),
            'phone' => '04141234567',
            'dni' => '17622953',
            'specialty' => 'Médico General',
            'medical_license' => '123456',
            'college_number' => '654321',
            'is_profile_complete' => true,
            'email_verified_at' => now(),
            'tenant_id' => $independentTenant->id,
        ]);
        $doctor1->assignRole('Médico');

        // 2. Crear una Clínica y su Médico
        $clinicTenant = Tenant::create([
            'name' => 'Clínica Sanitas',
            'subscription_plan' => 'clinic_basic',
            'is_active' => true,
        ]);

        $doctor2 = User::create([
            'name' => 'Dra. Ana López',
            'email' => 'ana@sanitas.com',
            'password' => Hash::make('password123'),
            'phone' => '04129876543',
            'dni' => '20123456',
            'specialty' => 'Cardiólogo',
            'is_profile_complete' => true,
            'email_verified_at' => now(),
            'tenant_id' => $clinicTenant->id,
        ]);
        $doctor2->assignRole('Médico');

        // 3. Crear un Paciente
        $patient = User::create([
            'name' => 'Juan Pérez (Paciente)',
            'email' => 'juan@paciente.com',
            'password' => Hash::make('password123'),
            'phone' => '04241234567',
            'dni' => '15987654',
            'is_profile_complete' => true,
            'email_verified_at' => now(),
        ]);
        $patient->assignRole('Paciente');
    }
}
