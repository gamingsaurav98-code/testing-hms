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
            $table->unsignedBigInteger('sender_id'); // ID of the person sending message
            $table->enum('sender_type', ['admin', 'student', 'staff']); // Type of sender
            $table->text('message'); // Chat message content
            $table->text('original_message')->nullable(); // Store original message for edit history
            $table->boolean('is_edited')->default(false); // Flag to indicate if message was edited
            $table->timestamp('edited_at')->nullable(); // When the message was last edited
            $table->boolean('is_deleted')->default(false); // Soft delete flag
            $table->timestamp('deleted_at')->nullable(); // When the message was deleted
            $table->boolean('is_read')->default(false); // Message read status
            $table->timestamp('read_at')->nullable(); // When the message was read
            $table->json('attachments')->nullable(); // Store file attachments as JSON
            $table->enum('message_type', ['text', 'file', 'image'])->default('text'); // Type of message
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('complain_id')->references('id')->on('complains')->onDelete('cascade');
            
            // Indexes for better performance
            $table->index(['complain_id', 'created_at']);
            $table->index(['sender_id', 'sender_type']);
            $table->index(['is_deleted', 'created_at']);
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
