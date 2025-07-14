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
        Schema::table('staff', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('staff_citizenship_image');
            $table->string('position')->nullable()->after('is_active');
            $table->string('department')->nullable()->after('position');
            $table->date('joining_date')->nullable()->after('department');
            $table->string('salary_amount')->nullable()->after('joining_date');
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'intern'])->nullable()->after('salary_amount');
            $table->boolean('declaration_agreed')->default(false)->after('employment_type');
            $table->boolean('contract_agreed')->default(false)->after('declaration_agreed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn([
                'is_active',
                'position',
                'department',
                'joining_date',
                'salary_amount',
                'employment_type',
                'declaration_agreed',
                'contract_agreed'
            ]);
        });
    }
};
