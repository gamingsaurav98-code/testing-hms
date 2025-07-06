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
        if ($request->has('all') && $request->all === 'true') {
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
            'is_active' => 'boolean',
        ]);
        
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
            'is_active' => 'boolean',
        ]);
        
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
}