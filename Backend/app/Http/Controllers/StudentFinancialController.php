<?php

namespace App\Http\Controllers;

use App\Models\StudentFinancial;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentFinancialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $financials = StudentFinancial::with('student')->paginate(15);
        return response()->json($financials);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Not needed for API
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|string',
            'admission_fee' => 'nullable|string',
            'form_fee' => 'nullable|string',
            'security_deposit' => 'nullable|string',
            'monthly_fee' => 'nullable|string',
            'is_existing_student' => 'nullable',
            'previous_balance' => 'nullable|string',
            'initial_balance_after_registration' => 'nullable|string',
            'balance_type' => 'nullable|string|in:due,advance',
            'payment_date' => 'required|date',
            'joining_date' => 'nullable|date',
            'physical_copy_image' => 'nullable|image|max:5120', // Max 5MB
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'remark' => 'nullable|string',
        ]);
        
        // Handle file upload
        if ($request->hasFile('physical_copy_image')) {
            $path = $request->file('physical_copy_image')->store('financial_documents', 'public');
            $validated['physical_copy_image'] = $path;
        }
        
        // Ensure boolean fields are properly set
        $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student', false));
        
        $financial = StudentFinancial::create($validated);
        
        return response()->json($financial, 201);

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $financial = StudentFinancial::with('student', 'paymentType')->findOrFail($id);
        return response()->json($financial);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Not needed for API
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $financial = StudentFinancial::findOrFail($id);
        
        $validated = $request->validate([
            'amount' => 'string',
            'admission_fee' => 'nullable|string',
            'form_fee' => 'nullable|string',
            'security_deposit' => 'nullable|string',
            'monthly_fee' => 'nullable|string',
            'is_existing_student' => 'nullable',
            'previous_balance' => 'nullable|string',
            'initial_balance_after_registration' => 'nullable|string',
            'balance_type' => 'nullable|string|in:due,advance',
            'payment_date' => 'date',
            'joining_date' => 'nullable|date',
            'physical_copy_image' => 'nullable|image|max:5120', // Max 5MB
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'remark' => 'nullable|string',
        ]);
        
        // Handle file upload
        if ($request->hasFile('physical_copy_image')) {
            // Delete old image if exists
            if ($financial->physical_copy_image) {
                Storage::disk('public')->delete($financial->physical_copy_image);
            }
            
            $path = $request->file('physical_copy_image')->store('financial_documents', 'public');
            $validated['physical_copy_image'] = $path;
        }
        
        // Ensure boolean fields are properly set
        $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student', $financial->is_existing_student ?? false));
        
        $financial->update($validated);
        
        return response()->json($financial);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $financial = StudentFinancial::findOrFail($id);
        
        // Delete image if exists
        if ($financial->physical_copy_image) {
            Storage::disk('public')->delete($financial->physical_copy_image);
        }
        
        $financial->delete();
        
        return response()->json(null, 204);
    }
    
    /**
     * Get financial records for a specific student
     */
    public function getStudentFinancials(string $studentId)
    {
        $student = Student::findOrFail($studentId);
        $financials = StudentFinancial::where('student_id', $studentId)
            ->with('paymentType')
            ->orderBy('payment_date', 'desc')
            ->get();
            
        return response()->json($financials);
    }
    
    /**
     * Helper method to parse boolean values from various input formats
     * Handles strings like "true", "false", "1", "0", and actual boolean values
     * 
     * @param mixed $value The value to parse
     * @param bool $default Default value if parsing fails
     * @return bool The parsed boolean value
     */
    protected function parseBoolean($value, $default = false)
    {
        if (is_bool($value)) {
            return $value;
        }
        
        if (is_string($value)) {
            $value = strtolower($value);
            if (in_array($value, ['true', 'yes', '1', 'on'])) {
                return true;
            }
            if (in_array($value, ['false', 'no', '0', 'off'])) {
                return false;
            }
        } elseif (is_numeric($value)) {
            return (bool)$value;
        }
        
        return $default;
    }
}
