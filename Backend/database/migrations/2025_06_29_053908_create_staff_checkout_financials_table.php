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
        Schema::create('staff_checkout_financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id');
            $table->foreignId('checkout_id');
            $table->foreignId('checkout_rule_id')->nullable();
            $table->string('checkout_duration')->nullable();
            $table->string('deducted_amount')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_checkout_financials');
    }
};
