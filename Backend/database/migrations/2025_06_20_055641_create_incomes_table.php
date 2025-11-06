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
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id');
            $table->foreignId('income_type_id');
            $table->foreignId('payment_type_id');
            $table->decimal('amount', 10, 2);
            $table->decimal('received_amount', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2)->default(0);
            $table->date('income_date');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('payment_status')->default('paid'); // paid, partial, unpaid
            $table->string('income_attachment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incomes');
    }
};
