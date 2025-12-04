<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentFinancial;
use App\Models\StudentCheckoutFinancial;
use App\Models\Staff;
use App\Models\StaffFinancial;
use App\Models\StaffCheckoutFinancial;
use App\Models\Income;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FinancialCalculationService
{
    /**
     * Calculate prorated fee for partial month stay
     *
     * @param float $monthlyFee
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return float
     */
    public static function calculateProratedFee(float $monthlyFee, Carbon $startDate, Carbon $endDate): float
    {
        $daysInMonth = $startDate->daysInMonth;
        $daysStayed = $startDate->diffInDays($endDate) + 1; // +1 to include both start and end dates

        return round(($monthlyFee / $daysInMonth) * $daysStayed, 2);
    }

    /**
     * Calculate prorated deduction based on checkout rules
     *
     * @param float $monthlyFee
     * @param float $percentage
     * @param int $checkoutDurationDays
     * @return float
     */
    public static function calculateProratedDeduction(float $monthlyFee, float $percentage, int $checkoutDurationDays): float
    {
        $dailyFee = $monthlyFee / 30; // Assuming 30 days per month for simplicity
        $deductionAmount = ($dailyFee * $checkoutDurationDays * $percentage) / 100;

        return round($deductionAmount, 2);
    }

    /**
     * Build comprehensive financial summary for a student
     *
     * @param int|Student $student
     * @return array
     */
    public static function buildStudentSummary($student): array
    {
        try {
            if (is_int($student)) {
                $student = Student::findOrFail($student);
            }

            // Get all financial records for the student
            $financials = $student->financials ?? collect();

            // Calculate total owed from financial records
            $totalOwed = 0;
            $monthlyFee = 0;

            foreach ($financials as $financial) {
                if ($financial->balance_type === 'due') {
                    $totalOwed += floatval($financial->initial_balance_after_registration ?? 0);
                }
                if ($financial->monthly_fee) {
                    $monthlyFee = floatval($financial->monthly_fee);
                }
            }

            // Get checkout deductions
            $checkoutDeductions = 0;
            if (DB::getSchemaBuilder()->hasTable('student_checkout_financials')) {
                $checkoutDeductions = $student->checkoutFinancials()
                    ->sum('deducted_amount') ?? 0;
            }

            // Get payments received (from incomes table where student_id matches)
            $paymentsReceived = 0;
            if (DB::getSchemaBuilder()->hasTable('incomes')) {
                $paymentsReceived = Income::where('student_id', $student->id)
                    ->sum('received_amount') ?? 0;
            }

            // Calculate remaining balance
            $remainingBalance = $totalOwed - $paymentsReceived - $checkoutDeductions;

            return [
                'student_id' => $student->id,
                'student_name' => $student->student_name,
                'monthly_fee' => $monthlyFee,
                'total_amount' => $totalOwed,
                'deducted_amount' => $checkoutDeductions,
                'paid_amount' => $paymentsReceived,
                'remaining_balance' => max(0, $remainingBalance), // Ensure non-negative
                'status' => $remainingBalance <= 0 ? 'paid' : 'pending',
                'last_updated' => now()->toISOString(),
            ];

        } catch (\Exception $e) {
            Log::error('Financial summary calculation error: ' . $e->getMessage(), [
                'student_id' => is_int($student) ? $student : $student->id ?? 'unknown'
            ]);

            return [
                'student_id' => is_int($student) ? $student : ($student->id ?? null),
                'student_name' => is_int($student) ? 'Unknown' : ($student->student_name ?? 'Unknown'),
                'monthly_fee' => 0,
                'total_amount' => 0,
                'deducted_amount' => 0,
                'paid_amount' => 0,
                'remaining_balance' => 0,
                'status' => 'error',
                'last_updated' => now()->toISOString(),
                'error' => 'Failed to calculate financial summary'
            ];
        }
    }

    /**
     * Apply a payment and rebuild the financial summary
     *
     * @param int $studentId
     * @param float $amount
     * @param string $paymentType
     * @param string $remark
     * @return array
     */
    public static function applyPaymentAndBuildSummary(int $studentId, float $amount, string $paymentType = 'cash', string $remark = ''): array
    {
        try {
            // Insert payment record if incomes table exists
            if (DB::getSchemaBuilder()->hasTable('incomes')) {
                Income::create([
                    'student_id' => $studentId,
                    'amount' => $amount,
                    'received_amount' => $amount,
                    'payment_type' => $paymentType,
                    'remark' => $remark,
                    'date' => now(),
                ]);
            }

            // Rebuild summary
            return self::buildStudentSummary($studentId);

        } catch (\Exception $e) {
            Log::error('Payment application error: ' . $e->getMessage(), [
                'student_id' => $studentId,
                'amount' => $amount
            ]);

            return [
                'error' => 'Failed to apply payment',
                'message' => $e->getMessage()
            ];
        }
    }
}
