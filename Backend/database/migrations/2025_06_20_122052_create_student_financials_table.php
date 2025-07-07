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
            $table->string('admission_fee')->nullable();
            $table->string('form_fee')->nullable();
            $table->string('security_deposit')->nullable();
            $table->string('monthly_fee')->nullable();
            $table->boolean('is_existing_student')->default(false);
            $table->string('previous_balance')->nullable();
            $table->string('initial_balance_after_registration')->nullable();
            $table->string('balance_type')->nullable();
            $table->date('payment_date');
            $table->date('joining_date')->nullable();
            $table->string('physical_copy_image')->nullable();
            $table->foreignId('payment_type_id')->nullable();
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
