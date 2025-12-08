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
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('notice_attachment')->nullable(); // e.g., file path or URL
            $table->timestamp('schedule_time')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->enum('target_type', ['all', 'student', 'staff', 'specific_student', 'specific_staff', 'block'])->default('all');
            $table->enum('notice_type', ['general', 'urgent', 'event', 'announcement'])->default('general');
            $table->foreignId('student_id')->nullable();
            $table->foreignId('staff_id')->nullable();
            $table->foreignId('block_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};
