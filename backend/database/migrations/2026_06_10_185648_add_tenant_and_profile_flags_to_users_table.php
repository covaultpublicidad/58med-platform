<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->onDelete('cascade');
            $table->boolean('is_profile_complete')->default(false);
            $table->string('phone')->nullable();
            $table->string('specialty')->nullable(); // For doctors
            $table->string('profile_photo_path', 2048)->nullable();
            $table->string('cover_photo_path', 2048)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn(['tenant_id', 'is_profile_complete', 'phone', 'specialty', 'profile_photo_path', 'cover_photo_path']);
        });
    }
};
