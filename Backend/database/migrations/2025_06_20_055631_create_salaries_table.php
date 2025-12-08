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
        Schema::create('salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id');
            $table->string('amount');
            $table->string('month');
            $table->year('year');
            $table->text('description')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
            
            // Add indexes for better query performance
            $table->index(['staff_id']);
            $table->index(['year', 'month']);
            $table->index(['status']);
            $table->index(['year', 'month', 'staff_id'], 'salaries_year_month_staff_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salaries');
    }
};
