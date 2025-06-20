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
        Schema::create('staff_check_in_check_outs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id');
            $table->timestamp('checkin_time')->nullable();
            $table->timestamp('checkout_time')->nullable();
            $table->date('date')->nullable();
            $table->foreignId('block_id')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['present', 'absent', 'leave'])->default('present');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_check_in_check_outs');
    }
};
