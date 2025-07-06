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
            $table->foreignId('expense_category_id')->nullable();
            $table->string('expense_type')->nullable();
            $table->string('amount');
            $table->string('expense_date');
            $table->string('expense_attachment')->nullable();
            $table->foreignId('payment_type_id')->nullable();
            $table->string('title');
            $table->string('description')->nullable();
            $table->foreignId('student_id')->nullable();
            $table->foreignId('staff_id')->nullable();
            $table->foreignId('supplier_id')->nullable();
            $table->string('paid_amount')->nullable();
            $table->string('due_amount')->nullable();
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
