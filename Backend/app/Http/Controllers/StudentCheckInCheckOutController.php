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
            'estimated_checkin_date' => 'nullable|date',
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
                'estimated_checkin_date',
                'remarks'
            ]);

            // Determine status based on times
            // When admin creates record with checkout, auto-approve it
            if ($data['checkin_time'] && $data['checkout_time']) {
                $data['status'] = 'approved'; // Auto-approved by admin
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
            'estimated_checkin_date' => 'nullable|date',
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
                'estimated_checkin_date',
                'remarks'
            ]);

            // Update status based on times
            if (isset($data['checkin_time']) || isset($data['checkout_time'])) {
                $checkinTime = $data['checkin_time'] ?? $record->checkin_time;
                $checkoutTime = $data['checkout_time'] ?? $record->checkout_time;
                
                if ($checkinTime && $checkoutTime) {
                    $data['status'] = 'pending'; // Checkout needs approval
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
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get student record for the authenticated user
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['error' => 'Student record not found'], 404);
            }

            $validator = Validator::make($request->all(), [
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

            $today = Carbon::today()->toDateString();
            
            // Check for approved checkout record that hasn't been checked in yet
            $approvedCheckout = StudentCheckInCheckOut::where('student_id', $student->id)
                ->where('status', 'approved')
                ->whereNotNull('checkout_time')
                ->whereNull('checkin_time')
                ->orderBy('created_at', 'desc')
                ->first();

            if ($approvedCheckout) {
                // Update the existing approved checkout record with checkin time
                // Set status to 'pending' so admin can approve the check-in
                $approvedCheckout->update([
                    'checkin_time' => $request->checkin_time ?? Carbon::now(),
                    'block_id' => $request->block_id, // Update block if different
                    'remarks' => $request->remarks ? $approvedCheckout->remarks . '. Check-in: ' . $request->remarks : $approvedCheckout->remarks,
                    'status' => 'pending' // Requires admin approval for check-in
                ]);

                $approvedCheckout->load(['student.room.block', 'block']);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Check-in request submitted. Waiting for admin approval.',
                    'data' => $approvedCheckout
                ], 201);
            }

            // Check if student is already checked in today without checkout
            $existingRecord = StudentCheckInCheckOut::where('student_id', $student->id)
                ->whereDate('date', $today)
                ->whereNotNull('checkin_time')
                ->whereNull('checkout_time')
                ->first();

            if ($existingRecord) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student is already checked in today'
                ], 422);
            }

            // Create new check-in record for new day/session (fallback case)
            $checkinTime = $request->checkin_time ?? Carbon::now();

            $record = StudentCheckInCheckOut::create([
                'student_id' => $student->id,
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
            'checkout_time' => 'nullable|date',
            'estimated_checkin_date' => 'nullable|date',
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
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get student record for the authenticated user
            $student = \App\Models\Student::with('room.block')->where('user_id', $user->id)->first();

            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student record not found for authenticated user'
                ], 404);
            }

            $today = Carbon::today()->toDateString();
            
            // Check if student already has a pending checkout request for today
            $existingRequest = StudentCheckInCheckOut::where('student_id', $student->id)
                ->whereDate('date', $today)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You already have a checkout request for today. Status: ' . ucfirst($existingRequest->status)
                ], 422);
            }

            // Create a new checkout request
            $record = StudentCheckInCheckOut::create([
                'student_id' => $student->id,
                'block_id' => $student->room->block_id ?? 1, // Use student's block or default to 1
                'date' => $today,
                'checkout_time' => $request->checkout_time ?? Carbon::now(),
                'estimated_checkin_date' => $request->estimated_checkin_date,
                'remarks' => $request->remarks ?? 'Student checkout request',
                'status' => 'pending'
            ]);

            $record->load(['student.room.block', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout request submitted successfully',
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

            // Update record to approved status
            $record->update([
                'status' => 'approved'
            ]);

            // If checkout time is not set, set it now
            if (!$record->checkout_time) {
                $record->update([
                    'checkout_time' => Carbon::now()
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

            // Update status to declined and optionally update remarks
            $record->update([
                'status' => 'declined',
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

    // ========== STUDENT-SPECIFIC METHODS ==========

    /**
     * Get the authenticated student's check-in/out records
     */
    public function getMyRecords()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $records = StudentCheckInCheckOut::where('student_id', $student->id)
                ->with(['student.room.block', 'block', 'checkoutRule'])
                ->orderByRaw('GREATEST(COALESCE(checkout_time, "1970-01-01"), COALESCE(checkin_time, "1970-01-01"), created_at) DESC')
                ->get();

            return response()->json([
                'data' => $records,
                'total' => $records->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch your records: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the authenticated student's today's attendance
     */
    public function getMyTodayAttendance()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $today = now()->format('Y-m-d');
            $record = StudentCheckInCheckOut::where('student_id', $student->id)
                ->whereDate('date', $today)
                ->with(['student.room.block', 'block'])
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => $record,
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
     * Get a specific record for the authenticated student
     */
    public function getMyRecord($id)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get student record for the authenticated user
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['error' => 'Student record not found'], 404);
            }

            // Find the record and make sure it belongs to the authenticated student
            $record = StudentCheckInCheckOut::where('id', $id)
                ->where('student_id', $student->id)
                ->with(['student.room.block', 'block', 'checkoutRule', 'checkoutFinancials'])
                ->first();

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
            \Log::error('getMyRecord error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch check-in/check-out record'
            ], 500);
        }
    }
}
