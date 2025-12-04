<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AdminDashboardService
{
    /**
     * Build comprehensive dashboard summary for admin panel
     * Includes room capacity, student counts, and financial data
     */
    public static function buildDashboardSummary()
    {
        try {
            $summary = [
                'rooms' => self::getRoomSummary(),
                'students' => self::getStudentSummary(),
                'staff' => self::getStaffSummary(),
                'attendance' => self::getAttendanceSummary(),
                'financials' => self::getFinancialSummary(),
                'generated_at' => now()->toISOString(),
            ];

            return $summary;

        } catch (\Exception $e) {
            Log::error('AdminDashboardService::buildDashboardSummary error: ' . $e->getMessage());
            return [
                'error' => 'Failed to build dashboard summary',
                'message' => $e->getMessage(),
                'generated_at' => now()->toISOString(),
            ];
        }
    }

    /**
     * Get room capacity and occupancy summary
     */
    private static function getRoomSummary()
    {
        try {
            $rooms = DB::table('rooms')
                ->select('id', 'room_name', 'capacity', 'block_id')
                ->get();

            $totalCapacity = $rooms->sum('capacity');
            $occupiedRooms = DB::table('students')
                ->whereNotNull('room_id')
                ->distinct('room_id')
                ->count('room_id');

            return [
                'total_rooms' => $rooms->count(),
                'total_capacity' => $totalCapacity,
                'occupied_rooms' => $occupiedRooms,
                'available_rooms' => $rooms->count() - $occupiedRooms,
            ];
        } catch (\Exception $e) {
            Log::error('Room summary error: ' . $e->getMessage());
            return ['error' => 'Failed to get room summary'];
        }
    }

    /**
     * Get student statistics
     */
    private static function getStudentSummary()
    {
        try {
            $totalStudents = DB::table('students')->count();
            $activeStudents = DB::table('students')->where('is_active', true)->count();
            $inactiveStudents = $totalStudents - $activeStudents;

            return [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'inactive_students' => $inactiveStudents,
            ];
        } catch (\Exception $e) {
            Log::error('Student summary error: ' . $e->getMessage());
            return ['error' => 'Failed to get student summary'];
        }
    }

    /**
     * Get staff statistics
     */
    private static function getStaffSummary()
    {
        try {
            // Check if staff table exists
            $hasStaffTable = DB::getSchemaBuilder()->hasTable('staff');

            if (!$hasStaffTable) {
                return [
                    'total_staff' => 0,
                    'active_staff' => 0,
                    'inactive_staff' => 0,
                ];
            }

            $totalStaff = DB::table('staff')->count();
            $activeStaff = DB::table('staff')->where('is_active', true)->count();

            return [
                'total_staff' => $totalStaff,
                'active_staff' => $activeStaff,
                'inactive_staff' => $totalStaff - $activeStaff,
            ];
        } catch (\Exception $e) {
            Log::error('Staff summary error: ' . $e->getMessage());
            return [
                'total_staff' => 0,
                'active_staff' => 0,
                'inactive_staff' => 0,
            ];
        }
    }

    /**
     * Get today's attendance summary
     */
    private static function getAttendanceSummary()
    {
        try {
            $today = Carbon::today()->toDateString();

            $studentAttendance = DB::table('student_check_in_check_outs')
                ->whereDate('date', $today)
                ->selectRaw('
                    COUNT(CASE WHEN checkin_time IS NOT NULL THEN 1 END) as checked_in,
                    COUNT(CASE WHEN checkout_time IS NOT NULL THEN 1 END) as checked_out,
                    COUNT(*) as total_records
                ')
                ->first();

            // Check if staff_check_in_check_outs table exists
            $hasStaffCheckInTable = DB::getSchemaBuilder()->hasTable('staff_check_in_check_outs');

            $staffAttendance = null;
            if ($hasStaffCheckInTable) {
                $staffAttendance = DB::table('staff_check_in_check_outs')
                    ->whereDate('date', $today)
                    ->selectRaw('
                        COUNT(CASE WHEN checkin_time IS NOT NULL THEN 1 END) as checked_in,
                        COUNT(CASE WHEN checkout_time IS NOT NULL THEN 1 END) as checked_out,
                        COUNT(*) as total_records
                    ')
                    ->first();
            }

            return [
                'today_date' => $today,
                'students' => [
                    'checked_in' => $studentAttendance->checked_in ?? 0,
                    'checked_out' => $studentAttendance->checked_out ?? 0,
                    'total_records' => $studentAttendance->total_records ?? 0,
                ],
                'staff' => [
                    'checked_in' => $staffAttendance->checked_in ?? 0,
                    'checked_out' => $staffAttendance->checked_out ?? 0,
                    'total_records' => $staffAttendance->total_records ?? 0,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Attendance summary error: ' . $e->getMessage());
            return [
                'today_date' => Carbon::today()->toDateString(),
                'students' => ['checked_in' => 0, 'checked_out' => 0, 'total_records' => 0],
                'staff' => ['checked_in' => 0, 'checked_out' => 0, 'total_records' => 0],
            ];
        }
    }

    /**
     * Get financial summary
     */
    private static function getFinancialSummary()
    {
        try {
            $currentMonth = Carbon::now()->format('Y-m');

            // Monthly income
            $monthlyIncome = DB::table('incomes')
                ->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$currentMonth])
                ->sum('amount');

            // Monthly expenses
            $monthlyExpenses = DB::table('expenses')
                ->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$currentMonth])
                ->sum('amount');

            // Outstanding student fees
            $outstandingFees = 0;
            if (DB::getSchemaBuilder()->hasTable('student_financials')) {
                $outstandingFees = DB::table('student_financials')
                    ->where('status', 'pending')
                    ->sum('amount');
            }

            // Outstanding staff salaries
            $outstandingSalaries = 0;
            if (DB::getSchemaBuilder()->hasTable('staff_financials')) {
                $outstandingSalaries = DB::table('staff_financials')
                    ->where('status', 'pending')
                    ->sum('amount');
            }

            return [
                'monthly_income' => $monthlyIncome,
                'monthly_expenses' => $monthlyExpenses,
                'monthly_profit' => $monthlyIncome - $monthlyExpenses,
                'outstanding_fees' => $outstandingFees,
                'outstanding_salaries' => $outstandingSalaries,
                'month' => $currentMonth,
            ];
        } catch (\Exception $e) {
            Log::error('Financial summary error: ' . $e->getMessage());
            return [
                'monthly_income' => 0,
                'monthly_expenses' => 0,
                'monthly_profit' => 0,
                'outstanding_fees' => 0,
                'outstanding_salaries' => 0,
                'month' => Carbon::now()->format('Y-m'),
            ];
        }
    }
}
