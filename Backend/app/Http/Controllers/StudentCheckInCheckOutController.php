<?php

namespace App\Http\Controllers;

use App\Models\StudentCheckInCheckOut;
use App\Models\Student;
use App\Models\Block;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StudentCheckInCheckOutController extends Controller
{
    /**
     * Display a listing of check-in/check-out records.
     */
    public function index(Request $request)
    {
        try {
            $query = StudentCheckInCheckOut::with(['student.room.block', 'block', 'checkoutRule']);

            // Filter by student
            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }

            // Filter by block
            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }

            // Filter by date
            if ($request->has('date')) {
                $query->whereDate('date', $request->date);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('date', [$request->start_date, $request->end_date]);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Order by most recent checkout first (checkout_time desc, then created_at desc)
            $query->orderByRaw('checkout_time IS NULL, checkout_time DESC, created_at DESC');

            // Get all records without pagination if requested
            if ($request->has('all') && $request->all === 'true') {
                $records = $query->get();
                return response()->json([
                    'status' => 'success',
                    'data' => $records
                ]);
            } else {
                $perPage = $request->get('per_page', 15);
                $records = $query->paginate($perPage);
                return response()->json([
                    'status' => 'success',
                    'data' => $records->items(),
                    'pagination' => [
                        'current_page' => $records->currentPage(),
                        'last_page' => $records->lastPage(),
                        'per_page' => $records->perPage(),
                        'total' => $records->total(),
                    ]
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch check-in/check-out records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created check-in/check-out record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'block_id' => 'required|exists:blocks,id',
            'date' => 'required|date',
            'checkin_time' => 'nullable|date',
            'checkout_time' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check for incomplete records for the same student and date
            $existingIncomplete = StudentCheckInCheckOut::where('student_id', $request->student_id)
                ->whereDate('date', $request->date)
                ->where(function($query) {
                    $query->whereNull('checkout_time')
                          ->orWhereNull('checkin_time');
                })
                ->first();

            if ($existingIncomplete) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student has an incomplete check-in/check-out record for this date. Please complete it first.'
                ], 422);
            }

            $data = $request->only([
                'student_id',
                'block_id', 
                'date',
                'checkin_time',
                'checkout_time',
                'remarks'
            ]);

            // Determine status based on times
            if ($data['checkin_time'] && $data['checkout_time']) {
                $data['status'] = 'checked_out';
            } elseif ($data['checkin_time']) {
                $data['status'] = 'checked_in';
            } else {
                $data['status'] = 'checked_in'; // Default
            }

            $record = StudentCheckInCheckOut::create($data);
            $record->load(['student.room.block', 'block', 'checkoutRule']);

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in/check-out record created successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create check-in/check-out record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified check-in/check-out record.
     */
    public function show(string $id)
    {
        try {
            $record = StudentCheckInCheckOut::with(['student.room.block', 'block', 'checkoutRule', 'checkoutFinancials'])->find($id);

            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Check-in/check-out record not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch check-in/check-out record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified check-in/check-out record.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'sometimes|exists:students,id',
            'block_id' => 'sometimes|exists:blocks,id',
            'date' => 'sometimes|date',
            'checkin_time' => 'nullable|date',
            'checkout_time' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $record = StudentCheckInCheckOut::find($id);
            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Check-in/check-out record not found'
                ], 404);
            }

            $data = $request->only([
                'student_id',
                'block_id',
                'date',
                'checkin_time',
                'checkout_time',
                'remarks'
            ]);

            // Update status based on times
            if (isset($data['checkin_time']) || isset($data['checkout_time'])) {
                $checkinTime = $data['checkin_time'] ?? $record->checkin_time;
                $checkoutTime = $data['checkout_time'] ?? $record->checkout_time;
                
                if ($checkinTime && $checkoutTime) {
                    $data['status'] = 'checked_out';
                } elseif ($checkinTime) {
                    $data['status'] = 'checked_in';
                }
            }

            $record->update($data);
            $record->load(['student.room.block', 'block', 'checkoutRule']);

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in/check-out record updated successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update check-in/check-out record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified check-in/check-out record.
     */
    public function destroy(string $id)
    {
        try {
            $record = StudentCheckInCheckOut::find($id);
            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Check-in/check-out record not found'
                ], 404);
            }

            $record->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in/check-out record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete check-in/check-out record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Quick check-in
     */
    public function checkIn(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'block_id' => 'required|exists:blocks,id',
            'checkin_time' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $today = Carbon::today()->toDateString();
            $checkinTime = $request->checkin_time ?? Carbon::now();

            $record = StudentCheckInCheckOut::create([
                'student_id' => $request->student_id,
                'block_id' => $request->block_id,
                'date' => $today,
                'checkin_time' => $checkinTime,
                'status' => 'checked_in',
                'remarks' => $request->remarks,
            ]);

            $record->load(['student.room.block', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Student checked in successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check in student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Quick check-out
     */
    public function checkOut(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'checkout_time' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $today = Carbon::today()->toDateString();
            $checkoutTime = $request->checkout_time ?? Carbon::now();

            // Find the latest checked-in record for this student
            $record = StudentCheckInCheckOut::where('student_id', $request->student_id)
                ->whereDate('date', $today)
                ->where('status', 'checked_in')
                ->whereNotNull('checkin_time')
                ->whereNull('checkout_time')
                ->latest()
                ->first();

            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No active check-in found for this student today'
                ], 422);
            }

            $record->update([
                'checkout_time' => $checkoutTime,
                'status' => 'checked_out',
                'remarks' => $request->remarks ?? $record->remarks,
            ]);

            $record->load(['student.room.block', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Student checked out successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check out student: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's attendance
     */
    public function getTodayAttendance(Request $request)
    {
        try {
            $today = Carbon::today()->toDateString();
            $query = StudentCheckInCheckOut::with(['student.room.block', 'block'])
                ->whereDate('date', $today);

            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }

            $records = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'status' => 'success',
                'data' => $records,
                'date' => $today
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch today\'s attendance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve checkout request
     */
    public function approveCheckout(Request $request, string $id)
    {
        try {
            $record = StudentCheckInCheckOut::find($id);
            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Check-in/check-out record not found'
                ], 404);
            }

            // Update record to approved status or set checkout time if not set
            if (!$record->checkout_time) {
                $record->update([
                    'checkout_time' => Carbon::now(),
                    'status' => 'checked_out'
                ]);
            }

            $record->load(['student.room.block', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout request approved successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve checkout request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Decline checkout request
     */
    public function declineCheckout(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $record = StudentCheckInCheckOut::find($id);
            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Check-in/check-out record not found'
                ], 404);
            }

            // Reset checkout time and update remarks
            $record->update([
                'checkout_time' => null,
                'status' => 'checked_in',
                'remarks' => $request->remarks ?? $record->remarks
            ]);

            $record->load(['student.room.block', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout request declined successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to decline checkout request: ' . $e->getMessage()
            ], 500);
        }
    }
}
