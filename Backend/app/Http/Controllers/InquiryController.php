<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use App\Models\InquirySeater;
use App\Models\Block;
use App\Models\Room;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InquiryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $inquiries = Inquiry::with(['block', 'inquirySeaters.room'])
            ->orderBy('created_at', 'desc')
            ->get();
            
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
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'block_id' => 'required|exists:blocks,id',
            'seater' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'inquiry_seaters' => 'sometimes|array',
            'inquiry_seaters.*.room_id' => 'required|exists:rooms,id',
            'inquiry_seaters.*.capacity' => 'required|integer|min:1',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|mimes:jpeg,png,jpg,pdf,doc,docx|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            // Create the inquiry
            $inquiry = Inquiry::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'block_id' => $request->block_id,
                'seater' => $request->seater,
                'description' => $request->description,
            ]);
            
            // Process inquiry seaters if provided
            if ($request->has('inquiry_seaters') && is_array($request->inquiry_seaters)) {
                foreach ($request->inquiry_seaters as $seaterData) {
                    // Get the room to verify it belongs to the selected block
                    $room = Room::find($seaterData['room_id']);
                    
                    if ($room && $room->block_id == $request->block_id) {
                        InquirySeater::create([
                            'inquiry_id' => $inquiry->id,
                            'room_id' => $seaterData['room_id'],
                            'block_id' => $request->block_id,
                            'capacity' => $seaterData['capacity'],
                        ]);
                    } else {
                        throw new \Exception('Room does not belong to the selected block');
                    }
                }
            }
            
            // Process attachments if any
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('inquiries', 'public');
                    
                    Attachment::create([
                        'inquiry_id' => $inquiry->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }
            
            DB::commit();
            
            // Reload inquiry with relationships
            $inquiry = Inquiry::with(['block', 'inquirySeaters.room', 'attachments'])->find($inquiry->id);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry created successfully',
                'data' => $inquiry
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create inquiry',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $inquiry = Inquiry::with(['block', 'inquirySeaters.room', 'attachments'])
                ->findOrFail($id);
                
            return response()->json([
                'status' => 'success',
                'data' => $inquiry
            ]);
        } catch (\Exception $e) {
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
        
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'block_id' => 'sometimes|exists:blocks,id',
            'seater' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'inquiry_seaters' => 'sometimes|array',
            'inquiry_seaters.*.id' => 'sometimes|exists:inquiry_seaters,id',
            'inquiry_seaters.*.room_id' => 'required|exists:rooms,id',
            'inquiry_seaters.*.capacity' => 'required|integer|min:1',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|mimes:jpeg,png,jpg,pdf,doc,docx|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Update the inquiry details
            $inquiry->update($request->only([
                'name', 'email', 'phone', 'block_id', 'seater', 'description'
            ]));
            
            // Process inquiry seaters if provided
            if ($request->has('inquiry_seaters') && is_array($request->inquiry_seaters)) {
                // First, collect the IDs of the seaters being updated
                $providedSeaterIds = collect($request->inquiry_seaters)
                    ->pluck('id')
                    ->filter()
                    ->toArray();
                
                // Delete any seaters not in the provided list
                InquirySeater::where('inquiry_id', $inquiry->id)
                    ->whereNotIn('id', $providedSeaterIds)
                    ->delete();
                
                // Update or create seaters
                foreach ($request->inquiry_seaters as $seaterData) {
                    // Get the room to verify it belongs to the selected block
                    $room = Room::find($seaterData['room_id']);
                    $blockId = $request->block_id ?? $inquiry->block_id;
                    
                    if ($room && $room->block_id == $blockId) {
                        if (isset($seaterData['id'])) {
                            // Update existing seater
                            InquirySeater::where('id', $seaterData['id'])
                                ->where('inquiry_id', $inquiry->id)
                                ->update([
                                    'room_id' => $seaterData['room_id'],
                                    'block_id' => $blockId,
                                    'capacity' => $seaterData['capacity'],
                                ]);
                        } else {
                            // Create new seater
                            InquirySeater::create([
                                'inquiry_id' => $inquiry->id,
                                'room_id' => $seaterData['room_id'],
                                'block_id' => $blockId,
                                'capacity' => $seaterData['capacity'],
                            ]);
                        }
                    } else {
                        throw new \Exception('Room does not belong to the selected block');
                    }
                }
            }
            
            // Process attachments if any
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('inquiries', 'public');
                    
                    Attachment::create([
                        'inquiry_id' => $inquiry->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }
            
            DB::commit();
            
            // Reload inquiry with relationships
            $inquiry = Inquiry::with(['block', 'inquirySeaters.room', 'attachments'])->find($inquiry->id);
            
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
            
            // Delete related inquiry seaters
            InquirySeater::where('inquiry_id', $id)->delete();
            
            // Delete related attachments and their files
            $attachments = Attachment::where('inquiry_id', $id)->get();
            foreach ($attachments as $attachment) {
                // Delete the file from storage
                if (\Storage::disk('public')->exists($attachment->file_path)) {
                    \Storage::disk('public')->delete($attachment->file_path);
                }
                
                // Delete the attachment record
                $attachment->delete();
            }
            
            // Delete the inquiry
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
            if (\Storage::disk('public')->exists($attachment->file_path)) {
                \Storage::disk('public')->delete($attachment->file_path);
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
}
