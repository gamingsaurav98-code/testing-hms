<?php

namespace App\Http\Controllers;

use App\Models\Income;
use App\Services\DateService;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class IncomeController extends Controller
{
    protected $dateService;
    protected $imageService;
    
    /**
     * Create a new controller instance.
     */
    public function __construct(DateService $dateService, ImageService $imageService)
    {
        $this->dateService = $dateService;
        $this->imageService = $imageService;
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = Income::with(['student', 'incomeType', 'paymentType'])
                ->orderBy('income_date', 'desc');
                
            // Filter by date range if provided
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->dateRange($request->start_date, $request->end_date);
            }
            
            // Filter by income type if provided
            if ($request->has('income_type_id')) {
                $query->byType($request->income_type_id);
            }
            
            // Filter by student if provided
            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }
            
            // Paginate results
            $incomes = $query->paginate($request->per_page ?? 15);
            
            return response()->json($incomes, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching incomes: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching incomes', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // API doesn't need this method
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|exists:students,id',
                'income_type_id' => 'nullable|exists:income_types,id',
                'payment_type_id' => 'required|exists:payment_types,id',
                'amount' => 'required|numeric|min:0.01',
                'received_amount' => 'nullable|numeric|min:0',
                'income_date' => 'required|date',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'income_attachment' => 'nullable|file|mimes:jpeg,jpg,png,gif,pdf|max:5120',
            ]);
            
            if ($validator->fails()) {
                return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }
            
            DB::beginTransaction();
            
            // Format the income date using our DateService
            $formattedDate = $this->dateService->formatDate($request->income_date, 'Y-m-d');
            
            // Calculate due amount
            $amount = $request->amount;
            $receivedAmount = $request->received_amount ?? 0;
            $dueAmount = max(0, $amount - $receivedAmount);
            
            // Create income record
            $income = Income::create([
                'student_id' => $request->student_id,
                'income_type_id' => $request->income_type_id,
                'payment_type_id' => $request->payment_type_id,
                'amount' => $amount,
                'received_amount' => $receivedAmount,
                'due_amount' => $dueAmount,
                'income_date' => $formattedDate,
                'title' => $request->title,
                'description' => $request->description,
            ]);
            
            // Handle attachment upload if provided
            if ($request->hasFile('income_attachment')) {
                $income->uploadAttachment($request->file('income_attachment'));
            }
            
            DB::commit();
            
            // Load relationships for the response
            $income->load(['student', 'incomeType', 'paymentType']);
            
            return response()->json($income, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating income: ' . $e->getMessage());
            return response()->json(['message' => 'Error creating income', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $income = Income::with(['student', 'incomeType', 'paymentType'])
                ->findOrFail($id);
            
            return response()->json($income, 200);
        } catch (\Exception $e) {
            Log::error('Error fetching income: ' . $e->getMessage());
            return response()->json(['message' => 'Income not found', 'error' => $e->getMessage()], 404);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // API doesn't need this method
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $income = Income::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'student_id' => 'nullable|exists:students,id',
                'income_type_id' => 'nullable|exists:income_types,id',
                'payment_type_id' => 'nullable|exists:payment_types,id',
                'amount' => 'nullable|numeric|min:0.01',
                'received_amount' => 'nullable|numeric|min:0',
                'income_date' => 'nullable|date',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'income_attachment' => 'nullable|file|mimes:jpeg,jpg,png,gif,pdf|max:5120',
                'remove_attachment' => 'nullable',
            ]);
            
            if ($validator->fails()) {
                return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }
            
            DB::beginTransaction();
            
            // Update fields if provided
            if ($request->has('student_id')) {
                $income->student_id = $request->student_id;
            }
            
            if ($request->has('income_type_id')) {
                $income->income_type_id = $request->income_type_id;
            }
            
            if ($request->has('payment_type_id')) {
                $income->payment_type_id = $request->payment_type_id;
            }
            
            if ($request->has('amount')) {
                $income->amount = $request->amount;
            }
            
            if ($request->has('income_date')) {
                // Format the date using DateService
                $income->income_date = $this->dateService->formatDate($request->income_date, 'Y-m-d');
            }
            
            if ($request->has('title')) {
                $income->title = $request->title;
            }
            
            if ($request->has('description')) {
                $income->description = $request->description;
            }
            
            // Update received amount and recalculate due amount
            if ($request->has('received_amount')) {
                $income->received_amount = $request->received_amount;
                $income->due_amount = max(0, $income->amount - $income->received_amount);
            }
            
            // Handle attachment upload if provided
            if ($request->hasFile('income_attachment')) {
                $income->uploadAttachment($request->file('income_attachment'));
            }
            
            // Remove attachment if requested
            if ($request->has('remove_attachment') && $this->parseBoolean($request->input('remove_attachment')) && $income->income_attachment) {
                // Delete the file from storage
                if (Storage::disk('public')->exists($income->income_attachment)) {
                    Storage::disk('public')->delete($income->income_attachment);
                }
                
                // Clear the attachment field
                $income->income_attachment = null;
            }
            
            $income->save();
            DB::commit();
            
            // Load relationships for the response
            $income->load(['student', 'incomeType', 'paymentType']);
            
            return response()->json($income, 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating income: ' . $e->getMessage());
            return response()->json(['message' => 'Error updating income', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $income = Income::findOrFail($id);
            
            // Delete attachment if exists
            if ($income->income_attachment) {
                if (Storage::disk('public')->exists($income->income_attachment)) {
                    Storage::disk('public')->delete($income->income_attachment);
                }
            }
            
            $income->delete();
            
            return response()->json(['message' => 'Income deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting income: ' . $e->getMessage());
            return response()->json(['message' => 'Error deleting income', 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Upload attachment to an existing income
     */
    public function uploadAttachment(Request $request, string $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'income_attachment' => 'required|file|mimes:jpeg,jpg,png,gif,pdf|max:5120',
            ]);
            
            if ($validator->fails()) {
                return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }
            
            $income = Income::findOrFail($id);
            
            $path = $income->uploadAttachment($request->file('income_attachment'));
            
            if (!$path) {
                return response()->json(['message' => 'Failed to upload attachment'], 500);
            }
            
            return response()->json([
                'message' => 'Attachment uploaded successfully',
                'income_attachment' => $path
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error uploading attachment: ' . $e->getMessage());
            return response()->json(['message' => 'Error uploading attachment', 'error' => $e->getMessage()], 500);
        }
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
