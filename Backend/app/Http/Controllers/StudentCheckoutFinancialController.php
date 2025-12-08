<?php

namespace App\Http\Controllers;

use App\Models\StudentCheckoutFinancial;
use App\Models\Student;
use App\Services\DateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StudentCheckoutFinancialController extends Controller
{
    protected $dateService;

    public function __construct(DateService $dateService)
    {
        $this->dateService = $dateService;
    }

    /**
     * Display a listing of student checkout financials.
     */
    public function index(Request $request)
    {
        try {
            $query = StudentCheckoutFinancial::with([
                'student.room.block', 
                'checkInCheckOut', 
                'checkoutRule'
            ]);

            // Filter by student
            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }

            // Filter by block (through student relationship)
            if ($request->has('block_id')) {
                $query->whereHas('student.room', function($q) use ($request) {
                    $q->where('block_id', $request->block_id);
                });
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereHas('checkInCheckOut', function($q) use ($request) {
                    $q->whereBetween('date', [$request->start_date, $request->end_date]);
                });
            }

            // Filter by month
            if ($request->has('month') && $request->has('year')) {
                $query->whereHas('checkInCheckOut', function($q) use ($request) {
                    $q->whereMonth('date', $request->month)
                      ->whereYear('date', $request->year);
                });
            }

            // Get all records without pagination if requested
            if ($request->has('all') && $request->all === 'true') {
                $financials = $query->orderBy('created_at', 'desc')->get();
            } else {
                $perPage = $request->has('per_page') ? (int)$request->per_page : 15;
                $financials = $query->orderBy('created_at', 'desc')->paginate($perPage);
            }

            return response()->json($financials);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch checkout financials: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created checkout financial record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'checkout_id' => 'required|exists:student_check_in_check_outs,id',
            'checkout_duration' => 'nullable|string|max:255',
            'deducted_amount' => 'required|numeric|min:0',
            'checkout_rule_id' => 'nullable|exists:student_checkout_rules,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if financial record already exists for this checkout
            $existingFinancial = StudentCheckoutFinancial::where('checkout_id', $request->checkout_id)->first();
            if ($existingFinancial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Financial record already exists for this checkout'
                ], 422);
            }

            $financial = StudentCheckoutFinancial::create($request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout financial record created successfully',
                'data' => $financial->load(['student.room.block', 'checkInCheckOut', 'checkoutRule'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create checkout financial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified checkout financial record.
     */
    public function show(string $id)
    {
        try {
            $financial = StudentCheckoutFinancial::with([
                'student.room.block', 
                'checkInCheckOut', 
                'checkoutRule'
            ])->find($id);

            if (!$financial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout financial record not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $financial
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch checkout financial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified checkout financial record.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'checkout_duration' => 'nullable|string|max:255',
            'deducted_amount' => 'sometimes|numeric|min:0',
            'checkout_rule_id' => 'nullable|exists:student_checkout_rules,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $financial = StudentCheckoutFinancial::find($id);
            if (!$financial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout financial record not found'
                ], 404);
            }

            $financial->update($request->only([
                'checkout_duration',
                'deducted_amount',
                'checkout_rule_id'
            ]));

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout financial record updated successfully',
                'data' => $financial->load(['student.room.block', 'checkInCheckOut', 'checkoutRule'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update checkout financial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified checkout financial record.
     */
    public function destroy(string $id)
    {
        try {
            $financial = StudentCheckoutFinancial::find($id);
            if (!$financial) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout financial record not found'
                ], 404);
            }

            $financial->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout financial record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete checkout financial: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get financial records for a specific student
     */
    public function getStudentFinancials($studentId, Request $request)
    {
        try {
            $student = Student::find($studentId);
            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found'
                ], 404);
            }

            $query = StudentCheckoutFinancial::where('student_id', $studentId)
                ->with(['checkInCheckOut', 'checkoutRule']);

            // Filter by date range if provided
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereHas('checkInCheckOut', function($q) use ($request) {
                    $q->whereBetween('date', [$request->start_date, $request->end_date]);
                });
            }

            $financials = $query->orderBy('created_at', 'desc')->get();

            // Calculate summary
            $summary = [
                'total_deducted' => $financials->sum('deducted_amount'),
                'total_checkouts' => $financials->count(),
                'average_deduction' => $financials->count() > 0 ? $financials->avg('deducted_amount') : 0,
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'financials' => $financials,
                    'summary' => $summary
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch student financials: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get checkout financial statistics
     */
    public function getStatistics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
            $endDate = $request->get('end_date', Carbon::now()->toDateString());
            $blockId = $request->get('block_id');

            $query = StudentCheckoutFinancial::with(['student.room.block', 'checkInCheckOut'])
                ->whereHas('checkInCheckOut', function($q) use ($startDate, $endDate) {
                    $q->whereBetween('date', [$startDate, $endDate]);
                });

            if ($blockId) {
                $query->whereHas('student.room', function($q) use ($blockId) {
                    $q->where('block_id', $blockId);
                });
            }

            $financials = $query->get();

            $statistics = [
                'total_deducted_amount' => $financials->sum('deducted_amount'),
                'total_checkout_records' => $financials->count(),
                'average_deduction_per_checkout' => $financials->count() > 0 ? $financials->avg('deducted_amount') : 0,
                'unique_students_with_deductions' => $financials->pluck('student_id')->unique()->count(),
                'by_month' => $this->getMonthlyStatistics($financials),
                'top_students_by_deduction' => $this->getTopStudentsByDeduction($financials),
                'deduction_ranges' => $this->getDeductionRanges($financials),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $statistics,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get monthly breakdown of checkout financials
     */
    private function getMonthlyStatistics($financials)
    {
        $monthlyStats = [];
        
        foreach ($financials as $financial) {
            $month = Carbon::parse($financial->checkInCheckOut->date)->format('Y-m');
            
            if (!isset($monthlyStats[$month])) {
                $monthlyStats[$month] = [
                    'month' => $month,
                    'total_deducted' => 0,
                    'checkout_count' => 0,
                    'student_count' => []
                ];
            }
            
            $monthlyStats[$month]['total_deducted'] += (float) $financial->deducted_amount;
            $monthlyStats[$month]['checkout_count']++;
            $monthlyStats[$month]['student_count'][] = $financial->student_id;
        }

        // Convert student arrays to counts
        foreach ($monthlyStats as &$stat) {
            $stat['unique_students'] = count(array_unique($stat['student_count']));
            unset($stat['student_count']);
        }

        return array_values($monthlyStats);
    }

    /**
     * Get top students by total deduction amount
     */
    private function getTopStudentsByDeduction($financials, $limit = 10)
    {
        $studentTotals = [];
        
        foreach ($financials as $financial) {
            $studentId = $financial->student_id;
            
            if (!isset($studentTotals[$studentId])) {
                $studentTotals[$studentId] = [
                    'student_id' => $studentId,
                    'student_name' => $financial->student->student_name,
                    'room_number' => $financial->student->room ? $financial->student->room->room_no : 'N/A',
                    'total_deducted' => 0,
                    'checkout_count' => 0
                ];
            }
            
            $studentTotals[$studentId]['total_deducted'] += (float) $financial->deducted_amount;
            $studentTotals[$studentId]['checkout_count']++;
        }

        // Sort by total deducted amount and limit
        usort($studentTotals, function($a, $b) {
            return $b['total_deducted'] <=> $a['total_deducted'];
        });

        return array_slice($studentTotals, 0, $limit);
    }

    /**
     * Get deduction amount ranges
     */
    private function getDeductionRanges($financials)
    {
        $ranges = [
            '0-100' => 0,
            '101-500' => 0,
            '501-1000' => 0,
            '1001-2000' => 0,
            '2000+' => 0
        ];

        foreach ($financials as $financial) {
            $amount = (float) $financial->deducted_amount;
            
            if ($amount <= 100) {
                $ranges['0-100']++;
            } elseif ($amount <= 500) {
                $ranges['101-500']++;
            } elseif ($amount <= 1000) {
                $ranges['501-1000']++;
            } elseif ($amount <= 2000) {
                $ranges['1001-2000']++;
            } else {
                $ranges['2000+']++;
            }
        }

        return $ranges;
    }

    /**
     * Export checkout financials for a specific period
     */
    public function exportFinancials(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->toDateString());
            $endDate = $request->get('end_date', Carbon::now()->toDateString());
            $blockId = $request->get('block_id');

            $query = StudentCheckoutFinancial::with(['student.room.block', 'checkInCheckOut', 'checkoutRule'])
                ->whereHas('checkInCheckOut', function($q) use ($startDate, $endDate) {
                    $q->whereBetween('date', [$startDate, $endDate]);
                });

            if ($blockId) {
                $query->whereHas('student.room', function($q) use ($blockId) {
                    $q->where('block_id', $blockId);
                });
            }

            $financials = $query->orderBy('created_at', 'desc')->get();

            $exportData = $financials->map(function($financial) {
                return [
                    'date' => $financial->checkInCheckOut->date,
                    'student_name' => $financial->student->student_name,
                    'student_id' => $financial->student->student_id,
                    'room_no' => $financial->student->room ? $financial->student->room->room_no : 'N/A',
                    'block_name' => $financial->student->room && $financial->student->room->block ? 
                                   $financial->student->room->block->block_name : 'N/A',
                    'checkout_duration' => $financial->checkout_duration,
                    'deducted_amount' => $financial->deducted_amount,
                    'rule_percentage' => $financial->checkoutRule ? $financial->checkoutRule->percentage : 'N/A',
                    'checkin_time' => $financial->checkInCheckOut->checkin_time,
                    'checkout_time' => $financial->checkInCheckOut->checkout_time,
                    'remarks' => $financial->checkInCheckOut->remarks
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $exportData,
                'summary' => [
                    'total_records' => $financials->count(),
                    'total_deducted' => $financials->sum('deducted_amount'),
                    'period' => $startDate . ' to ' . $endDate
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export financials: ' . $e->getMessage()
            ], 500);
        }
    }
}
