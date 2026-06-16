<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patient_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('granted_to_tenant_id')->constrained('tenants')->onDelete('cascade'); // A qué clínica/doctor se le da permiso
            $table->foreignId('granted_by_tenant_id')->nullable()->constrained('tenants')->onDelete('set null'); // Qué clínica generó el documento que se va a compartir (null = todas)
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_consents');
    }
};
