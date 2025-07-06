<?php

namespace App\Http\Controllers;

use App\Models\Complain;
use Illuminate\Http\Request;
use App\Services\ImageService;
use App\Services\DateService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ComplainController extends Controller
{
    protected $imageService;
    protected $dateService;

    public function __construct(ImageService $imageService, DateService $dateService)
    {
        $this->imageService = $imageService;
        $this->dateService = $dateService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $complains = Complain::with(['student', 'staff'])->paginate(10);
            return response()->json($complains);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch complains: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'staff_id' => 'nullable|exists:staff,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'status' => 'nullable|string|in:pending,in_progress,resolved,rejected',
            'complain_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $complainData = $request->except('complain_attachment');
            $complainData['created_at'] = $this->dateService->getCurrentDateTime();
            
            // Set default status if not provided
            if (!isset($complainData['status'])) {
                $complainData['status'] = 'pending';
            }
            
            // Handle file upload if present
            if ($request->hasFile('complain_attachment')) {
                $complainData['complain_attachment'] = $this->imageService->processImageAsync(
                    $request->file('complain_attachment'),
                    'complains',
                    null,
                    Complain::class,
                    null, // ID will be available after creation
                    'complain_attachment'
                );
            }
            
            $complain = Complain::create($complainData);
            return response()->json($complain, 201);
            
        } catch (\Exception $e) {
            // Delete the uploaded file if complain creation fails
            if (isset($complainData['complain_attachment'])) {
                Storage::disk('public')->delete($complainData['complain_attachment']);
            }
            return response()->json(['message' => 'Failed to create complain: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $complain = Complain::with(['student', 'staff'])->findOrFail($id);
            return response()->json($complain);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Complain not found'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'staff_id' => 'nullable|exists:staff,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'status' => 'nullable|string|in:pending,in_progress,resolved,rejected',
            'complain_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $complain = Complain::findOrFail($id);
            $complainData = $request->except('complain_attachment');
            $complainData['updated_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle file upload if present
            if ($request->hasFile('complain_attachment')) {
                $complainData['complain_attachment'] = $this->imageService->processImageAsync(
                    $request->file('complain_attachment'),
                    'complains',
                    $complain->complain_attachment,
                    Complain::class,
                    $complain->id,
                    'complain_attachment'
                );
            }
            
            $complain->update($complainData);
            return response()->json($complain);
            
        } catch (\Exception $e) {
            // Clean up if update fails
            if (isset($complainData['complain_attachment']) && $request->hasFile('complain_attachment')) {
                Storage::disk('public')->delete($complainData['complain_attachment']);
            }
            return response()->json(['message' => 'Failed to update complain: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $complain = Complain::findOrFail($id);
            if ($complain->complain_attachment) {
                Storage::disk('public')->delete($complain->complain_attachment);
            }
            $complain->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete complain: ' . $e->getMessage()], 500);
        }
    }
}
