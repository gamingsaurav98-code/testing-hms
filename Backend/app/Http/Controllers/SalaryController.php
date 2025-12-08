<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Models\Staff;
use App\Services\DateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Use select to limit fields and improve performance
            $query = Salary::select([
                'id', 'staff_id', 'amount', 'month', 'year', 'description', 'status', 'created_at', 'updated_at'
            ])->with(['staff' => function($query) {
                $query->select('id', 'staff_name', 'position', 'department', 'contact_number', 'email');
            }]);

            // Apply filters
            if ($request->has('staff_id')) {
                $query->where('staff_id', $request->staff_id);
            }

            if ($request->has('month')) {
                $query->where('month', $request->month);
            }

            if ($request->has('year')) {
                $query->where('year', $request->year);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Order by latest and limit results for better performance
            $query->orderBy('year', 'desc')->orderBy('month', 'desc');

            // Return paginated results by default for better performance
            if ($request->has('paginate') && $request->paginate === 'false') {
                // Only get all if explicitly requested and limit to recent records
                $salaries = $query->limit(1000)->get();
            } else {
                $perPage = min($request->get('per_page', 15), 100); // Cap at 100 per page
                $salaries = $query->paginate($perPage);
            }

            return response()->json($salaries);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch salaries',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Not needed for API
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'staff_id' => 'required|exists:staff,id',
                'amount' => 'required|numeric|min:0.01',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:' . (date('Y') + 1),
                'description' => 'nullable|string|max:1000',
                'status' => 'nullable|string|in:pending,paid,cancelled',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if salary already exists for this staff, month and year
            $existingSalary = Salary::where('staff_id', $request->staff_id)
                ->where('month', $request->month)
                ->where('year', $request->year)
                ->first();

            if ($existingSalary) {
                return response()->json([
                    'error' => 'Salary already exists for this staff member for the specified month and year'
                ], 409);
            }

            $salary = Salary::create([
                'staff_id' => $request->staff_id,
                'amount' => $request->amount,
                'month' => $request->month,
                'year' => $request->year,
                'description' => $request->description,
                'status' => $request->status ?? 'pending',
            ]);

            // Load relationships and return
            $salary->load(['staff:id,staff_name,position,department']);
            
            return response()->json($salary, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create salary',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $salary = Salary::select([
                'id', 'staff_id', 'amount', 'month', 'year', 'description', 'status', 'created_at', 'updated_at'
            ])->with(['staff:id,staff_name,position,department,contact_number,email'])
              ->findOrFail($id);
            return response()->json($salary);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Salary not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch salary',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Not needed for API
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $salary = Salary::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'staff_id' => 'sometimes|required|exists:staff,id',
                'amount' => 'sometimes|required|numeric|min:0.01',
                'month' => 'sometimes|required|integer|min:1|max:12',
                'year' => 'sometimes|required|integer|min:2000|max:' . (date('Y') + 1),
                'description' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|nullable|string|in:pending,paid,cancelled',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if updating to a month/year combination that already exists for this or another staff
            if ($request->has('staff_id') || $request->has('month') || $request->has('year')) {
                $existingSalary = Salary::where('staff_id', $request->staff_id ?? $salary->staff_id)
                    ->where('month', $request->month ?? $salary->month)
                    ->where('year', $request->year ?? $salary->year)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingSalary) {
                    return response()->json([
                        'error' => 'Salary already exists for this staff member for the specified month and year'
                    ], 409);
                }
            }

            $salary->update($request->only(['staff_id', 'amount', 'month', 'year', 'description', 'status']));

            // Load relationships and return
            $salary->load(['staff:id,staff_name,position,department']);
            
            return response()->json($salary);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Salary not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update salary',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $salary = Salary::findOrFail($id);
            $salary->delete();

            return response()->json(null, 204);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Salary not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete salary',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get salaries for a specific staff member
     */
    public function getStaffSalaries(string $staffId): JsonResponse
    {
        try {
            $staff = Staff::select('id', 'staff_name')->findOrFail($staffId);
            $salaries = Salary::select([
                'id', 'staff_id', 'amount', 'month', 'year', 'status', 'created_at', 'updated_at'
            ])->where('staff_id', $staffId)
                ->with(['staff:id,staff_name,position,department'])
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->limit(100) // Limit to recent 100 records
                ->get();
                
            return response()->json($salaries);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Staff not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch staff salaries',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get salary statistics
     */
    public function getSalaryStatistics(): JsonResponse
    {
        try {
            $currentYear = date('Y');
            $currentMonth = date('n');

            $statistics = [
                'total_salaries_this_month' => Salary::where('month', $currentMonth)
                    ->where('year', $currentYear)
                    ->count(),
                'total_amount_this_month' => Salary::where('month', $currentMonth)
                    ->where('year', $currentYear)
                    ->sum('amount'),
                'paid_salaries_this_month' => Salary::where('month', $currentMonth)
                    ->where('year', $currentYear)
                    ->where('status', 'paid')
                    ->count(),
                'pending_salaries_this_month' => Salary::where('month', $currentMonth)
                    ->where('year', $currentYear)
                    ->where('status', 'pending')
                    ->count(),
                'total_salaries_this_year' => Salary::where('year', $currentYear)->count(),
                'total_amount_this_year' => Salary::where('year', $currentYear)->sum('amount'),
            ];

            return response()->json($statistics);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch salary statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
