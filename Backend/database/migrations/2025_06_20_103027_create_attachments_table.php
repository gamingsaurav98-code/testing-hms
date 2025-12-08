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
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('path');
            $table->string('type');
            $table->foreignId('student_id')->nullable();
            $table->foreignId('staff_id')->nullable();
            $table->foreignId('expense_id')->nullable();
            $table->foreignId('inquiry_id')->nullable();
            $table->foreignId('block_id')->nullable();
            $table->foreignId('complain_id')->nullable();
            $table->foreignId('shareholder_id')->nullable();
            $table->foreignId('supplier_id')->nullable();
            $table->foreignId('notice_id')->nullable();
            $table->foreignId('income_id')->nullable();
            $table->foreignId('room_id')->nullable();
            $table->foreignId('salary_id')->nullable();
            $table->foreignId('salary_payment_id')->nullable();
            $table->foreignId('user_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
