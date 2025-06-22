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
        Schema::create('student_financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id');
            $table->string('amount');
            $table->date('payment_date');
            $table->string('payment_type'); // e.g., 'salary', 'bonus', 'deduction'
            $table->text('remark')->nullable(); // Additional notes or remarks
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_financials');
    }
};
