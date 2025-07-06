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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_name')->unique();
            $table->foreignId('block_id');
            $table->integer('capacity');
            $table->enum('status', ['available', 'occupied', 'maintenance'])->default('available');
            $table->string('room_type'); // e.g., single, double, triple, four-bed
            $table->string('room_attachment')->nullable(); // e.g., image or document attachment
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
