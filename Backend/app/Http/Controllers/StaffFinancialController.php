<?php

namespace App\Http\Controllers;

use App\Models\StaffFinancial;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class StaffFinancialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $financials = StaffFinancial::with('staff', 'paymentType')->paginate(15);
        return response()->json($financials);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'amount' => 'required|string',
            'payment_date' => 'required|date',
            'remark' => 'nullable|string',
            'payment_type_id' => 'nullable|exists:payment_types,id',
        ]);
        
        $financial = StaffFinancial::create($validated);
        
        return response()->json($financial, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $financial = StaffFinancial::with('staff', 'paymentType')->findOrFail($id);
        return response()->json($financial);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $financial = StaffFinancial::findOrFail($id);
        
        $validated = $request->validate([
            'staff_id' => 'sometimes|required|exists:staff,id',
            'amount' => 'sometimes|required|string',
            'payment_date' => 'sometimes|required|date',
            'remark' => 'nullable|string',
            'payment_type_id' => 'nullable|exists:payment_types,id',
        ]);
        
        $financial->update($validated);
        
        return response()->json($financial);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $financial = StaffFinancial::findOrFail($id);
        $financial->delete();
        
        return response()->json(null, 204);
    }
    
    /**
     * Get financial records for a specific staff member
     */
    public function getStaffFinancials(string $staffId): JsonResponse
    {
        try {
            $staff = Staff::findOrFail($staffId);
            $financials = StaffFinancial::where('staff_id', $staffId)
                ->with(['staff', 'paymentType'])
                ->orderBy('payment_date', 'desc')
                ->get();
                
            return response()->json($financials);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch staff financials',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get fields metadata for API documentation/frontend
     */
    public function getFields(): JsonResponse
    {
        return response()->json([
            'fields' => [
                'staff_id' => ['type' => 'foreign_id', 'required' => true, 'table' => 'staff'],
                'amount' => ['type' => 'string', 'required' => true],
                'payment_date' => ['type' => 'date', 'required' => true],
                'remark' => ['type' => 'string', 'required' => false],
                'payment_type_id' => ['type' => 'foreign_id', 'required' => false, 'table' => 'payment_types'],
            ],
            'note' => 'Financial records are separate from staff records. Staff basic info is handled via /api/staff endpoints'
        ]);
    }

    /**
     * Get the authenticated staff's financial records (staff-specific)
     */
    public function getMyFinancials(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user using user_id relationship
            $staff = Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['error' => 'Staff record not found'], 404);
            }

            $financials = StaffFinancial::where('staff_id', $staff->id)
                ->with(['staff', 'paymentType'])
                ->orderBy('payment_date', 'desc')
                ->get();
                
            return response()->json($financials);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch your financial records',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated staff's salary history (staff-specific)
     */
    public function getMySalaryHistory(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user using user_id relationship
            $staff = Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['error' => 'Staff record not found'], 404);
            }

            // Get salary records from the Salary model
            $salaries = \App\Models\Salary::where('staff_id', $staff->id)
                ->with(['staff:id,staff_name,position,department'])
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get();
                
            return response()->json($salaries);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch your salary history',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
