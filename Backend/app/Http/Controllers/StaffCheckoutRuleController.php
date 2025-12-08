<?php

namespace App\Http\Controllers;

use App\Models\StaffCheckoutRule;
use App\Models\Staff;
use App\Services\DateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StaffCheckoutRuleController extends Controller
{
    protected $dateService;

    public function __construct(DateService $dateService)
    {
        $this->dateService = $dateService;
    }

    /**
     * Display a listing of staff checkout rules.
     */
    public function index(Request $request)
    {
        try {
            $query = StaffCheckoutRule::with(['staff']);

            // Filter by staff
            if ($request->has('staff_id')) {
                $query->where('staff_id', $request->staff_id);
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $isActive = $request->is_active === 'true' || $request->is_active === '1';
                $query->where('is_active', $isActive);
            }

            // Filter by department (through staff relationship)
            if ($request->has('department')) {
                $query->whereHas('staff', function($q) use ($request) {
                    $q->where('department', $request->department);
                });
            }

            // Filter by position (through staff relationship)
            if ($request->has('position')) {
                $query->whereHas('staff', function($q) use ($request) {
                    $q->where('position', $request->position);
                });
            }

            // Get all records without pagination if requested
            if ($request->has('all') && $request->all === 'true') {
                $rules = $query->orderBy('created_at', 'desc')->get();
            } else {
                $perPage = $request->has('per_page') ? (int)$request->per_page : 15;
                $rules = $query->orderBy('created_at', 'desc')->paginate($perPage);
            }

            return response()->json($rules);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch checkout rules: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created checkout rule.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'is_active' => 'nullable|boolean',
            'active_after_days' => 'nullable|integer|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if staff already has an active rule
            $existingRule = StaffCheckoutRule::where('staff_id', $request->staff_id)
                ->where('is_active', true)
                ->first();

            if ($existingRule) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Staff already has an active checkout rule. Please deactivate the existing rule first.'
                ], 422);
            }

            $rule = StaffCheckoutRule::create([
                'staff_id' => $request->staff_id,
                'is_active' => $request->is_active ?? true,
                'active_after_days' => $request->active_after_days,
                'percentage' => $request->percentage,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout rule created successfully',
                'data' => $rule->load(['staff'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create checkout rule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified checkout rule.
     */
    public function show(string $id)
    {
        try {
            $rule = StaffCheckoutRule::with([
                'staff', 
                'checkoutFinancials.checkInCheckOut',
                'checkInCheckOuts'
            ])->find($id);

            if (!$rule) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout rule not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $rule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch checkout rule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified checkout rule.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'is_active' => 'nullable|boolean',
            'active_after_days' => 'nullable|integer|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rule = StaffCheckoutRule::find($id);
            if (!$rule) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout rule not found'
                ], 404);
            }

            // If activating this rule, check if staff has another active rule
            if ($request->has('is_active') && $request->is_active) {
                $existingActiveRule = StaffCheckoutRule::where('staff_id', $rule->staff_id)
                    ->where('is_active', true)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingActiveRule) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Staff already has another active checkout rule. Please deactivate it first.'
                    ], 422);
                }
            }

            $rule->update($request->only([
                'is_active',
                'active_after_days',
                'percentage'
            ]));

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout rule updated successfully',
                'data' => $rule->load(['staff'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update checkout rule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified checkout rule.
     */
    public function destroy(string $id)
    {
        try {
            $rule = StaffCheckoutRule::find($id);
            if (!$rule) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout rule not found'
                ], 404);
            }

            // Check if rule has associated checkout financials
            if ($rule->checkoutFinancials()->count() > 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete rule that has associated financial records. Consider deactivating instead.'
                ], 422);
            }

            $rule->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout rule deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete checkout rule: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get checkout rules for a specific staff
     */
    public function getStaffRules($staffId)
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Staff not found'
                ], 404);
            }

            $rules = StaffCheckoutRule::where('staff_id', $staffId)
                ->with(['checkoutFinancials', 'checkInCheckOuts'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $rules
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch staff rules: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle rule active status
     */
    public function toggleStatus(Request $request, string $id)
    {
        try {
            $rule = StaffCheckoutRule::find($id);
            if (!$rule) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Checkout rule not found'
                ], 404);
            }

            // If activating, check if staff has another active rule
            if (!$rule->is_active) {
                $existingActiveRule = StaffCheckoutRule::where('staff_id', $rule->staff_id)
                    ->where('is_active', true)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingActiveRule) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Staff already has another active checkout rule. Please deactivate it first.'
                    ], 422);
                }
            }

            $rule->update(['is_active' => !$rule->is_active]);

            return response()->json([
                'status' => 'success',
                'message' => 'Rule status updated successfully',
                'data' => $rule->load(['staff'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to toggle rule status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get rule application preview for a staff
     */
    public function getRulePreview(Request $request, $staffId)
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Staff not found'
                ], 404);
            }

            $activeRule = StaffCheckoutRule::where('staff_id', $staffId)
                ->where('is_active', true)
                ->first();

            if (!$activeRule) {
                return response()->json([
                    'status' => 'info',
                    'message' => 'No active checkout rule found for this staff',
                    'data' => null
                ]);
            }

            // Get staff's salary amount
            $monthlySalary = (float) $staff->salary_amount ?? 0;

            // Calculate daily and hourly rates
            $dailyRate = $monthlySalary / 30;
            $hourlyRate = $dailyRate / 24;

            // Example calculations for different checkout durations
            $examples = [];
            foreach ([1, 2, 4, 8, 12, 24] as $hours) {
                $deduction = $hourlyRate * $hours * ($activeRule->percentage / 100);
                $examples[] = [
                    'duration_hours' => $hours,
                    'deducted_amount' => number_format($deduction, 2)
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'rule' => $activeRule,
                    'monthly_salary' => $monthlySalary,
                    'daily_rate' => number_format($dailyRate, 2),
                    'hourly_rate' => number_format($hourlyRate, 2),
                    'examples' => $examples
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate rule preview: ' . $e->getMessage()
            ], 500);
        }
    }
}
