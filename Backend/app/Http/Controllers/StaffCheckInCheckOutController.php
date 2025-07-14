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
                'remarks'
            ]);

            // Determine status based on times
            if ($data['checkin_time'] && $data['checkout_time']) {
                $data['status'] = 'pending'; // Checkout needs approval
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
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
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
            
            // Check if staff is already checked in today
            $existingRecord = StaffCheckInCheckOut::where('staff_id', $request->staff_id)
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

            $data = [
                'staff_id' => $request->staff_id,
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
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
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
            
            // Find the check-in record for today
            $record = StaffCheckInCheckOut::where('staff_id', $request->staff_id)
                ->whereDate('date', $today)
                ->whereNotNull('checkin_time')
                ->whereNull('checkout_time')
                ->first();

            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No active check-in record found for this staff member today'
                ], 422);
            }

            $record->update([
                'checkout_time' => $request->checkout_time ?? Carbon::now(),
                'remarks' => $request->remarks ?? $record->remarks,
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
     * Approve a checkout request
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

            if ($record->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This checkout request is not pending approval'
                ], 422);
            }

            $record->update(['status' => 'checked_out']);
            $record->load(['staff', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout approved successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve checkout: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Decline a checkout request
     */
    public function declineCheckout(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string',
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

            if ($record->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This checkout request is not pending approval'
                ], 422);
            }

            $record->update([
                'status' => 'checked_in',
                'checkout_time' => null,
                'remarks' => $record->remarks . ' [Checkout declined: ' . $request->reason . ']'
            ]);
            
            $record->load(['staff', 'block']);

            return response()->json([
                'status' => 'success',
                'message' => 'Checkout declined successfully',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to decline checkout: ' . $e->getMessage()
            ], 500);
        }
    }
}
