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
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable();
            $table->string('staff_id')->nullable();
            $table->string('staff_name');
            $table->date('date_of_birth');
            $table->string('contact_number');
            $table->string('email')->unique()->nullable();
            $table->string('district')->nullable();
            $table->string('city_name')->nullable();
            $table->string('ward_no')->nullable();
            $table->string('street_name')->nullable();
            $table->string('citizenship_no')->nullable();
            $table->date('date_of_issue')->nullable();
            $table->string('citizenship_issued_district')->nullable();
            $table->string('educational_institution')->nullable();
            $table->string('level_of_study')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('food')->nullable();
            $table->string('disease')->nullable();
            $table->string('father_name')->nullable();
            $table->string('father_contact')->nullable();
            $table->string('father_occupation')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_contact')->nullable();
            $table->string('mother_occupation')->nullable();
            $table->string('spouse_name')->nullable();
            $table->string('spouse_contact')->nullable();
            $table->string('spouse_occupation')->nullable();
            $table->string('local_guardian_name')->nullable();
            $table->string('local_guardian_contact')->nullable();
            $table->string('local_guardian_occupation')->nullable();
            $table->string('local_guardian_relation')->nullable();
            $table->string('local_guardian_address')->nullable();
            $table->string('verified_by')->nullable();
            $table->date('verified_on')->nullable();
            $table->string('staff_contract_image')->nullable();
            $table->string('staff_image')->nullable();
            $table->string('staff_citizenship_image')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
