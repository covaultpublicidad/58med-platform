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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->onDelete('set null');
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('USD'); // USD o VED
            $table->string('payment_method'); // Zelle, Pago Móvil, Efectivo, Transferencia, Punto de Venta
            $table->string('reference')->nullable(); // Número de referencia del pago
            $table->text('concept')->nullable(); // "Consulta Médica", "Examen", etc.
            
            $table->string('status')->default('paid'); // paid, voided
            $table->string('receipt_number')->unique(); // e.g., REC-00001
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
