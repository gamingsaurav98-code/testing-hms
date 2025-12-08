<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\Attachment;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InquiryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // If user is staff, only show their own inquiries
        if ($user && $user->role === 'staff' && $user->staffProfile) {
            $inquiries = Inquiry::with('staff:id,staff_name,email')
                ->where('staff_id', $user->staffProfile->id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // Admin sees all inquiries
            $inquiries = Inquiry::with('staff:id,staff_name,email')
                ->orderBy('created_at', 'desc')
                ->get();
        }
            
        return response()->json([
            'status' => 'success',
            'data' => $inquiries
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Log the incoming request
        Log::info('Creating inquiry with data:', $request->all());
        
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'seater_type' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get only the fillable fields
            $data = $request->only([
                'name',
                'email',
                'phone',
                'seater_type'
            ]);
            
            // Add staff_id if the user is authenticated and is a staff member
            $user = $request->user();
            if ($user && $user->role === 'staff' && $user->staffProfile) {
                $data['staff_id'] = $user->staffProfile->id;
            }
            
            Log::info('Filtered inquiry data:', $data);
            
            // Create the inquiry
            $inquiry = Inquiry::create($data);
            
            // Load staff relationship if exists
            if ($inquiry->staff_id) {
                $inquiry->load('staff:id,staff_name,email');
            }
            
            Log::info('Inquiry created successfully:', $inquiry->toArray());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry created successfully',
                'data' => $inquiry
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Failed to create inquiry:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Server error: ' . $e->getMessage(),
                'debug_message' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        try {
            $inquiry = Inquiry::with('staff:id,staff_name,email')->findOrFail($id);
            
            $user = $request->user();
            
            // If user is staff, validate they own this inquiry
            if ($user && $user->role === 'staff' && $user->staffProfile) {
                if ($inquiry->staff_id !== $user->staffProfile->id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'You are not authorized to view this inquiry.'
                    ], 403);
                }
            }
            
            // Log the inquiry data being sent
            Log::info('Showing inquiry:', $inquiry->toArray());
            
            return response()->json([
                'status' => 'success',
                'data' => $inquiry
            ]);
        } catch (\Exception $e) {
            Log::error('Error showing inquiry:', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Inquiry not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Find the inquiry
        $inquiry = Inquiry::find($id);
        
        if (!$inquiry) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inquiry not found'
            ], 404);
        }
        
        $user = $request->user();
        
        // If user is staff, validate they own this inquiry
        if ($user && $user->role === 'staff' && $user->staffProfile) {
            if ($inquiry->staff_id !== $user->staffProfile->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You are not authorized to update this inquiry.'
                ], 403);
            }
        }
        
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'seater_type' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // Update the inquiry details
            $inquiry->update($request->only([
                'name', 'email', 'phone', 'seater_type'
            ]));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry updated successfully',
                'data' => $inquiry
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update inquiry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $inquiry = Inquiry::findOrFail($id);
            $inquiry->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete inquiry',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete a specific attachment from an inquiry
     */
    public function deleteAttachment(string $inquiryId, string $attachmentId)
    {
        try {
            $attachment = Attachment::where('id', $attachmentId)
                ->where('inquiry_id', $inquiryId)
                ->firstOrFail();
                
            // Delete the file from storage
            if (Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }
            
            // Delete the attachment record
            $attachment->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Attachment deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete attachment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get inquiries for a specific block
     */
    public function getInquiriesByBlock(string $blockId)
    {
        try {
            $inquiries = Inquiry::with(['block', 'inquirySeaters.room'])
                ->where('block_id', $blockId)
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json([
                'status' => 'success',
                'data' => $inquiries
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch inquiries',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
