<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExpenseCategory;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class ExpenseCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ExpenseCategory::query();

            // Apply search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Order by name
            $query->orderBy('name');

            // Return paginated or all results
            if ($request->has('paginate') && $request->paginate === 'true') {
                $perPage = $request->get('per_page', 15);
                $categories = $query->paginate($perPage);
            } else {
                $categories = $query->get();
            }

            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve expense categories',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:expense_categories,name',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category = ExpenseCategory::create([
                'name' => $request->name,
                'description' => $request->description,
            ]);

            return response()->json($category, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create expense category',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $category = ExpenseCategory::findOrFail($id);
            return response()->json($category);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Expense category not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $category = ExpenseCategory::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:expense_categories,name,' . $id,
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category->update([
                'name' => $request->name,
                'description' => $request->description,
            ]);

            return response()->json($category);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update expense category',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $category = ExpenseCategory::findOrFail($id);

            // Check if category has associated expenses
            if ($category->expenses()->exists()) {
                return response()->json([
                    'error' => 'Cannot delete expense category',
                    'message' => 'This category has associated expenses and cannot be deleted.'
                ], 400);
            }

            $category->delete();

            return response()->json(['message' => 'Expense category deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete expense category',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}