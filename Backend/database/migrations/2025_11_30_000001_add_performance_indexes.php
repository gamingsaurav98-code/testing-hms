<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                if (Schema::hasColumn('students', 'room_id')) $table->index('room_id');
                if (Schema::hasColumn('students', 'is_active')) $table->index('is_active');
                if (Schema::hasColumn('students', 'created_at')) $table->index('created_at');
                if (Schema::hasColumn('students', 'user_id')) $table->index('user_id');
            });
        }

        if (Schema::hasTable('rooms')) {
            Schema::table('rooms', function (Blueprint $table) {
                if (Schema::hasColumn('rooms', 'block_id')) $table->index('block_id');
                if (Schema::hasColumn('rooms', 'room_type')) $table->index('room_type');
                if (Schema::hasColumn('rooms', 'status')) $table->index('status');
                if (Schema::hasColumn('rooms', 'created_at')) $table->index('created_at');
            });
        }

        if (Schema::hasTable('incomes')) {
            Schema::table('incomes', function (Blueprint $table) {
                if (Schema::hasColumn('incomes', 'student_id')) $table->index('student_id');
                if (Schema::hasColumn('incomes', 'income_type_id')) $table->index('income_type_id');
                if (Schema::hasColumn('incomes', 'payment_type_id')) $table->index('payment_type_id');
                if (Schema::hasColumn('incomes', 'income_date')) $table->index('income_date');
                if (Schema::hasColumn('incomes', 'created_at')) $table->index('created_at');
                if (Schema::hasColumn('incomes', 'due_amount')) $table->index('due_amount');
            });
        }

        if (Schema::hasTable('staff')) {
            Schema::table('staff', function (Blueprint $table) {
                if (Schema::hasColumn('staff', 'is_active')) $table->index('is_active');
                if (Schema::hasColumn('staff', 'department')) $table->index('department');
                if (Schema::hasColumn('staff', 'position')) $table->index('position');
                if (Schema::hasColumn('staff', 'created_at')) $table->index('created_at');
            });
        }

        if (Schema::hasTable('complains')) {
            Schema::table('complains', function (Blueprint $table) {
                if (Schema::hasColumn('complains', 'student_id')) $table->index('student_id');
                if (Schema::hasColumn('complains', 'staff_id')) $table->index('staff_id');
                if (Schema::hasColumn('complains', 'status')) $table->index('status');
                if (Schema::hasColumn('complains', 'created_at')) $table->index('created_at');
            });
        }

        if (Schema::hasTable('student_check_in_check_outs')) {
            Schema::table('student_check_in_check_outs', function (Blueprint $table) {
                if (Schema::hasColumn('student_check_in_check_outs', 'student_id')) $table->index('student_id');
                if (Schema::hasColumn('student_check_in_check_outs', 'block_id')) $table->index('block_id');
                if (Schema::hasColumn('student_check_in_check_outs', 'date')) $table->index('date');
                if (Schema::hasColumn('student_check_in_check_outs', 'status')) $table->index('status');
                if (Schema::hasColumn('student_check_in_check_outs', 'checkin_time')) $table->index('checkin_time');
                if (Schema::hasColumn('student_check_in_check_outs', 'checkout_time')) $table->index('checkout_time');
                if (Schema::hasColumn('student_check_in_check_outs', 'created_at')) $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropIndex(['room_id']);
                $table->dropIndex(['is_active']);
                $table->dropIndex(['created_at']);
                $table->dropIndex(['user_id']);
            });
        }

        if (Schema::hasTable('rooms')) {
            Schema::table('rooms', function (Blueprint $table) {
                $table->dropIndex(['block_id']);
                $table->dropIndex(['room_type']);
                $table->dropIndex(['status']);
                $table->dropIndex(['created_at']);
            });
        }

        if (Schema::hasTable('incomes')) {
            Schema::table('incomes', function (Blueprint $table) {
                $table->dropIndex(['student_id']);
                $table->dropIndex(['income_type_id']);
                $table->dropIndex(['payment_type_id']);
                $table->dropIndex(['income_date']);
                $table->dropIndex(['created_at']);
                $table->dropIndex(['due_amount']);
            });
        }

        if (Schema::hasTable('staff')) {
            Schema::table('staff', function (Blueprint $table) {
                $table->dropIndex(['is_active']);
                $table->dropIndex(['department']);
                $table->dropIndex(['position']);
                $table->dropIndex(['created_at']);
            });
        }

        if (Schema::hasTable('complains')) {
            Schema::table('complains', function (Blueprint $table) {
                $table->dropIndex(['student_id']);
                $table->dropIndex(['staff_id']);
                $table->dropIndex(['status']);
                $table->dropIndex(['created_at']);
            });
        }

        if (Schema::hasTable('student_check_in_check_outs')) {
            Schema::table('student_check_in_check_outs', function (Blueprint $table) {
                $table->dropIndex(['student_id']);
                $table->dropIndex(['block_id']);
                $table->dropIndex(['date']);
                $table->dropIndex(['status']);
                $table->dropIndex(['checkin_time']);
                $table->dropIndex(['checkout_time']);
                $table->dropIndex(['created_at']);
            });
        }
    }
};

