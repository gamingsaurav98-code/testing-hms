<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * AdminDashboardService
 *
 * Compute defensive, best-effort admin metrics for the dashboard.
 * Methods are written to tolerate missing tables/columns and to return
 * safe numeric defaults when schema/data isn't present.
 */
class AdminDashboardService
{
    /**
     * Build an aggregated dashboard summary for admin UI.
     * @return array
     */
    public static function buildDashboardSummary(): array
    {
        // Try to get schema builder - if DB or Laravel container is not available,
        // use a fallback shim that reports no tables/columns (allowing safe unit tests).
        try {
            $schema = DB::getSchemaBuilder();
        } catch (\Throwable $_) {
            $schema = new class {
                public function hasTable($t) { return false; }
                public function hasColumn($t, $c) { return false; }
            };
        }

        // Rooms / capacity
        $totalRooms = 0;
        $totalCapacity = 0;
        $occupiedBeds = 0;

        try {
            if ($schema->hasTable('rooms')) {
                $totalRooms = (int) DB::table('rooms')->count();
                // capacity may be string/number; ensure float/int
                $totalCapacity = (int) DB::table('rooms')->sum('capacity');

                // occupied beds: count of active students assigned to rooms
                if ($schema->hasTable('students')) {
                    $occupiedBeds = (int) DB::table('students')
                        ->whereNotNull('room_id')
                        ->where(function ($q) {
                            // If column 'is_active' exists, prefer active students
                            $schema = DB::getSchemaBuilder();
                            if ($schema->hasColumn('students', 'is_active')) {
                                $q->where('is_active', true);
                            }
                        })
                        ->count();
                }
            }
        } catch (\Throwable $_) {
            $totalRooms = 0; $totalCapacity = 0; $occupiedBeds = 0;
        }

        $availableBeds = max(0, $totalCapacity - $occupiedBeds);

        // Students counts
        $totalStudents = 0;
        try {
            if ($schema->hasTable('students')) {
                $query = DB::table('students');
                if ($schema->hasColumn('students', 'is_active')) {
                    $query = $query->where('is_active', true);
                }
                $totalStudents = (int) $query->count();
            }
        } catch (\Throwable $_) {
            $totalStudents = 0;
        }

        // in-hostel: students currently checked in (checkin_time exists, checkout_time null)
        $inHostel = 0;
        try {
            if ($schema->hasTable('student_check_in_check_outs')) {
                // Count records where checkin_time is not null and checkout_time is null
                $q = DB::table('student_check_in_check_outs')
                    ->whereNotNull('checkin_time')
                    ->whereNull('checkout_time');

                // If there is a status column, exclude declined records
                if ($schema->hasColumn('student_check_in_check_outs', 'status')) {
                    $q = $q->where('status', '!=', 'declined');
                }

                $inHostel = (int) $q->count();
            }
        } catch (\Throwable $_) {
            $inHostel = 0;
        }

        $outOfHostel = max(0, $totalStudents - $inHostel);

        // Financial aggregates — monthly incomes & expenses
        $monthlyIncomes = 0.0;
        $monthlyExpenses = 0.0;

        try {
            $now = Carbon::now();
            $start = $now->copy()->startOfMonth()->toDateString();
            $end = $now->copy()->endOfMonth()->toDateString();

            if ($schema->hasTable('incomes')) {
                $inColumn = $schema->hasColumn('incomes', 'amount') ? 'amount' : null;
                $dateCol = $schema->hasColumn('incomes', 'income_date') ? 'income_date' : ( $schema->hasColumn('incomes', 'created_at') ? 'created_at' : null);

                if ($inColumn && $dateCol) {
                    $monthlyIncomes = (float) DB::table('incomes')
                        ->whereBetween($dateCol, [$start, $end])
                        ->sum($inColumn);
                }
            }

            if ($schema->hasTable('expenses')) {
                $exColumn = $schema->hasColumn('expenses', 'amount') ? 'amount' : null;
                $dateCol = $schema->hasColumn('expenses', 'expense_date') ? 'expense_date' : ( $schema->hasColumn('expenses', 'created_at') ? 'created_at' : null);

                if ($exColumn && $dateCol) {
                    $monthlyExpenses = (float) DB::table('expenses')
                        ->whereBetween($dateCol, [$start, $end])
                        ->sum($exColumn);
                }
            }
        } catch (\Throwable $_) {
            $monthlyIncomes = 0.0; $monthlyExpenses = 0.0;
        }

        // Outstanding dues (best-effort across incomes and student_financials)
        $outstandingTotal = 0.0;
        $outstandingCount = 0;
        try {
            // incomes.due_amount
            if ($schema->hasTable('incomes') && $schema->hasColumn('incomes', 'due_amount')) {
                $sum = DB::table('incomes')->sum('due_amount');
                $outstandingTotal += (float)$sum;
                $outstandingCount += (int) DB::table('incomes')->where('due_amount', '>', 0)->count();
            }

            // student_financials balances
            if ($schema->hasTable('student_financials')) {
                // Columns that might represent dues
                if ($schema->hasColumn('student_financials', 'initial_balance_after_registration')) {
                    $sum = DB::table('student_financials')->where('balance_type', 'due')->sum('initial_balance_after_registration');
                    $outstandingTotal += (float)$sum;
                    $outstandingCount += (int) DB::table('student_financials')->where('balance_type', 'due')->where(function($q) {
                        $q->whereNotNull('initial_balance_after_registration')->orWhereNotNull('previous_balance');
                    })->count();
                } elseif ($schema->hasColumn('student_financials', 'previous_balance')) {
                    $sum = DB::table('student_financials')->where('balance_type', 'due')->sum('previous_balance');
                    $outstandingTotal += (float)$sum;
                    $outstandingCount += (int) DB::table('student_financials')->where('balance_type', 'due')->whereNotNull('previous_balance')->count();
                }
            }
        } catch (\Throwable $_) {
            $outstandingTotal = $outstandingTotal ?? 0.0;
            $outstandingCount = $outstandingCount ?? 0;
        }

        // Recent activity: collect latest items from incomes, expenses, checkin/checkouts
        $recent = [];
        try {
            $sources = [];

            if ($schema->hasTable('incomes')) {
                $dateCol = $schema->hasColumn('incomes', 'income_date') ? 'income_date' : 'created_at';
                $col = $schema->hasColumn('incomes', 'amount') ? 'amount' : null;
                $incomeRows = DB::table('incomes')
                    ->select(['id', $dateCol . ' as occurred_at', 'title', 'amount', 'student_id'])
                    ->orderBy($dateCol, 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function($r) use ($col) {
                        return [
                            'type' => 'income',
                            'id' => $r->id,
                            'date' => $r->occurred_at,
                            'amount' => $col ? (float)$r->amount : null,
                            'title' => $r->title ?? null,
                            'student_id' => $r->student_id ?? null,
                        ];
                    })->toArray();

                $sources = array_merge($sources, $incomeRows);
            }

            if ($schema->hasTable('expenses')) {
                $dateCol = $schema->hasColumn('expenses', 'expense_date') ? 'expense_date' : 'created_at';
                $col = $schema->hasColumn('expenses', 'amount') ? 'amount' : null;
                $expenseRows = DB::table('expenses')
                    ->select(['id', $dateCol . ' as occurred_at', 'title', 'amount'])
                    ->orderBy($dateCol, 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function($r) use ($col) {
                        return [
                            'type' => 'expense',
                            'id' => $r->id,
                            'date' => $r->occurred_at,
                            'amount' => $col ? (float)$r->amount : null,
                            'title' => $r->title ?? null,
                        ];
                    })->toArray();

                $sources = array_merge($sources, $expenseRows);
            }

            if ($schema->hasTable('student_check_in_check_outs')) {
                $rows = DB::table('student_check_in_check_outs')
                    ->select(['id', 'created_at', 'checkin_time', 'checkout_time', 'student_id', 'status', 'date'])
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get()
                    ->map(function($r) {
                        $type = $r->checkout_time ? 'checkout' : 'checkin';
                        return [
                            'type' => $type,
                            'id' => $r->id,
                            'date' => $r->created_at,
                            'student_id' => $r->student_id,
                            'status' => $r->status ?? null,
                        ];
                    })->toArray();

                $sources = array_merge($sources, $rows);
            }

            // Merge and sort by date descending and take top 10
            usort($sources, function ($a, $b) {
                $ta = isset($a['date']) ? strtotime($a['date']) : 0;
                $tb = isset($b['date']) ? strtotime($b['date']) : 0;
                return $tb <=> $ta;
            });

            $recent = array_slice($sources, 0, 10);
        } catch (\Throwable $_) {
            $recent = [];
        }

        return [
            'rooms' => [
                'total_rooms' => $totalRooms,
                'total_capacity' => $totalCapacity,
                'occupied_beds' => $occupiedBeds,
                'available_beds' => $availableBeds,
            ],
            'students' => [
                'total' => $totalStudents,
                'in_hostel' => $inHostel,
                'out_of_hostel' => $outOfHostel,
            ],
            'finance' => [
                'monthly_incomes' => round($monthlyIncomes, 2),
                'monthly_expenses' => round($monthlyExpenses, 2),
                'outstanding_total' => round($outstandingTotal, 2),
                'outstanding_count' => $outstandingCount,
            ],
            'recent_activity' => $recent,
            'calculation_date' => Carbon::now()->toDateTimeString(),
        ];
    }
}
