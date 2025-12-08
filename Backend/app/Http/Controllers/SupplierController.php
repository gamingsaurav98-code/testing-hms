<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers.
     */
    public function index()
    {
        $suppliers = Supplier::with(['expenses', 'financials', 'supplierPayments', 'transactions', 'attachments'])->get();

        return response()->json([
            'status' => true,
            'data' => $suppliers,
        ]);
    }

    /**
     * Store a newly created supplier.
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
            'balance_type' => 'nullable|in:due,advance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $supplier = Supplier::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Supplier created successfully',
            'data' => $supplier,
        ], 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(string $id)
    {
        try {
            $supplier = Supplier::with(['financials', 'supplierPayments', 'transactions', 'expenses', 'attachments'])->findOrFail($id);

            return response()->json([
                'status' => true,
                'data' => $supplier,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found',
            ], 404);
        }
    }

    /**
     * Update the specified supplier in storage.
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
                'balance_type' => 'nullable|in:due,advance',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $supplier->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Supplier updated successfully',
                'data' => $supplier,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found',
            ], 404);
        }
    }

    /**
     * Remove the specified supplier from storage.
     */
    public function destroy(string $id)
    {
        try {
            $supplier = Supplier::findOrFail($id);

            // Prevent deletion if related records exist
            if ($supplier->financials()->exists()
                || $supplier->supplierPayments()->exists()
                || $supplier->transactions()->exists()
                || $supplier->expenses()->exists()
            ) {
                return response()->json([
                    'status' => false,
                    'message' => 'Cannot delete supplier with related records',
                ], 400);
            }

            $supplier->delete();

            return response()->json([
                'status' => true,
                'message' => 'Supplier deleted successfully',
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Supplier not found',
            ], 404);
        }
    }

    /**
     * Upload an attachment for a supplier.
     */
    public function uploadAttachment(Request $request, string $id)
    {
        try {
            $supplier = Supplier::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json(['status' => false, 'message' => 'Supplier not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'attachment' => 'required|file|max:10240', // 10MB max
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (! $request->hasFile('attachment')) {
            return response()->json(['status' => false, 'message' => 'No file uploaded'], 400);
        }

        $file = $request->file('attachment');
        $path = $file->store('supplier_attachments', 'public');

        $attachment = new Attachment([
            'name' => $request->input('name'),
            'path' => $path,
            'type' => $request->input('type'),
            'supplier_id' => $supplier->id,
        ]);

        $attachment->save();

        return response()->json([
            'status' => true,
            'message' => 'Attachment uploaded successfully',
            'data' => $attachment,
        ], 201);
    }

    /**
     * Update an existing attachment for a supplier.
     */
    public function updateAttachment(Request $request, string $id, string $attachmentId)
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $attachment = Attachment::findOrFail($attachmentId);
        } catch (ModelNotFoundException $e) {
            return response()->json(['status' => false, 'message' => 'Supplier or attachment not found'], 404);
        }

        if ($attachment->supplier_id !== $supplier->id) {
            return response()->json(['status' => false, 'message' => 'The attachment does not belong to this supplier'], 403);
        }

        $validator = Validator::make($request->all(), [
            'attachment' => 'nullable|file|max:10240',
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'message' => 'Validation errors', 'errors' => $validator->errors()], 422);
        }

        if ($request->has('name')) {
            $attachment->name = $request->input('name');
        }

        if ($request->has('type')) {
            $attachment->type = $request->input('type');
        }

        if ($request->hasFile('attachment')) {
            if (Storage::disk('public')->exists($attachment->path)) {
                Storage::disk('public')->delete($attachment->path);
            }

            $file = $request->file('attachment');
            $path = $file->store('supplier_attachments', 'public');
            $attachment->path = $path;
        }

        $attachment->save();

        return response()->json(['status' => true, 'message' => 'Attachment updated successfully', 'data' => $attachment]);
    }

    /**
     * Delete an attachment for a supplier.
     */
    public function deleteAttachment(string $id, string $attachmentId)
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $attachment = Attachment::findOrFail($attachmentId);
        } catch (ModelNotFoundException $e) {
            return response()->json(['status' => false, 'message' => 'Supplier or attachment not found'], 404);
        }

        if ($attachment->supplier_id !== $supplier->id) {
            return response()->json(['status' => false, 'message' => 'The attachment does not belong to this supplier'], 403);
        }

        if (Storage::disk('public')->exists($attachment->path)) {
            Storage::disk('public')->delete($attachment->path);
        }

        $attachment->delete();

        return response()->json(['status' => true, 'message' => 'Attachment deleted successfully']);
    }
}
