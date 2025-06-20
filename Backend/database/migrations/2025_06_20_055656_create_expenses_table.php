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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('amount');
            $table->string('expense_type'); // e.g., travel, food, accommodation
            $table->string('expense_date'); // e.g., 2025-06-20
            $table->string('expense_attachment')->nullable(); // e.g., receipt image path
            $table->string('payment_method'); // e.g., cash, credit card, bank
            $table->string('title'); // e.g., "Business Trip to NYC"
            $table->string('description')->nullable();
            $table->foreignId('student_id')->nullable();
            $table->foreignId('staff_id')->nullable();
            $table->string('payment_status'); // e.g., paid, pending
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
