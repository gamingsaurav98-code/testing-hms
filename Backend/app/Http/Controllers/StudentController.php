<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentAmenities;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $cacheKeyBase = 'students_index_v1';
        $force = $request->query('force_refresh') ? true : false;
        // Construct a normalized cache key from query params that affect results
        $keyParts = [$cacheKeyBase];
        foreach (['all','paginate','per_page','page','active','room_id','block_id'] as $p) {
            if ($request->has($p)) $keyParts[] = "$p=" . (string)$request->input($p);
        }
        $cacheKey = implode(':', $keyParts);
        $ttlSeconds = 10; // short-lived cache for list endpoints

        if (! $force) {
            $cached = Cache::get($cacheKey);
            if ($cached !== null) {
                return response()->json($cached);
            }
        }

        // Attempt to obtain lock to avoid stampede (only if cache supports locking)
        $lockKey = $cacheKey . ':lock';
        $lock = null;
        $lockAcquired = false;
        try {
            try {
                $lock = Cache::lock($lockKey, 10);
                $lockAcquired = $lock->get();
            } catch (\Throwable $_) {
                $lockAcquired = false;
            }
            if (! $lockAcquired) {
                $waited = 0;
                while ($waited < 2000) {
                    $candidate = Cache::get($cacheKey);
                    if ($candidate !== null) return response()->json($candidate);
                    usleep(100 * 1000);
                    $waited += 100;
                }
            }
        } catch (\Throwable $_) {
            // ignore lock errors - continue without locking
        }
        try {
            // Apply filters if provided
            $query = Student::select([
                'id',
                'student_name',
                'email',
                'contact_number',
                'created_at',
                'is_active',
                'room_id',
                'student_image',
                'student_id'
            ])->with([
                'room:id,room_name,block_id,capacity',
                'room.block:id,block_name'
            ]);
            
            // Filter by active status
            if ($request->has('active')) {
                $isActive = $request->active === 'true' || $request->active === '1';
                $query->where('is_active', $isActive);
            }
            
            // Filter by room ID
            if ($request->has('room_id')) {
                $query->where('room_id', $request->room_id);
            }
            
            // Filter by block ID (via room relationship)
            if ($request->has('block_id')) {
                $query->whereHas('room', function($q) use ($request) {
                    $q->where('block_id', $request->block_id);
                });
            }
            
            // Support both ?all=true and ?paginate=false (used by frontend) to return full list without pagination
            if (($request->has('all') && $request->input('all') === 'true') || ($request->has('paginate') && $request->input('paginate') === 'false')) {
                $students = $query->where('is_active', true)->get();
                
                // Add calculated fields efficiently
                $students->each(function ($student) {
                    // Calculate due amount from financials
                    // This is a simplified calculation - adjust based on your business logic
                    $dueAmount = 0;
                    if ($student->financials && $student->financials->count() > 0) {
                        $latestFinancial = $student->financials->first();
                        if ($latestFinancial->balance_type === 'due') {
                            $dueAmount = floatval($latestFinancial->initial_balance_after_registration ?? 0);
                        }
                    }
                    $student->due_amount = $dueAmount > 0 ? $dueAmount : 0;
                });
                
                // Load room occupancy data efficiently for all rooms at once
                $roomIds = $students->pluck('room_id')->filter()->unique();
                if ($roomIds->count() > 0) {
                    $roomOccupancy = DB::table('students')
                        ->select('room_id', DB::raw('count(*) as occupied_count'))
                        ->whereIn('room_id', $roomIds)
                        ->where('is_active', true)
                        ->groupBy('room_id')
                        ->pluck('occupied_count', 'room_id');
                    
                    $students->each(function ($student) use ($roomOccupancy) {
                        if ($student->room) {
                            $occupiedBeds = $roomOccupancy[$student->room_id] ?? 0;
                            $student->room->occupied_beds = $occupiedBeds;
                            $student->room->vacant_beds = max(0, $student->room->capacity - $occupiedBeds);
                        }
                    });
                }

                try { Cache::put($cacheKey, $students, $ttlSeconds); } catch (\Throwable $_) {}
                try { if (! empty($lock) && $lockAcquired) $lock->release(); } catch (\Throwable $_) {}
                return response()->json($students);
            }
            
            // Regular paginated list
            $perPage = $request->has('per_page') ? (int)$request->input('per_page') : 15;
            $students = $query->paginate($perPage);
            
            try { Cache::put($cacheKey, $students, $ttlSeconds); } catch (\Throwable $_) {}
            try { if (! empty($lock) && $lockAcquired) $lock->release(); } catch (\Throwable $_) {}
            return response()->json($students);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch students: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_name' => 'required|string|max:255',
            'email' => 'required|email|unique:students,email',
            'contact_number' => 'required|string|max:20',
            'date_of_birth' => 'required|date',
            'room_id' => 'required|exists:rooms,id',
            'is_active' => 'nullable',
            'student_id' => 'nullable|string|max:50',
            'is_existing_student' => 'nullable',
            'declaration_agreed' => 'nullable',
            'rules_agreed' => 'nullable',
            'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
            'student_image' => 'nullable|image|max:2048',
            'student_citizenship_image' => 'nullable|image|max:2048',
            'registration_form_image' => 'nullable|image|max:2048',
            // Amenities
            'amenities' => 'nullable|array',
            'amenities.*.name' => 'required_with:amenities|string|max:255',
            'amenities.*.description' => 'nullable|string|max:500',
            // Address fields
            'district' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'ward_no' => 'nullable|string|max:20',
            'street_name' => 'nullable|string|max:100',
            // Citizenship fields
            'citizenship_no' => 'nullable|string|max:50',
            'date_of_issue' => 'nullable|date',
            'citizenship_issued_district' => 'nullable|string|max:100',
            // Education fields
            'educational_institution' => 'nullable|string|max:255',
            'class_time' => 'nullable|string|max:50',
            'level_of_study' => 'nullable|string|max:100',
            'expected_stay_duration' => 'nullable|string|max:100',
            // Health fields
            'blood_group' => 'nullable|string|max:10',
            'disease' => 'nullable|string|max:255',
            // Family information
            'father_name' => 'nullable|string|max:255',
            'father_contact' => 'nullable|string|max:20',
            'father_occupation' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_contact' => 'nullable|string|max:20',
            'mother_occupation' => 'nullable|string|max:255',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_contact' => 'nullable|string|max:20',
            'spouse_occupation' => 'nullable|string|max:255',
            // Local guardian information
            'local_guardian_name' => 'nullable|string|max:255',
            'local_guardian_address' => 'nullable|string|max:500',
            'local_guardian_contact' => 'nullable|string|max:20',
            'local_guardian_occupation' => 'nullable|string|max:255',
            'local_guardian_relation' => 'nullable|string|max:100',
            // Verification fields
            'verified_by' => 'nullable|string|max:255',
            'verified_on' => 'nullable|date',
        ]);
        
        // Handle file uploads
        if ($request->hasFile('student_image')) {
            $path = $request->file('student_image')->store('students', 'public');
            $validated['student_image'] = $path;
        }
        
        if ($request->hasFile('student_citizenship_image')) {
            $path = $request->file('student_citizenship_image')->store('students/citizenship', 'public');
            $validated['student_citizenship_image'] = $path;
        }
        
        if ($request->hasFile('registration_form_image')) {
            $path = $request->file('registration_form_image')->store('students/forms', 'public');
            $validated['registration_form_image'] = $path;
        }
        
        // Ensure boolean fields are properly set
        $validated['is_active'] = $this->parseBoolean($request->input('is_active', true));
        $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student', false));
        $validated['declaration_agreed'] = $this->parseBoolean($request->input('declaration_agreed', false));
        $validated['rules_agreed'] = $this->parseBoolean($request->input('rules_agreed', false));
        
        $student = Student::create($validated);
        
        // Handle amenities if provided
        if ($request->has('amenities') && is_array($request->amenities)) {
            foreach ($request->amenities as $amenityData) {
                if (isset($amenityData['name']) && !empty(trim($amenityData['name']))) {
                    $student->amenities()->create([
                        'name' => trim($amenityData['name']),
                        'description' => isset($amenityData['description']) ? trim($amenityData['description']) : null,
                    ]);
                }
            }
        }
        
        // Load relationships for response
        $student->load(['room.block', 'amenities']);
        
        return response()->json($student, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $student = Student::with([
            'room.block', 
            'financials.paymentType', 
            'amenities',
            'attachments'
        ])->findOrFail($id);
        return response()->json($student);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        
        $validated = $request->validate([
            'student_name' => 'string|max:255',
            'email' => 'email|unique:students,email,' . $id,
            'contact_number' => 'string|max:20',
            'date_of_birth' => 'date',
            'room_id' => 'nullable|exists:rooms,id',
            'is_active' => 'nullable',
            'student_id' => 'nullable|string|max:50',
            'is_existing_student' => 'nullable',
            'declaration_agreed' => 'nullable',
            'rules_agreed' => 'nullable',
            'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
            'student_image' => 'nullable|image|max:2048',
            'student_citizenship_image' => 'nullable|image|max:2048',
            'registration_form_image' => 'nullable|image|max:2048',
            // Amenities
            'amenities' => 'nullable|array',
            'amenities.*.id' => 'nullable|integer|exists:student_amenities,id',
            'amenities.*.name' => 'required_with:amenities|string|max:255',
            'amenities.*.description' => 'nullable|string|max:500',
            'removedAmenityIds' => 'nullable|array',
            'removedAmenityIds.*' => 'integer|exists:student_amenities,id',
            // Document removal tracking
            'removedCitizenshipDocIds' => 'nullable|array',
            'removedCitizenshipDocIds.*' => 'integer',
            'removedRegistrationDocIds' => 'nullable|array', 
            'removedRegistrationDocIds.*' => 'integer',
            // Address fields
            'district' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'ward_no' => 'nullable|string|max:20',
            'street_name' => 'nullable|string|max:100',
            // Citizenship fields
            'citizenship_no' => 'nullable|string|max:50',
            'date_of_issue' => 'nullable|date',
            'citizenship_issued_district' => 'nullable|string|max:100',
            // Education fields
            'educational_institution' => 'nullable|string|max:255',
            'class_time' => 'nullable|string|max:50',
            'level_of_study' => 'nullable|string|max:100',
            'expected_stay_duration' => 'nullable|string|max:100',
            // Health fields
            'blood_group' => 'nullable|string|max:10',
            'disease' => 'nullable|string|max:255',
            // Family information
            'father_name' => 'nullable|string|max:255',
            'father_contact' => 'nullable|string|max:20',
            'father_occupation' => 'nullable|string|max:255',
            'mother_name' => 'nullable|string|max:255',
            'mother_contact' => 'nullable|string|max:20',
            'mother_occupation' => 'nullable|string|max:255',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_contact' => 'nullable|string|max:20',
            'spouse_occupation' => 'nullable|string|max:255',
            // Local guardian information
            'local_guardian_name' => 'nullable|string|max:255',
            'local_guardian_address' => 'nullable|string|max:500',
            'local_guardian_contact' => 'nullable|string|max:20',
            'local_guardian_occupation' => 'nullable|string|max:255',
            'local_guardian_relation' => 'nullable|string|max:100',
            // Verification fields
            'verified_by' => 'nullable|string|max:255',
            'verified_on' => 'nullable|date',
            // Financial fields (accepted but ignored - handled by StudentFinancialController)
            'monthly_fee' => 'nullable|string',
        ]);
        
        // Handle file uploads
        if ($request->hasFile('student_image')) {
            // Delete old image if exists
            if ($student->student_image) {
                Storage::disk('public')->delete($student->student_image);
            }
            
            $path = $request->file('student_image')->store('students', 'public');
            $validated['student_image'] = $path;
        }
        
        if ($request->hasFile('student_citizenship_image')) {
            // Delete old image if exists
            if ($student->student_citizenship_image) {
                Storage::disk('public')->delete($student->student_citizenship_image);
            }
            
            $path = $request->file('student_citizenship_image')->store('students/citizenship', 'public');
            $validated['student_citizenship_image'] = $path;
        }
        
        if ($request->hasFile('registration_form_image')) {
            // Delete old image if exists
            if ($student->registration_form_image) {
                Storage::disk('public')->delete($student->registration_form_image);
            }
            
            $path = $request->file('registration_form_image')->store('students/forms', 'public');
            $validated['registration_form_image'] = $path;
        }
        
        // Properly cast boolean values using our parseBoolean method
        if ($request->has('is_active')) {
            $validated['is_active'] = $this->parseBoolean($request->input('is_active'));
        }
        if ($request->has('is_existing_student')) {
            $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student'));
        }
        if ($request->has('declaration_agreed')) {
            $validated['declaration_agreed'] = $this->parseBoolean($request->input('declaration_agreed'));
        }
        if ($request->has('rules_agreed')) {
            $validated['rules_agreed'] = $this->parseBoolean($request->input('rules_agreed'));
        }
        
        $student->update($validated);
        
        // Handle amenities updates if provided
        if ($request->has('amenities') || $request->has('removedAmenityIds')) {
            // First, remove any amenities that were deleted
            if ($request->has('removedAmenityIds') && is_array($request->removedAmenityIds)) {
                $student->amenities()->whereIn('id', $request->removedAmenityIds)->delete();
            }
            
            // Then handle existing and new amenities
            if ($request->has('amenities') && is_array($request->amenities)) {
                foreach ($request->amenities as $amenityData) {
                    if (isset($amenityData['name']) && !empty(trim($amenityData['name']))) {
                        if (isset($amenityData['id']) && !empty($amenityData['id'])) {
                            // Update existing amenity
                            $student->amenities()->where('id', $amenityData['id'])->update([
                                'name' => trim($amenityData['name']),
                                'description' => isset($amenityData['description']) ? trim($amenityData['description']) : null,
                            ]);
                        } else {
                            // Create new amenity
                            $student->amenities()->create([
                                'name' => trim($amenityData['name']),
                                'description' => isset($amenityData['description']) ? trim($amenityData['description']) : null,
                            ]);
                        }
                    }
                }
            }
        }
        
        // Handle document removals if provided
        // Note: Since we store documents as single files on the student model,
        // any "removal" means we should clear the field when new files aren't uploaded
        if ($request->has('removedCitizenshipDocIds') && !$request->hasFile('student_citizenship_image')) {
            // If citizenship docs are marked for removal and no new file uploaded, clear the field
            if ($student->student_citizenship_image) {
                Storage::disk('public')->delete($student->student_citizenship_image);
                $student->student_citizenship_image = null;
            }
        }
        
        if ($request->has('removedRegistrationDocIds') && !$request->hasFile('registration_form_image')) {
            // If registration docs are marked for removal and no new file uploaded, clear the field
            if ($student->registration_form_image) {
                Storage::disk('public')->delete($student->registration_form_image);
                $student->registration_form_image = null;
            }
        }
        
        // Note: Physical copy images are handled by StudentFinancialController, not here
        // The frontend should send those to the financial endpoints instead
        
        // Save any document field changes
        if ($request->has('removedCitizenshipDocIds') || $request->has('removedRegistrationDocIds')) {
            $student->save();
        }
        
        // Load relationships for response
        $student->load(['room.block', 'amenities']);
        
        return response()->json($student);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);
        
        // Delete all student images if they exist
        if ($student->student_image) {
            Storage::disk('public')->delete($student->student_image);
        }
        
        if ($student->student_citizenship_image) {
            Storage::disk('public')->delete($student->student_citizenship_image);
        }
        
        if ($student->registration_form_image) {
            Storage::disk('public')->delete($student->registration_form_image);
        }
        
        $student->delete();
        
        return response()->json(null, 204);
    }

    /**
     * Toggle student active status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $student = Student::findOrFail($id);
            
            // Store the old room_id before toggling
            $oldRoomId = $student->room_id;
            
            // Toggle the is_active status
            $student->is_active = !$student->is_active;
            
            // If student is being deactivated, remove room assignment
            if (!$student->is_active && $oldRoomId) {
                $student->room_id = null;
                
                // Log the room change for reference
                Log::info("Student {$student->id} deactivated - Room {$oldRoomId} assignment removed");
            }
            
            $student->save();
            
            return response()->json([
                'message' => 'Student status updated successfully',
                'student' => $student->load(['amenities', 'financials', 'room']),
                'is_active' => $student->is_active,
                'room_removed' => !$student->is_active && $oldRoomId ? true : false
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to toggle student status',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper method to parse boolean values from various input formats
     * 
     * @param mixed $value
     * @param bool $default
     * @return bool
     */
    protected function parseBoolean($value, $default = false)
    {
        if (is_null($value)) {
            return $default;
        }
        
        if (is_bool($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $value = strtolower($value);
            if (in_array($value, ['true', '1', 'yes', 'on', 'y'])) {
                return true;
            }
            if (in_array($value, ['false', '0', 'no', 'off', 'n'])) {
                return false;
            }
        }
        
        if (is_numeric($value)) {
            return (bool) $value;
        }
        
        return $default;
    }
    
    /**
     * Get all available fields for student creation/editing
     * This helper method provides field metadata for frontend forms
     * Financial fields are handled separately via StudentFinancialController
     */
    public function getFields()
    {
        return response()->json([
            'student_fields' => [
                // Basic Information
                'student_name' => ['type' => 'string', 'required' => true, 'max' => 255],
                'email' => ['type' => 'email', 'required' => true, 'unique' => true],
                'contact_number' => ['type' => 'string', 'required' => true, 'max' => 20],
                'date_of_birth' => ['type' => 'date', 'required' => true],
                'room_id' => ['type' => 'foreign_id', 'required' => true, 'table' => 'rooms'],
                'student_id' => ['type' => 'string', 'required' => false, 'max' => 50],
                
                // Address Information
                'district' => ['type' => 'string', 'required' => false, 'max' => 100],
                'city_name' => ['type' => 'string', 'required' => false, 'max' => 100],
                'ward_no' => ['type' => 'string', 'required' => false, 'max' => 20],
                'street_name' => ['type' => 'string', 'required' => false, 'max' => 100],
                
                // Citizenship Information
                'citizenship_no' => ['type' => 'string', 'required' => false, 'max' => 50],
                'date_of_issue' => ['type' => 'date', 'required' => false],
                'citizenship_issued_district' => ['type' => 'string', 'required' => false, 'max' => 100],
                
                // Education Information
                'educational_institution' => ['type' => 'string', 'required' => false, 'max' => 255],
                'class_time' => ['type' => 'string', 'required' => false, 'max' => 50],
                'level_of_study' => ['type' => 'string', 'required' => false, 'max' => 100],
                'expected_stay_duration' => ['type' => 'string', 'required' => false, 'max' => 100],
                
                // Health Information
                'blood_group' => ['type' => 'string', 'required' => false, 'max' => 10],
                'food' => ['type' => 'enum', 'required' => false, 'options' => ['vegetarian', 'non-vegetarian', 'egg-only']],
                'disease' => ['type' => 'string', 'required' => false, 'max' => 255],
                
                // Family Information
                'father_name' => ['type' => 'string', 'required' => false, 'max' => 255],
                'father_contact' => ['type' => 'string', 'required' => false, 'max' => 20],
                'father_occupation' => ['type' => 'string', 'required' => false, 'max' => 255],
                'mother_name' => ['type' => 'string', 'required' => false, 'max' => 255],
                'mother_contact' => ['type' => 'string', 'required' => false, 'max' => 20],
                'mother_occupation' => ['type' => 'string', 'required' => false, 'max' => 255],
                'spouse_name' => ['type' => 'string', 'required' => false, 'max' => 255],
                'spouse_contact' => ['type' => 'string', 'required' => false, 'max' => 20],
                'spouse_occupation' => ['type' => 'string', 'required' => false, 'max' => 255],
                
                // Guardian Information
                'local_guardian_name' => ['type' => 'string', 'required' => false, 'max' => 255],
                'local_guardian_address' => ['type' => 'string', 'required' => false, 'max' => 500],
                'local_guardian_contact' => ['type' => 'string', 'required' => false, 'max' => 20],
                'local_guardian_occupation' => ['type' => 'string', 'required' => false, 'max' => 255],
                'local_guardian_relation' => ['type' => 'string', 'required' => false, 'max' => 100],
                
                // Verification Information
                'verified_by' => ['type' => 'string', 'required' => false, 'max' => 255],
                'verified_on' => ['type' => 'date', 'required' => false],
                
                // Status Fields
                'is_active' => ['type' => 'boolean', 'required' => false, 'default' => true],
                'is_existing_student' => ['type' => 'boolean', 'required' => false, 'default' => false],
                'declaration_agreed' => ['type' => 'boolean', 'required' => false, 'default' => false],
                'rules_agreed' => ['type' => 'boolean', 'required' => false, 'default' => false],
                
                // File Upload Fields
                'student_image' => ['type' => 'file', 'required' => false, 'max_size' => '2MB', 'types' => ['jpg', 'jpeg', 'png']],
                'student_citizenship_image' => ['type' => 'file', 'required' => false, 'max_size' => '2MB', 'types' => ['jpg', 'jpeg', 'png']],
                'registration_form_image' => ['type' => 'file', 'required' => false, 'max_size' => '2MB', 'types' => ['jpg', 'jpeg', 'png']],
                
                // Amenities Fields
                'amenities' => ['type' => 'array', 'required' => false, 'description' => 'Array of amenity objects'],
                'amenities.*.name' => ['type' => 'string', 'required' => true, 'max' => 255, 'description' => 'Amenity name'],
                'amenities.*.description' => ['type' => 'string', 'required' => false, 'max' => 500, 'description' => 'Amenity description'],
                'removedAmenityIds' => ['type' => 'array', 'required' => false, 'description' => 'Array of amenity IDs to remove (update only)'],
            ],
            'note' => 'Financial fields are handled separately via /api/student-financials endpoints'
        ]);
    }

    // ========== STUDENT-SPECIFIC METHODS ==========

    /**
     * Get the authenticated student's profile
     */
    public function getMyProfile()
    {
        try {
            $user = \Illuminate\Support\Facades\Auth::user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $student->load(['room.block', 'financials' => function($query) {
                $query->latest('created_at');
            }]);

            return response()->json($student);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch profile: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update the authenticated student's profile
     */
    public function updateMyProfile(Request $request)
    {
        try {
            $user = \Illuminate\Support\Facades\Auth::user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            // Validate only updatable fields
            $request->validate([
                'contact_number' => 'sometimes|required|string|max:20',
                'email' => 'sometimes|required|string|email|max:255',
                'district' => 'sometimes|nullable|string|max:255',
                'city_name' => 'sometimes|nullable|string|max:255',
                'ward_no' => 'sometimes|nullable|string|max:10',
                'street_name' => 'sometimes|nullable|string|max:255',
                'educational_institution' => 'sometimes|nullable|string|max:255',
                'class_time' => 'sometimes|nullable|string|max:50',
                'level_of_study' => 'sometimes|nullable|string|max:100',
                'expected_stay_duration' => 'sometimes|nullable|string|max:100',
                'blood_group' => 'sometimes|nullable|string|max:10',
                'food' => 'sometimes|nullable|string|in:vegetarian,non-vegetarian,egg-only',
                'disease' => 'sometimes|nullable|string|max:255',
                'local_guardian_name' => 'sometimes|nullable|string|max:255',
                'local_guardian_address' => 'sometimes|nullable|string|max:500',
                'local_guardian_contact' => 'sometimes|nullable|string|max:20',
                'local_guardian_occupation' => 'sometimes|nullable|string|max:255',
                'local_guardian_relation' => 'sometimes|nullable|string|max:100',
                'student_image' => 'sometimes|nullable|file|mimes:jpg,jpeg,png|max:2048',
            ]);

            $updateData = $request->except(['student_image']);

            // Handle file upload if present
            if ($request->hasFile('student_image')) {
                // Delete old image if exists
                if ($student->student_image) {
                    Storage::disk('public')->delete($student->student_image);
                }
                
                $updateData['student_image'] = $request->file('student_image')->store('students', 'public');
            }

            // If email is being updated, also update it in the users table
            if (isset($updateData['email'])) {
                $user->email = $updateData['email'];
                /** @var \App\Models\User $user */
                $user->save();
            }

            $student->update($updateData);
            $student->load(['room.block', 'financials']);

            return response()->json($student);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update profile: ' . $e->getMessage()], 500);
        }
    }
}
