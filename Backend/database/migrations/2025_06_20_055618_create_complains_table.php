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
        Schema::create('complains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->nullable();
            $table->foreignId('staff_id')->nullable();
            $table->string('title');
            $table->string('complain_attachment')->nullable();
            $table->text('description');
            $table->enum('status', ['pending', 'in_progress', 'resolved'])->default('pending');
            
            // Chat-related fields
            $table->integer('total_messages')->default(0);
            $table->integer('unread_admin_messages')->default(0);
            $table->integer('unread_student_messages')->default(0);
            $table->integer('unread_staff_messages')->default(0);
            $table->timestamp('last_message_at')->nullable();
            $table->string('last_message_by')->nullable(); // 'admin', 'student', 'staff'
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complains');
    }
};
