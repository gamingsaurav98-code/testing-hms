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
        Schema::create('inquiry_seaters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id');
            $table->foreignId('inquiry_id');
            $table->foreignId('block_id');
            $table->integer('capacity')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiry_seaters');
    }
};
