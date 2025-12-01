<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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
    public static function buildDashboardSummary(bool $forceRefresh = false): array
    {
        $cacheKey = 'admin_dashboard_summary_v1';
        $ttlSeconds = 30; // short cache to amortize repeated dashboard loads in dev and prod

        if (! $forceRefresh) {
            $cached = Cache::get($cacheKey);
            if ($cached && is_array($cached)) {
                return $cached;
            }
        }

        $overallStart = microtime(true);
        // Prevent cache stampede: attempt to acquire an application cache lock
        // so parallel requests don't all run heavy aggregates at once. If
        // we can't obtain the lock we will wait briefly for the cache to
        // appear before falling back to compute locally.
        $lockKey = $cacheKey . ':lock';
        $lock = null;
        $lockAcquired = false;
        try {
            try {
                $lock = Cache::lock($lockKey, 15); // lock for 15s while computing
                $lockAcquired = $lock->get();
            } catch (\Throwable $_) {
                // Some cache drivers do not support locks; continue without lock
                $lockAcquired = false;
            }

            if (! $lockAcquired) {
                // Wait briefly for another process to compute the cache
                $waited = 0;
                while ($waited < 3000) { // max 3s
                    $candidate = Cache::get($cacheKey);
                    if ($candidate && is_array($candidate)) {
                        // return early with the now-populated cache
                        try { if ($lock && $lockAcquired) $lock->release(); } catch (\Throwable $_) {}
                        return $candidate;
                    }
                    // wait 100ms and try again
                    usleep(100 * 1000);
                    $waited += 100;
                }
            }
        } catch (\Throwable $_) {
            // ignore any locking/waiting errors and proceed to compute
        }
        $queryTimes = [];

        // Enable query logging when app is in debug mode so we can capture per-query timings
        $captureSql = false;
        try {
            if (config('app.debug') || env('APP_DEBUG')) {
                DB::enableQueryLog();
                $captureSql = true;
            }
        } catch (\Throwable $_) {
            // ignore if query logging not available
            $captureSql = false;
        }
        // Try to get schema builder - if DB or Laravel container is not available,
        // use a fallback shim that reports no tables/columns (allowing safe unit tests).
        try {
            $qStart = microtime(true);
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
            $queryTimes['rooms'] = (int) ((microtime(true) - $qStart) * 1000);
        } catch (\Throwable $_) {
            $totalRooms = 0; $totalCapacity = 0; $occupiedBeds = 0;
            $queryTimes['rooms'] = $queryTimes['rooms'] ?? 0;
        }

        $availableBeds = max(0, $totalCapacity - $occupiedBeds);

        // Students counts
        $totalStudents = 0;
        try {
            $qStart = microtime(true);
            if ($schema->hasTable('students')) {
                $query = DB::table('students');
                if ($schema->hasColumn('students', 'is_active')) {
                    $query = $query->where('is_active', true);
                }
                $totalStudents = (int) $query->count();
            }
            $queryTimes['students_total'] = (int) ((microtime(true) - $qStart) * 1000);
        } catch (\Throwable $_) {
            $totalStudents = 0;
            $queryTimes['students_total'] = $queryTimes['students_total'] ?? 0;
        }

        // in-hostel: students currently checked in (checkin_time exists, checkout_time null)
        $inHostel = 0;
        try {
            $qStart = microtime(true);
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
            $queryTimes['in_hostel'] = (int) ((microtime(true) - $qStart) * 1000);
        } catch (\Throwable $_) {
            $inHostel = 0;
            $queryTimes['in_hostel'] = $queryTimes['in_hostel'] ?? 0;
        }

        $outOfHostel = max(0, $totalStudents - $inHostel);

        // Financial aggregates — monthly incomes & expenses
        $monthlyIncomes = 0.0;
        $monthlyExpenses = 0.0;

        try {
            $qStart = microtime(true);
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
            // Capture both income & expense timing under 'monthly_finance'
            $queryTimes['monthly_finance'] = (int) ((microtime(true) - $qStart) * 1000);
        } catch (\Throwable $_) {
            $monthlyIncomes = 0.0; $monthlyExpenses = 0.0;
            $queryTimes['monthly_finance'] = $queryTimes['monthly_finance'] ?? 0;
        }

        // Outstanding dues (best-effort across incomes and student_financials)
        $outstandingTotal = 0.0;
        $outstandingCount = 0;
        try {
            $qStart = microtime(true);
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
            // Note: we may perform multiple student_financials queries; lump under 'outstanding_financials'
            $queryTimes['outstanding_financials'] = (int) ((microtime(true) - $qStart) * 1000);
        } catch (\Throwable $_) {
            $outstandingTotal = $outstandingTotal ?? 0.0;
            $outstandingCount = $outstandingCount ?? 0;
            $queryTimes['outstanding_financials'] = $queryTimes['outstanding_financials'] ?? 0;
        }

        // Recent activity: collect latest items from incomes, expenses, checkin/checkouts
        $recent = [];
        try {
            $qStart = microtime(true);
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
                $queryTimes['recent_incomes'] = (int) ((microtime(true) - $qStart) * 1000);
                $qStart = microtime(true);
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
                $queryTimes['recent_expenses'] = (int) ((microtime(true) - $qStart) * 1000);
                $qStart = microtime(true);
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
                $queryTimes['recent_checkins'] = (int) ((microtime(true) - $qStart) * 1000);
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
            // Ensure keys exist even on failure
            $queryTimes['recent_incomes'] = $queryTimes['recent_incomes'] ?? 0;
            $queryTimes['recent_expenses'] = $queryTimes['recent_expenses'] ?? 0;
            $queryTimes['recent_checkins'] = $queryTimes['recent_checkins'] ?? 0;
        }

        $result = [
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

        // Cache the computed result for a short window to reduce DB load
        try {
            Cache::put($cacheKey, $result, $ttlSeconds);
        } catch (\Throwable $_) {
            // Ignore caching failures - still return data
        } finally {
            // Release the lock if we obtained it
            try { if (! empty($lock) && $lockAcquired) $lock->release(); } catch (\Throwable $_) {}
        }

        $elapsedMs = (int) ((microtime(true) - $overallStart) * 1000);

        try {
            // If we enabled query logging, fetch the collected queries and surface the slowest ones
            if (! empty($captureSql)) {
                try {
                    $queries = DB::getQueryLog();
                    usort($queries, function ($a, $b) {
                        return ($b['time'] ?? 0) <=> ($a['time'] ?? 0);
                    });

                    $top = array_slice($queries, 0, 10);
                    $formatted = array_map(function ($q) {
                        return [
                            'query' => $q['query'] ?? '',
                            'bindings' => $q['bindings'] ?? [],
                            'ms' => isset($q['time']) ? (int) $q['time'] : 0,
                        ];
                    }, $top);

                    Log::debug('AdminDashboardService::sql_profile', ['count' => count($queries), 'top' => $formatted]);

                } catch (\Throwable $_) {
                    // ignore SQL profiling errors
                } finally {
                    try { DB::flushQueryLog(); } catch (\Throwable $_) {}
                }
            }

            // Log the overall time and per-stage timings to help locate slow queries
            Log::debug('AdminDashboardService::buildDashboardSummary computed', array_merge(['ms' => $elapsedMs], $queryTimes));
        } catch (\Throwable $_) {}

        return $result;
    }
}
