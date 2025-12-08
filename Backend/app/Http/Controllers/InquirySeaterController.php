<?php

namespace App\Http\Controllers;

use App\Models\InquirySeater;
use App\Models\Room;
use App\Models\Inquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InquirySeaterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $inquirySeaters = InquirySeater::with(['room', 'inquiry', 'block'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'status' => 'success',
            'data' => $inquirySeaters
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'inquiry_id' => 'required|exists:inquiries,id',
            'seater_type' => 'required|integer|min:1|max:4',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // Verify that room belongs to the specified block
            $room = Room::find($request->room_id);
            if (!$room || $room->block_id != $request->block_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Room does not belong to the specified block'
                ], 422);
            }
            
            // Verify that inquiry belongs to the specified block
            $inquiry = Inquiry::find($request->inquiry_id);
            if (!$inquiry || $inquiry->block_id != $request->block_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Inquiry does not belong to the specified block'
                ], 422);
            }
            
            $inquirySeater = InquirySeater::create([
                'inquiry_id' => $request->inquiry_id,
                'room_id' => $request->room_id,
                'block_id' => $request->block_id,
                'capacity' => $request->capacity,
            ]);
            
            // Load relationships
            $inquirySeater->load(['room', 'inquiry', 'block']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry seater created successfully',
                'data' => $inquirySeater
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create inquiry seater',
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
            $inquirySeater = InquirySeater::with(['room', 'inquiry', 'block'])
                ->findOrFail($id);
                
            return response()->json([
                'status' => 'success',
                'data' => $inquirySeater
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inquiry seater not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Find the inquiry seater
        $inquirySeater = InquirySeater::find($id);
        
        if (!$inquirySeater) {
            return response()->json([
                'status' => 'error',
                'message' => 'Inquiry seater not found'
            ], 404);
        }
        
        // Validate incoming request
        $validator = Validator::make($request->all(), [
            'room_id' => 'sometimes|exists:rooms,id',
            'capacity' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            // If room_id is being updated, verify it belongs to the same block
            if ($request->has('room_id')) {
                $room = Room::find($request->room_id);
                if (!$room || $room->block_id != $inquirySeater->block_id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Room does not belong to the same block'
                    ], 422);
                }
                
                $inquirySeater->room_id = $request->room_id;
            }
            
            // Update capacity if provided
            if ($request->has('capacity')) {
                $inquirySeater->capacity = $request->capacity;
            }
            
            $inquirySeater->save();
            
            // Reload with relationships
            $inquirySeater->load(['room', 'inquiry', 'block']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry seater updated successfully',
                'data' => $inquirySeater
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update inquiry seater',
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
            $inquirySeater = InquirySeater::findOrFail($id);
            $inquirySeater->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Inquiry seater deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete inquiry seater',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all seaters for a specific inquiry
     */
    public function getSeatersByInquiry(string $inquiryId)
    {
        try {
            $inquirySeaters = InquirySeater::with(['room', 'block'])
                ->where('inquiry_id', $inquiryId)
                ->get();
                
            return response()->json([
                'status' => 'success',
                'data' => $inquirySeaters
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch inquiry seaters',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all seaters for a specific room
     */
    public function getSeatersByRoom(string $roomId)
    {
        try {
            $inquirySeaters = InquirySeater::with(['inquiry', 'block'])
                ->where('room_id', $roomId)
                ->get();
                
            return response()->json([
                'status' => 'success',
                'data' => $inquirySeaters
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch inquiry seaters',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
