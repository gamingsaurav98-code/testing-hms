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
        Schema::create('student_checkout_financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id');
            $table->foreignId('checkout_id');
            $table->string('checkout_duration')->nullable();
            $table->string('deducted_amount')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_checkout_financials');
    }
};
