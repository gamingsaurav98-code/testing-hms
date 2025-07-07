<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SupplierFinancial;
use App\Models\Supplier;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SupplierFinancialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $financials = SupplierFinancial::with(['supplier', 'paymentType'])->get();
        
        return response()->json([
            'status' => true,
            'data' => $financials
        ]);
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
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'initial_balance' => 'required|numeric',
            'balance_type' => 'required|in:due,advance',
            'amount' => 'required|numeric',
            'payment_date' => 'required|date',
            'payment_type_id' => 'required|exists:payment_types,id',
            'remark' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        // First create the financial record
        $financial = SupplierFinancial::create($request->all());
        
        // Then update the supplier's opening balance and balance type
        try {
            $supplier = Supplier::findOrFail($request->supplier_id);
            $supplier->update([
                'opening_balance' => $request->initial_balance,
                'balance_type' => $request->balance_type
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found'
            ], 404);
        }

        // Return the financial record with related models
        $financial->load(['supplier', 'paymentType']);
        
        return response()->json([
            'status' => true,
            'message' => 'Financial record created successfully',
            'data' => $financial
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $financial = SupplierFinancial::with(['supplier', 'paymentType'])->findOrFail($id);
            
            return response()->json([
                'status' => true,
                'data' => $financial
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Financial record not found'
            ], 404);
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
    public function update(Request $request, string $id)
    {
        try {
            $financial = SupplierFinancial::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'supplier_id' => 'sometimes|required|exists:suppliers,id',
                'initial_balance' => 'sometimes|required|numeric',
                'balance_type' => 'sometimes|required|in:due,advance',
                'amount' => 'sometimes|required|numeric',
                'payment_date' => 'sometimes|required|date',
                'payment_type_id' => 'sometimes|required|exists:payment_types,id',
                'remark' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            $financial->update($request->all());
            
            // If initial_balance or balance_type is being updated, also update the supplier
            if ($request->has('initial_balance') || $request->has('balance_type')) {
                $supplierId = $request->supplier_id ?? $financial->supplier_id;
                $supplier = Supplier::findOrFail($supplierId);
                
                $updates = [];
                if ($request->has('initial_balance')) {
                    $updates['opening_balance'] = $request->initial_balance;
                }
                if ($request->has('balance_type')) {
                    $updates['balance_type'] = $request->balance_type;
                }
                
                $supplier->update($updates);
            }
            
            $financial->load(['supplier', 'paymentType']);
            
            return response()->json([
                'status' => true,
                'message' => 'Financial record updated successfully',
                'data' => $financial
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Financial record not found'
            ], 404);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $financial = SupplierFinancial::findOrFail($id);
            $financial->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'Financial record deleted successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Financial record not found'
            ], 404);
        }
    }
    
    /**
     * Get all financial records for a supplier
     */
    public function getFinancialsBySupplier(string $supplierId)
    {
        try {
            // Verify that supplier exists
            $supplier = Supplier::findOrFail($supplierId);
            
            $financials = SupplierFinancial::with(['supplier', 'paymentType'])
                ->where('supplier_id', $supplierId)
                ->orderBy('payment_date', 'desc')
                ->get();
            
            return response()->json([
                'status' => true,
                'data' => $financials
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found'
            ], 404);
        }
    }
}
