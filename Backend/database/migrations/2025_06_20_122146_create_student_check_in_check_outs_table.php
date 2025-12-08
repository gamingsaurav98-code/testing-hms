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
        Schema::create('student_check_in_check_outs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id');
            $table->foreignId('block_id');
            $table->foreignId('checkout_rule_id')->nullable();
            $table->datetime('requested_checkin_time')->nullable();
            $table->datetime('requested_checkout_time')->nullable();
            $table->date('date');
            $table->timestamp('checkin_time')->nullable();
            $table->timestamp('checkout_time')->nullable();
            $table->date('estimated_checkin_date')->nullable();
            $table->string('checkout_duration')->nullable();
            $table->enum('status', ['checked_in', 'checked_out', 'pending', 'approved', 'declined'])->default('checked_in');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_check_in_check_outs');
    }
};
