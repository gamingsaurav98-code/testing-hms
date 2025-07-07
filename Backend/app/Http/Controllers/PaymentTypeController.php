<?php

namespace App\Http\Controllers;

use App\Models\PaymentType;
use Illuminate\Http\Request;

class PaymentTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->has('all') && $this->parseBoolean($request->all)) {
            $paymentTypes = PaymentType::where('is_active', true)->get();
            return response()->json($paymentTypes);
        }
        
        $paymentTypes = PaymentType::paginate(15);
        return response()->json($paymentTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'nullable',
        ]);
        // Ensure boolean fields are properly set
        $validated['is_active'] = $this->parseBoolean($request->input('is_active', true));
        
        $paymentType = PaymentType::create($validated);
        return response()->json($paymentType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $paymentType = PaymentType::findOrFail($id);
        return response()->json($paymentType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $paymentType = PaymentType::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'string|max:255',
            'is_active' => 'nullable',
        ]);
        // Ensure boolean fields are properly set
        $validated['is_active'] = $this->parseBoolean($request->input('is_active', $paymentType->is_active ?? true));
        
        $paymentType->update($validated);
        return response()->json($paymentType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $paymentType = PaymentType::findOrFail($id);
        $paymentType->delete();
        return response()->json(null, 204);
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