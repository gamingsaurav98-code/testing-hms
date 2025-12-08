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
        Schema::create('staff_checkout_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id');
            $table->boolean('is_active')->default(true);
            $table->integer('active_after_days')->nullable();
            $table->integer('percentage')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_checkout_rules');
    }
};
