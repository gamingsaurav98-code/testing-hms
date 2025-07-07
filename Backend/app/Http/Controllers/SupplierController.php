<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $suppliers = Supplier::all();
        return response()->json([
            'status' => true,
            'data' => $suppliers
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
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:suppliers,email',
            'contact_number' => 'required|string|max:20',
            'address' => 'required|string',
            'description' => 'nullable|string',
            'pan_number' => 'nullable|string|max:50',
            'opening_balance' => 'nullable|numeric',
            'balance_type' => 'nullable|in:due,advance'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors()
            ], 422);
        }

        $supplier = Supplier::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Supplier created successfully',
            'data' => $supplier
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $supplier = Supplier::with([
                'financials', 
                'supplierPayments', 
                'transactions', 
                'expenses',
                'attachments'
            ])->findOrFail($id);
            
            return response()->json([
                'status' => true,
                'data' => $supplier
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found'
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
            $supplier = Supplier::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|unique:suppliers,email,' . $id,
                'contact_number' => 'sometimes|required|string|max:20',
                'address' => 'sometimes|required|string',
                'description' => 'nullable|string',
                'pan_number' => 'nullable|string|max:50',
                'opening_balance' => 'nullable|numeric',
                'balance_type' => 'nullable|in:due,advance'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            $supplier->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Supplier updated successfully',
                'data' => $supplier
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found'
            ], 404);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $supplier = Supplier::findOrFail($id);
            
            // Check for related records before deleting
            if ($supplier->financials()->count() > 0 || 
                $supplier->supplierPayments()->count() > 0 || 
                $supplier->transactions()->count() > 0 || 
                $supplier->expenses()->count() > 0) {
                
                return response()->json([
                    'status' => false,
                    'message' => 'Cannot delete supplier with related records'
                ], 400);
            }
            
            $supplier->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'Supplier deleted successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found'
            ], 404);
        }
    }
    
    /**
     * Upload attachment for a supplier
     */
    public function uploadAttachment(Request $request, string $id)
    {
        try {
            $supplier = Supplier::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'attachment' => 'required|file|max:10240', // 10MB max size
                'name' => 'required|string|max:255',
                'type' => 'required|string|max:50',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $path = $file->store('supplier_attachments', 'public');
                
                $attachment = new \App\Models\Attachment([
                    'name' => $request->name,
                    'path' => $path,
                    'type' => $request->type,
                    'supplier_id' => $supplier->id,
                ]);
                
                $attachment->save();
                
                return response()->json([
                    'status' => true,
                    'message' => 'Attachment uploaded successfully',
                    'data' => $attachment
                ], 201);
            }
            
            return response()->json([
                'status' => false,
                'message' => 'No file uploaded'
            ], 400);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found'
            ], 404);
        }
    }
    
    /**
     * Update an existing attachment for a supplier
     */
    public function updateAttachment(Request $request, string $id, string $attachmentId)
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $attachment = \App\Models\Attachment::findOrFail($attachmentId);
            
            // Check if the attachment belongs to this supplier
            if ($attachment->supplier_id != $supplier->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'The attachment does not belong to this supplier'
                ], 403);
            }
            
            $validator = Validator::make($request->all(), [
                'attachment' => 'nullable|file|max:10240', // 10MB max size
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|string|max:50',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Update the attachment details
            if ($request->has('name')) {
                $attachment->name = $request->name;
            }
            
            if ($request->has('type')) {
                $attachment->type = $request->type;
            }
            
            // Replace the file if a new one is uploaded
            if ($request->hasFile('attachment')) {
                // Delete old file
                if (\Storage::disk('public')->exists($attachment->path)) {
                    \Storage::disk('public')->delete($attachment->path);
                }
                
                // Store new file
                $file = $request->file('attachment');
                $path = $file->store('supplier_attachments', 'public');
                $attachment->path = $path;
            }
            
            $attachment->save();
            
            return response()->json([
                'status' => true,
                'message' => 'Attachment updated successfully',
                'data' => $attachment
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage() === 'No query results for model [App\\Models\\Supplier].'
                    ? 'Supplier not found'
                    : 'Attachment not found'
            ], 404);
        }
    }
    
    /**
     * Delete an attachment for a supplier
     */
    public function deleteAttachment(string $id, string $attachmentId)
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $attachment = \App\Models\Attachment::findOrFail($attachmentId);
            
            // Check if the attachment belongs to this supplier
            if ($attachment->supplier_id != $supplier->id) {
                return response()->json([
                    'status' => false,
                    'message' => 'The attachment does not belong to this supplier'
                ], 403);
            }
            
            // Delete the file from storage
            if (\Storage::disk('public')->exists($attachment->path)) {
                \Storage::disk('public')->delete($attachment->path);
            }
            
            // Delete the attachment record
            $attachment->delete();
            
            return response()->json([
                'status' => true,
                'message' => 'Attachment deleted successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage() === 'No query results for model [App\\Models\\Supplier].'
                    ? 'Supplier not found'
                    : 'Attachment not found'
            ], 404);
        }
    }
}
