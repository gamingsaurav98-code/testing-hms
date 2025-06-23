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
            $table->foreignId('student_id');
            $table->foreignId('staff_id');
            $table->foreignId('expense_id');
            $table->foreignId('inquiry_id');
            $table->foreignId('block_id');
            $table->foreignId('complain_id');
            $table->foreignId('shareholder_id');
            $table->foreignId('supplier_id');
            $table->foreignId('notice_id');
            $table->foreignId('income_id');
            $table->foreignId('room_id');
            $table->foreignId('salary_id');
            $table->foreignId('salary_payment_id');
            $table->foreignId('user_id');
            $table->foreignId('floor_id');
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
