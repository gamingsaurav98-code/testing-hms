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
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'remark' => 'nullable|string',
        ]);
        
        // Ensure boolean fields are properly set
        $validated['is_existing_student'] = $this->parseBoolean($request->input('is_existing_student', false));
        
        $financial = StudentFinancial::create($validated);
        
        return response()->json($financial, 201);
    }

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
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'remark' => 'nullable|string',
        ]);
        
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
    
    /**
     * Get all available fields for student financial creation/editing
     * This helper method provides field metadata for frontend forms
     */
    public function getFields()
    {
        return response()->json([
            'financial_fields' => [
                'student_id' => ['type' => 'foreign_id', 'required' => true, 'table' => 'students'],
                'amount' => ['type' => 'string', 'required' => true, 'note' => 'Total amount'],
                'admission_fee' => ['type' => 'string', 'required' => false, 'note' => 'One-time admission fee'],
                'form_fee' => ['type' => 'string', 'required' => false, 'note' => 'Application form fee'],
                'security_deposit' => ['type' => 'string', 'required' => false, 'note' => 'Refundable security deposit'],
                'monthly_fee' => ['type' => 'string', 'required' => false, 'note' => 'Monthly accommodation fee'],
                'is_existing_student' => ['type' => 'boolean', 'required' => false, 'default' => false],
                'previous_balance' => ['type' => 'string', 'required' => false, 'note' => 'Balance from previous records'],
                'initial_balance_after_registration' => ['type' => 'string', 'required' => false, 'note' => 'Balance after initial payment'],
                'balance_type' => ['type' => 'enum', 'required' => false, 'options' => ['due', 'advance'], 'note' => 'Type of balance'],
                'payment_date' => ['type' => 'date', 'required' => true],
                'joining_date' => ['type' => 'date', 'required' => false, 'note' => 'Date when student joined'],
                'payment_type_id' => ['type' => 'foreign_id', 'required' => false, 'table' => 'payment_types'],
                'remark' => ['type' => 'text', 'required' => false, 'note' => 'Additional notes or comments'],
            ],
            'note' => 'Financial records are separate from student records. Student basic info is handled via /api/students endpoints'
        ]);
    }

    // ========== STUDENT-SPECIFIC METHODS ==========

    /**
     * Get the authenticated student's financial records
     */
    public function getMyFinancials()
    {
        try {
            // use request()->user() here so static analysis recognizes the return type
            /** @var \App\Models\User|null $user */
            $user = request()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $financials = StudentFinancial::where('student_id', $student->id)
                ->with(['student', 'paymentType'])
                ->orderBy('payment_date', 'desc')
                ->get();

            return response()->json([
                'data' => $financials,
                'total' => $financials->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch financial records: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the authenticated student's payment history
     */
    public function getMyPaymentHistory()
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = request()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            // Get income records (fees collected by admin) for this student
            $payments = \App\Models\Income::where('student_id', $student->id)
                ->with(['paymentType', 'incomeType'])
                ->select([
                    'id',
                    'amount',
                    'income_date',
                    'payment_type_id',
                    'income_type_id',
                    'received_amount',
                    'due_amount',
                    'title',
                    'description',
                    'payment_status',
                    'created_at'
                ])
                ->orderBy('income_date', 'desc')
                ->get();

            return response()->json([
                'data' => $payments,
                'total' => $payments->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch payment history: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get the authenticated student's outstanding dues
     */
    public function getMyOutstandingDues()
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = request()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            // Calculate outstanding dues based on generated fees and payments
            $generatedFees = \App\Models\StudentFeeGenerate::where('student_id', $student->id)->sum('amount');
            $totalPayments = StudentFinancial::where('student_id', $student->id)->sum('amount');
            
            // Get any balance due from the student's financial record
            $latestFinancial = StudentFinancial::where('student_id', $student->id)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $balanceDue = 0;
            if ($latestFinancial && $latestFinancial->balance_type === 'due') {
                $balanceDue = floatval($latestFinancial->initial_balance_after_registration ?? 0);
            }
            
            // Calculate outstanding amount
            $outstandingDues = $generatedFees + $balanceDue - $totalPayments;
            
            // Ensure no negative dues
            $outstandingDues = max(0, $outstandingDues);

            return response()->json([
                'outstanding_dues' => $outstandingDues,
                'generated_fees' => $generatedFees,
                'total_payments' => $totalPayments,
                'balance_due' => $balanceDue,
                'calculation_date' => now()->toDateString()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to calculate outstanding dues: ' . $e->getMessage()], 500);
        }
    }
}
