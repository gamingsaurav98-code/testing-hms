<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use App\Models\StaffAmenities;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Apply filters if provided
            $query = Staff::query();
            
            // Include financial and amenities data
            $query->with(['salaries' => function($query) {
                $query->latest('created_at');
            }, 'amenities', 'attachments']);
            
            // Filter by active status
            if ($request->has('active')) {
                $isActive = $request->active === 'true' || $request->active === '1';
                $query->where('is_active', $isActive);
            }
            
            // Filter by department
            if ($request->has('department')) {
                $query->where('department', $request->department);
            }
            
            // Filter by position
            if ($request->has('position')) {
                $query->where('position', $request->position);
            }
            
            // Get all active staff without pagination with optimized loading
            if ($request->has('all') && $request->all === 'true') {
                $staff = $query->where('is_active', true)
                    ->with(['salaries' => function($q) {
                        $q->latest('created_at');
                    }])
                    ->get();
                
                // Add latest salary efficiently
                $staff->each(function ($staffMember) {
                    $latestSalary = $staffMember->salaries->first(); // Already ordered by latest
                    $staffMember->latest_salary = $latestSalary ? $latestSalary->amount : null;
                });

                return response()->json($staff);
            }
            
            // Apply search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('staff_name', 'like', '%' . $search . '%')
                      ->orWhere('staff_id', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%')
                      ->orWhere('contact_number', 'like', '%' . $search . '%')
                      ->orWhere('position', 'like', '%' . $search . '%')
                      ->orWhere('department', 'like', '%' . $search . '%');
                });
            }
            
            // Return paginated results
            $perPage = $request->get('per_page', 15);
            $staff = $query->orderBy('created_at', 'desc')->paginate($perPage);
            
            // Add latest salary to each staff member
            $staff->getCollection()->transform(function ($staffMember) {
                $latestSalary = $staffMember->salaries()
                    ->latest('created_at')
                    ->first();
                
                $staffMember->latest_salary = $latestSalary ? $latestSalary->amount : null;
                
                return $staffMember;
            });

            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch staff',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_name' => 'required|string|max:255',
            'date_of_birth' => 'required|date',
            'contact_number' => 'required|string|max:20',
            'email' => 'required|email|unique:staff,email|max:255',
            'is_active' => 'nullable',
            'staff_id' => 'nullable|string|max:50',
            'position' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'joining_date' => 'nullable|date',
            'salary_amount' => 'nullable|string',
            'employment_type' => 'nullable|string|in:full-time,part-time,contract,intern',
            'declaration_agreed' => 'nullable',
            'contract_agreed' => 'nullable',
            'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
            'staff_image' => 'nullable|image|max:2048',
            'staff_citizenship_image' => 'nullable|image|max:2048',
            'staff_contract_image' => 'nullable|image|max:2048',
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
            'level_of_study' => 'nullable|string|max:100',
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
        if ($request->hasFile('staff_image')) {
            $path = $request->file('staff_image')->store('staff', 'public');
            $validated['staff_image'] = $path;
        }
        
        if ($request->hasFile('staff_citizenship_image')) {
            $path = $request->file('staff_citizenship_image')->store('staff/citizenship', 'public');
            $validated['staff_citizenship_image'] = $path;
        }
        
        if ($request->hasFile('staff_contract_image')) {
            $path = $request->file('staff_contract_image')->store('staff/contracts', 'public');
            $validated['staff_contract_image'] = $path;
        }
        
        // Ensure boolean fields are properly set
        $validated['is_active'] = $this->parseBoolean($request->input('is_active', true));
        $validated['declaration_agreed'] = $this->parseBoolean($request->input('declaration_agreed', false));
        $validated['contract_agreed'] = $this->parseBoolean($request->input('contract_agreed', false));
        
        $staff = Staff::create($validated);
        
        // Handle amenities if provided
        if ($request->has('amenities') && is_array($request->amenities)) {
            foreach ($request->amenities as $amenityData) {
                if (isset($amenityData['name']) && !empty(trim($amenityData['name']))) {
                    $staff->amenities()->create([
                        'name' => trim($amenityData['name']),
                        'description' => isset($amenityData['description']) ? trim($amenityData['description']) : null,
                    ]);
                }
            }
        }
        
        // Load relationships for response
        $staff->load(['amenities', 'attachments']);
        
        return response()->json($staff, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $staff = Staff::with([
                'salaries' => function($query) {
                    $query->orderBy('year', 'desc')->orderBy('month', 'desc');
                },
                'amenities',
                'attachments',
                'financials'
            ])->findOrFail($id);
            
            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Staff not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);
        
        $validated = $request->validate([
            'staff_name' => 'sometimes|required|string|max:255',
            'date_of_birth' => 'sometimes|required|date',
            'contact_number' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|email|max:255|unique:staff,email,' . $id,
            'is_active' => 'nullable',
            'staff_id' => 'nullable|string|max:50',
            'position' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'joining_date' => 'nullable|date',
            'salary_amount' => 'nullable|string',
            'employment_type' => 'nullable|string|in:full-time,part-time,contract,intern',
            'declaration_agreed' => 'nullable',
            'contract_agreed' => 'nullable',
            'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
            'staff_image' => 'nullable|image|max:2048',
            'staff_citizenship_image' => 'nullable|image|max:2048',
            'staff_contract_image' => 'nullable|image|max:2048',
            // Amenities
            'amenities' => 'nullable|array',
            'amenities.*.id' => 'nullable|integer|exists:staff_amenities,id',
            'amenities.*.name' => 'required_with:amenities|string|max:255',
            'amenities.*.description' => 'nullable|string|max:500',
            'removedAmenityIds' => 'nullable|array',
            'removedAmenityIds.*' => 'integer|exists:staff_amenities,id',
            // Document removal tracking
            'removedCitizenshipDocIds' => 'nullable|array',
            'removedCitizenshipDocIds.*' => 'integer',
            'removedContractDocIds' => 'nullable|array', 
            'removedContractDocIds.*' => 'integer',
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
            'level_of_study' => 'nullable|string|max:100',
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
        if ($request->hasFile('staff_image')) {
            // Delete old image if exists
            if ($staff->staff_image) {
                Storage::disk('public')->delete($staff->staff_image);
            }
            $path = $request->file('staff_image')->store('staff', 'public');
            $validated['staff_image'] = $path;
        }
        
        if ($request->hasFile('staff_citizenship_image')) {
            // Delete old image if exists
            if ($staff->staff_citizenship_image) {
                Storage::disk('public')->delete($staff->staff_citizenship_image);
            }
            $path = $request->file('staff_citizenship_image')->store('staff/citizenship', 'public');
            $validated['staff_citizenship_image'] = $path;
        }
        
        if ($request->hasFile('staff_contract_image')) {
            // Delete old image if exists
            if ($staff->staff_contract_image) {
                Storage::disk('public')->delete($staff->staff_contract_image);
            }
            $path = $request->file('staff_contract_image')->store('staff/contracts', 'public');
            $validated['staff_contract_image'] = $path;
        }
        
        // Properly cast boolean values using our parseBoolean method
        if ($request->has('is_active')) {
            $validated['is_active'] = $this->parseBoolean($request->input('is_active'));
        }
        if ($request->has('declaration_agreed')) {
            $validated['declaration_agreed'] = $this->parseBoolean($request->input('declaration_agreed'));
        }
        if ($request->has('contract_agreed')) {
            $validated['contract_agreed'] = $this->parseBoolean($request->input('contract_agreed'));
        }
        
        $staff->update($validated);
        
        // Handle amenities updates if provided
        if ($request->has('amenities') || $request->has('removedAmenityIds')) {
            // First, remove any amenities that were deleted
            if ($request->has('removedAmenityIds') && is_array($request->removedAmenityIds)) {
                $staff->amenities()->whereIn('id', $request->removedAmenityIds)->delete();
            }
            
            // Then handle existing and new amenities
            if ($request->has('amenities') && is_array($request->amenities)) {
                foreach ($request->amenities as $amenityData) {
                    if (isset($amenityData['name']) && !empty(trim($amenityData['name']))) {
                        if (isset($amenityData['id']) && !empty($amenityData['id'])) {
                            // Update existing amenity
                            $staff->amenities()->where('id', $amenityData['id'])->update([
                                'name' => trim($amenityData['name']),
                                'description' => isset($amenityData['description']) ? trim($amenityData['description']) : null,
                            ]);
                        } else {
                            // Create new amenity
                            $staff->amenities()->create([
                                'name' => trim($amenityData['name']),
                                'description' => isset($amenityData['description']) ? trim($amenityData['description']) : null,
                            ]);
                        }
                    }
                }
            }
        }
        
        // Handle document removals if provided
        if ($request->has('removedCitizenshipDocIds') && !$request->hasFile('staff_citizenship_image')) {
            if ($staff->staff_citizenship_image) {
                Storage::disk('public')->delete($staff->staff_citizenship_image);
                $staff->staff_citizenship_image = null;
            }
        }
        
        if ($request->has('removedContractDocIds') && !$request->hasFile('staff_contract_image')) {
            if ($staff->staff_contract_image) {
                Storage::disk('public')->delete($staff->staff_contract_image);
                $staff->staff_contract_image = null;
            }
        }
        
        $staff->save();
        
        // Load relationships for response
        $staff->load(['amenities', 'attachments']);
        
        return response()->json($staff);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $staff = Staff::findOrFail($id);
            
            // Delete associated files
            if ($staff->staff_image) {
                Storage::disk('public')->delete($staff->staff_image);
            }
            if ($staff->staff_citizenship_image) {
                Storage::disk('public')->delete($staff->staff_citizenship_image);
            }
            if ($staff->staff_contract_image) {
                Storage::disk('public')->delete($staff->staff_contract_image);
            }
            
            // Delete amenities
            $staff->amenities()->delete();
            
            // Delete staff
            $staff->delete();
            
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete staff',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get fields metadata for API documentation/frontend
     */
    public function getFields(): JsonResponse
    {
        return response()->json([
            'fields' => [
                // Basic Information
                'staff_name' => ['type' => 'string', 'required' => true, 'max' => 255],
                'date_of_birth' => ['type' => 'date', 'required' => true],
                'contact_number' => ['type' => 'string', 'required' => true, 'max' => 20],
                'email' => ['type' => 'email', 'required' => true, 'max' => 255, 'unique' => true],
                'staff_id' => ['type' => 'string', 'required' => false, 'max' => 50],
                
                // Job Information
                'position' => ['type' => 'string', 'required' => false, 'max' => 100],
                'department' => ['type' => 'string', 'required' => false, 'max' => 100],
                'joining_date' => ['type' => 'date', 'required' => false],
                'salary_amount' => ['type' => 'string', 'required' => false],
                'employment_type' => ['type' => 'enum', 'required' => false, 'options' => ['full-time', 'part-time', 'contract', 'intern']],
                
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
                'level_of_study' => ['type' => 'string', 'required' => false, 'max' => 100],
                
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
                'declaration_agreed' => ['type' => 'boolean', 'required' => false, 'default' => false],
                'contract_agreed' => ['type' => 'boolean', 'required' => false, 'default' => false],
                
                // File Upload Fields
                'staff_image' => ['type' => 'file', 'required' => false, 'max_size' => '2MB', 'types' => ['jpg', 'jpeg', 'png']],
                'staff_citizenship_image' => ['type' => 'file', 'required' => false, 'max_size' => '2MB', 'types' => ['jpg', 'jpeg', 'png']],
                'staff_contract_image' => ['type' => 'file', 'required' => false, 'max_size' => '2MB', 'types' => ['jpg', 'jpeg', 'png']],
                
                // Amenities
                'amenities' => ['type' => 'array', 'required' => false, 'description' => 'Array of amenity objects with name and description'],
                'removedAmenityIds' => ['type' => 'array', 'required' => false, 'description' => 'Array of amenity IDs to remove (update only)'],
            ]
        ]);
    }
    
    /**
     * Get current staff member's profile (for staff portal)
     */
    public function getMyProfile(): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user || $user->role !== 'staff') {
                return response()->json([
                    'error' => 'Unauthorized - Staff access required'
                ], 403);
            }
            
            // Find staff by user_id relationship
            $staff = Staff::where('user_id', $user->id)
                ->with([
                    'salaries' => function($query) {
                        $query->orderBy('year', 'desc')->orderBy('month', 'desc')->limit(12);
                    },
                    'amenities',
                    'attachments'
                ])
                ->first();
            
            if (!$staff) {
                return response()->json([
                    'error' => 'Staff profile not found'
                ], 404);
            }
            
            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch profile',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update current staff member's profile (for staff portal)
     */
    public function updateMyProfile(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            
            if (!$user || $user->role !== 'staff') {
                return response()->json([
                    'error' => 'Unauthorized - Staff access required'
                ], 403);
            }
            
            // Find staff by user_id relationship
            $staff = Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json([
                    'error' => 'Staff profile not found'
                ], 404);
            }
            
            // Staff can only update limited fields for security
            $validated = $request->validate([
                'contact_number' => 'sometimes|required|string|max:20',
                'email' => 'sometimes|required|email|max:255|unique:staff,email,' . $staff->id,
                'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
                'staff_image' => 'nullable|image|max:2048',
                // Address fields staff can update
                'district' => 'nullable|string|max:100',
                'city_name' => 'nullable|string|max:100',
                'ward_no' => 'nullable|string|max:20',
                'street_name' => 'nullable|string|max:100',
                // Health fields staff can update
                'blood_group' => 'nullable|string|max:10',
                'disease' => 'nullable|string|max:255',
                // Family contact info staff can update
                'father_contact' => 'nullable|string|max:20',
                'mother_contact' => 'nullable|string|max:20',
                'spouse_contact' => 'nullable|string|max:20',
                'local_guardian_contact' => 'nullable|string|max:20',
            ]);
            
            // Handle file upload
            if ($request->hasFile('staff_image')) {
                // Delete old image if exists
                if ($staff->staff_image) {
                    Storage::disk('public')->delete($staff->staff_image);
                }
                $path = $request->file('staff_image')->store('staff', 'public');
                $validated['staff_image'] = $path;
            }
            
            $staff->update($validated);
            
            // Load relationships for response
            $staff->load(['amenities', 'attachments']);
            
            return response()->json($staff);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update profile',
                'message' => $e->getMessage()
            ], 500);
        }
    }

        /**
     * Get dashboard statistics for staff (accessible to all authenticated users)
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            // Get detailed room and capacity statistics
            $rooms = \App\Models\Room::with(['students' => function($q) {
                $q->where('is_active', true);
            }])->get();

            $totalRooms = $rooms->count();
            $totalCapacity = $rooms->sum('capacity');
            $occupiedBeds = 0;
            $roomsWithStudents = 0;

            foreach ($rooms as $room) {
                $studentCount = $room->students->count();
                $occupiedBeds += $studentCount;
                if ($studentCount > 0) {
                    $roomsWithStudents++;
                }
            }

            $availableBeds = $totalCapacity - $occupiedBeds;
            $availableRooms = $totalRooms - $roomsWithStudents;

            // Get student statistics
            $totalStudents = \App\Models\Student::where('is_active', true)->count();

            return response()->json([
                'rooms' => [
                    'total' => $totalRooms,
                    'occupied' => $roomsWithStudents,
                    'available' => $availableRooms,
                    'total_capacity' => $totalCapacity,
                    'occupied_beds' => $occupiedBeds,
                    'available_beds' => $availableBeds,
                ],
                'students' => [
                    'total' => $totalStudents,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch dashboard stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse boolean values from string inputs
     */
    private function parseBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            return in_array(strtolower($value), ['true', '1', 'yes', 'on']);
        }
        
        return (bool) $value;
    }
}
