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
        Schema::create('student_fee_generates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id');
            $table->string('fee_type');
            $table->string('amount');
            $table->year('year');
            $table->string('month');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_fee_generates');
    }
};
