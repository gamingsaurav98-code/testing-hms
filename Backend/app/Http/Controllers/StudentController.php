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
        if ($request->has('all') && $request->all === 'true') {
            $students = Student::with('room.block')->where('is_active', true)->get();
            return response()->json($students);
        }
        
        $students = Student::with('room.block')->paginate(15);
        return response()->json($students);
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
            'is_active' => 'boolean',
            'student_image' => 'nullable|image|max:2048', // Max 2MB
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:20',
        ]);
        
        // Handle file upload
        if ($request->hasFile('student_image')) {
            $path = $request->file('student_image')->store('students', 'public');
            $validated['student_image'] = $path;
        }
        
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
            'is_active' => 'boolean',
            'student_image' => 'nullable|image|max:2048', // Max 2MB
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:20',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_contact' => 'nullable|string|max:20',
        ]);
        
        // Handle file upload
        if ($request->hasFile('student_image')) {
            // Delete old image if exists
            if ($student->student_image) {
                Storage::disk('public')->delete($student->student_image);
            }
            
            $path = $request->file('student_image')->store('students', 'public');
            $validated['student_image'] = $path;
        }
        
        $student->update($validated);
        
        return response()->json($student);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);
        
        // Delete student image if exists
        if ($student->student_image) {
            Storage::disk('public')->delete($student->student_image);
        }
        
        $student->delete();
        
        return response()->json(null, 204);
    }
}
