<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('medical_license')->nullable(); // Matrícula Médica (MPPS)
            $table->string('college_number')->nullable(); // Número de Colegiatura
            $table->string('dni')->nullable(); // Documento de Identidad / DNI / Cédula
        });

        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->string('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_relation')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->text('preexisting_conditions')->nullable();
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->string('rif')->nullable();
            $table->json('social_media')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['medical_license', 'college_number', 'dni']);
        });

        Schema::table('patient_profiles', function (Blueprint $table) {
            $table->dropColumn(['address', 'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone', 'preexisting_conditions']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['rif', 'social_media']);
        });
    }
};
