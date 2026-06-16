<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assistant_doctor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assistant_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['assistant_id', 'doctor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_doctor');
    }
};
