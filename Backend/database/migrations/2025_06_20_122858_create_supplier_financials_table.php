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
        Schema::create('supplier_financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id');
            $table->string('amount'); // Amount can be stored as a string to accommodate various formats (e.g., '1000.00', '1,000.00')
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
        Schema::dropIfExists('supplier_financials');
    }
};
