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
        Schema::create('staff_salary_generates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id');
            $table->string('salary_amount');
            $table->year('year');
            $table->string('month');
            $table->date('payment_date')->nullable();
            $table->foreignId('payment_type_id')->nullable();
            $table->text('remark')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_salary_generates');
    }
};
