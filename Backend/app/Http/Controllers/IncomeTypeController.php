<?php

namespace App\Http\Controllers;

use App\Models\IncomeType;
use Illuminate\Http\Request;

class IncomeTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->has('all') && $request->all === 'true') {
            $incomeTypes = IncomeType::all();
            return response()->json($incomeTypes);
        }
        
        $incomeTypes = IncomeType::paginate(15);
        return response()->json($incomeTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $incomeType = IncomeType::create($validated);
        return response()->json($incomeType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $incomeType = IncomeType::findOrFail($id);
        return response()->json($incomeType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $incomeType = IncomeType::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $incomeType->update($validated);
        return response()->json($incomeType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $incomeType = IncomeType::findOrFail($id);
        $incomeType->delete();
        return response()->json(null, 204);
    }
}
