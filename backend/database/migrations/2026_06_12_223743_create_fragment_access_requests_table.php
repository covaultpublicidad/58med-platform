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
        Schema::create('fragment_access_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('requester_doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('owner_doctor_id')->constrained('users')->onDelete('cascade');
            
            $table->boolean('patient_approved')->default(false);
            $table->boolean('doctor_approved')->default(false);
            $table->enum('status', ['pending', 'approved', 'rejected', 'revoked'])->default('pending');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fragment_access_requests');
    }
};
