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
        Schema::create('share_holders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->text('address');
            $table->string('father_name')->nullable();
            $table->string('grandfather_name')->nullable();
            $table->string('spouse_name')->nullable();
            $table->string('share_percentage')->default(0);
            $table->string('investment_amount')->default(0);
            $table->string('shareholder_image_attachment')->nullable();
            $table->date('joined_date');
            $table->text('remark')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('share_holders');
    }
};
