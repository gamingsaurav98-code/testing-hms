<?php

namespace App\Http\Controllers;

use App\Models\StaffCheckInCheckOut;
use App\Models\Staff;
use App\Models\Block;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StaffCheckInCheckOutController extends Controller
{
    /**
     * Display a listing of check-in/check-out records.
     */
    public function index(Request $request)
    {
        try {
            $query = StaffCheckInCheckOut::with(['staff', 'block', 'checkoutRule']);

            // Filter by staff
            if ($request->has('staff_id')) {
                $query->where('staff_id', $request->staff_id);
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
            'staff_id' => 'required|exists:staff,id',
            'block_id' => 'required|exists:blocks,id',
            'date' => 'required|date',
            'checkin_time' => 'nullable|date',
            'checkout_time' => 'nullable|date',
            'estimated_checkin_date' => 'nullable|date|after_or_equal:today',
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
            // Check for incomplete records for the same staff and date
            $existingIncomplete = StaffCheckInCheckOut::where('staff_id', $request->staff_id)
                ->whereDate('date', $request->date)
                ->where(function($query) {
                    $query->whereNull('checkout_time')
                          ->orWhereNull('checkin_time');
                })
                ->first();

            if ($existingIncomplete) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Staff has an incomplete check-in/check-out record for this date. Please complete it first.'
                ], 422);
            }

            $data = $request->only([
                'staff_id',
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

            $record = StaffCheckInCheckOut::create($data);
            $record->load(['staff', 'block', 'checkoutRule']);

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
            $record = StaffCheckInCheckOut::with(['staff', 'block', 'checkoutRule', 'checkoutFinancials'])->find($id);

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
            'staff_id' => 'sometimes|exists:staff,id',
            'block_id' => 'sometimes|exists:blocks,id',
            'date' => 'sometimes|date',
            'checkin_time' => 'nullable|date',
            'checkout_time' => 'nullable|date',
            'estimated_checkin_date' => 'nullable|date|after_or_equal:today',
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
            $record = StaffCheckInCheckOut::find($id);
            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Check-in/check-out record not found'
                ], 404);
            }

            $data = $request->only([
                'staff_id',
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
            $record->load(['staff', 'block', 'checkoutRule']);

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
            $record = StaffCheckInCheckOut::find($id);
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
     * Check-in a staff member
     */
    public function checkIn(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user using user_id relationship
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['error' => 'Staff record not found'], 404);
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
            $approvedCheckout = StaffCheckInCheckOut::where('staff_id', $staff->id)
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

                $approvedCheckout->load(['staff', 'block']);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Check-in request submitted. Waiting for admin approval.',
                    'data' => $approvedCheckout
                ], 201);
            }

            // Check if staff is already checked in today without checkout
            $existingRecord = StaffCheckInCheckOut::where('staff_id', $staff->id)
                ->whereDate('date', $today)
                ->whereNotNull('checkin_time')
                ->whereNull('checkout_time')
                ->first();

            if ($existingRecord) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Staff is already checked in today'
                ], 422);
            }

            // Create new check-in record for new day/session
            $data = [
                'staff_id' => $staff->id,
                'block_id' => $request->block_id,
                'date' => $today,
                'checkin_time' => $request->checkin_time ?? Carbon::now(),
                'remarks' => $request->remarks,
                'status' => 'checked_in'
            ];

            $record = StaffCheckInCheckOut::create($data);
            $record->load(['staff', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Staff checked in successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check in staff: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check-out a staff member
     */
    public function checkOut(Request $request)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user using user_id relationship
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();

            if (!$staff) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Staff record not found for authenticated user'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'checkout_time' => 'nullable|date',
                'estimated_checkin_date' => 'nullable|date|after_or_equal:today',
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
            
            // Check if staff already has a pending checkout request for today
            $existingRequest = StaffCheckInCheckOut::where('staff_id', $staff->id)
                ->whereDate('date', $today)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You already have a checkout request for today. Status: ' . ucfirst($existingRequest->status)
                ], 422);
            }

            // Create a new checkout request without requiring prior checkin
            $record = StaffCheckInCheckOut::create([
                'staff_id' => $staff->id,
                'block_id' => 1, // Default block - this could be improved to use staff's assigned block
                'date' => $today,
                'checkout_time' => $request->checkout_time ?? Carbon::now(),
                'estimated_checkin_date' => $request->estimated_checkin_date,
                'remarks' => $request->remarks ?? 'Staff checkout request',
                'status' => 'pending' // Checkout pending approval
            ]);

            $record->load(['staff', 'block', 'checkoutRule']);

            return response()->json([
                'status' => 'success',
                'message' => 'Staff checkout request submitted successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check out staff: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's attendance records
     */
    public function getTodayAttendance(Request $request)
    {
        try {
            $today = Carbon::today()->toDateString();
            $query = StaffCheckInCheckOut::with(['staff', 'block'])
                ->whereDate('date', $today);

            // Filter by block if provided
            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }

            $records = $query->orderBy('checkin_time', 'desc')->get();

            return response()->json([
                'status' => 'success',
                'data' => $records
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
            $record = StaffCheckInCheckOut::find($id);
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

            $record->load(['staff', 'block']);

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
            $record = StaffCheckInCheckOut::find($id);
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

            $record->load(['staff', 'block']);

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

    /**
     * Get the authenticated staff's check-in/checkout records (staff-specific)
     */
    public function getMyRecords()
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['error' => 'Staff record not found'], 404);
            }

            $records = StaffCheckInCheckOut::where('staff_id', $staff->id)
                ->with(['staff', 'block'])
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json([
                'data' => $records
            ]);
        } catch (\Exception $e) {
            \Log::error('getMyRecords error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch your check-in/checkout records',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific check-in/checkout record for the authenticated staff
     */
    public function getMyRecord($id)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['error' => 'Staff record not found'], 404);
            }

            // Find the record and make sure it belongs to the authenticated staff
            $record = StaffCheckInCheckOut::where('id', $id)
                ->where('staff_id', $staff->id)
                ->with(['staff', 'block'])
                ->first();

            if (!$record) {
                return response()->json(['error' => 'Record not found or access denied'], 404);
            }

            return response()->json([
                'data' => $record
            ]);
        } catch (\Exception $e) {
            \Log::error('getMyRecord error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch record',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated staff's today's attendance record (staff-specific)
     */
    public function getMyTodayAttendance()
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Get staff record for the authenticated user using user_id relationship
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['error' => 'Staff record not found'], 404);
            }

            $today = Carbon::today()->toDateString();
            
            $record = StaffCheckInCheckOut::where('staff_id', $staff->id)
                ->whereDate('date', $today)
                ->with(['staff', 'block'])
                ->latest()
                ->first();
                
            return response()->json([
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch your today\'s attendance',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
