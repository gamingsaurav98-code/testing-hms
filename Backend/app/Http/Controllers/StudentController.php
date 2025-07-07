<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // Apply filters if provided
            $query = Student::query();
            
            // Include room and block data
            $query->with(['room.block', 'financials' => function($query) {
                $query->latest('created_at');
            }]);
            
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
            
            // Get all active students without pagination
            if ($request->has('all') && $request->all === 'true') {
                $students = $query->where('is_active', true)->get();
                
                // Add monthly_fee to each student from their latest financial record
                $students->each(function ($student) {
                    // Get due amount from income records
                    $dueAmount = $student->incomes()
                        ->where('due_amount', '>', 0)
                        ->sum('due_amount');
                    
                    $student->due_amount = $dueAmount > 0 ? $dueAmount : 0;
                    
                    // Add room occupancy data
                    if ($student->room) {
                        $student->room->occupied_beds = $student->room->students()->count();
                        $student->room->vacant_beds = max(0, $student->room->capacity - $student->room->occupied_beds);
                    }
                });
                
                return response()->json($students);
            }
            
            // Regular paginated list
            $perPage = $request->has('per_page') ? (int)$request->per_page : 15;
            $students = $query->paginate($perPage);
            
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
            'room_id' => 'nullable|exists:rooms,id',
            'is_active' => 'nullable',
            'student_id' => 'nullable|string|max:50',
            'is_existing_student' => 'nullable',
            'declaration_agreed' => 'nullable',
            'rules_agreed' => 'nullable',
            'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
            'student_image' => 'nullable|image|max:2048', // Max 2MB
            'student_citizenship_image' => 'nullable|image|max:2048', // Max 2MB
            'registration_form_image' => 'nullable|image|max:2048', // Max 2MB
            'physical_copy_image' => 'nullable|image|max:2048', // Max 2MB
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:20',
            // Additional fields
            'date_of_birth' => 'nullable|date',
            'district' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'ward_no' => 'nullable|string|max:20',
            'street_name' => 'nullable|string|max:100',
            'educational_institution' => 'nullable|string|max:255',
            'class_time' => 'nullable|string|max:50',
            'level_of_study' => 'nullable|string|max:100',
            'monthly_fee' => 'nullable|numeric|min:0',
            'father_name' => 'nullable|string|max:255',
            'father_contact' => 'nullable|string|max:20',
            'mother_name' => 'nullable|string|max:255',
            'mother_contact' => 'nullable|string|max:20',
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
        
        if ($request->hasFile('physical_copy_image')) {
            $path = $request->file('physical_copy_image')->store('students/financial', 'public');
            $validated['physical_copy_image'] = $path;
        }
        
        // Ensure boolean fields are properly set
        $validated['is_active'] = $this->parseBoolean($request->input('is_active', true));
        $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student', false));
        $validated['declaration_agreed'] = $this->parseBoolean($request->input('declaration_agreed', false));
        $validated['rules_agreed'] = $this->parseBoolean($request->input('rules_agreed', false));
        
        $student = Student::create($validated);
        
        return response()->json($student, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $student = Student::with('room.block')->findOrFail($id);
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
            'room_id' => 'nullable|exists:rooms,id',
            'is_active' => 'nullable',
            'student_id' => 'nullable|string|max:50',
            'is_existing_student' => 'nullable',
            'declaration_agreed' => 'nullable',
            'rules_agreed' => 'nullable',
            'food' => 'nullable|string|in:vegetarian,non-vegetarian,egg-only',
            'student_image' => 'nullable|image|max:2048', // Max 2MB
            'student_citizenship_image' => 'nullable|image|max:2048', // Max 2MB 
            'registration_form_image' => 'nullable|image|max:2048', // Max 2MB
            'physical_copy_image' => 'nullable|image|max:2048', // Max 2MB
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:20',
            // Additional fields
            'date_of_birth' => 'nullable|date',
            'district' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'ward_no' => 'nullable|string|max:20',
            'street_name' => 'nullable|string|max:100',
            'educational_institution' => 'nullable|string|max:255',
            'class_time' => 'nullable|string|max:50',
            'level_of_study' => 'nullable|string|max:100',
            'monthly_fee' => 'nullable|numeric|min:0',
            'father_name' => 'nullable|string|max:255',
            'father_contact' => 'nullable|string|max:20',
            'mother_name' => 'nullable|string|max:255',
            'mother_contact' => 'nullable|string|max:20',
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
        
        if ($request->hasFile('physical_copy_image')) {
            // Delete old image if exists
            if ($student->physical_copy_image) {
                Storage::disk('public')->delete($student->physical_copy_image);
            }
            
            $path = $request->file('physical_copy_image')->store('students/financial', 'public');
            $validated['physical_copy_image'] = $path;
        }
        
        // Properly cast boolean values using our parseBoolean method
        $validated['is_active'] = $this->parseBoolean($request->input('is_active', $student->is_active ?? true));
        $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student', $student->is_existing_student ?? false));
        $validated['declaration_agreed'] = $this->parseBoolean($request->input('declaration_agreed', $student->declaration_agreed ?? false));
        $validated['rules_agreed'] = $this->parseBoolean($request->input('rules_agreed', $student->rules_agreed ?? false));
        
        $student->update($validated);
        
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
        
        if ($student->physical_copy_image) {
            Storage::disk('public')->delete($student->physical_copy_image);
        }
        
        $student->delete();
        
        return response()->json(null, 204);
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
}
