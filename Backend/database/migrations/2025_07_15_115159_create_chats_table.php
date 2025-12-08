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
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('complain_id'); // Reference to complaint
            $table->unsignedBigInteger('sender_id'); // ID of the sender
            $table->string('sender_type'); // 'admin', 'student', 'staff'
            $table->string('sender_name'); // Name of the sender
            $table->text('message'); // Chat message content
            $table->boolean('is_edited')->default(false); // Flag to indicate if message was edited
            $table->boolean('is_read')->default(false); // Message read status
            $table->timestamp('read_at')->nullable(); // When the message was read
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('complain_id')->references('id')->on('complains')->onDelete('cascade');
            
            // Indexes for better performance
            $table->index(['complain_id', 'created_at']);
            $table->index(['sender_id', 'sender_type']);
            $table->index(['complain_id', 'sender_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
