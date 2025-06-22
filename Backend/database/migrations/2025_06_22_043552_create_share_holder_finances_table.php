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
        Schema::create('share_holder_finances', function (Blueprint $table) {
            $table->id();
            $table->foreignID('shareholder_id');
            $table->string('amount');
            $table->date('payment_date');
            $table->string('payment_type'); // e.g., 'cash', 'bank_transfer', 'cheque'
            $table->text('remark')->nullable(); // Additional notes or remarks
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('share_holder_finances');
    }
};
