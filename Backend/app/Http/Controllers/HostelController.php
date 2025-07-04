<?php

namespace App\Http\Controllers;

use App\Models\Hostel;
use Illuminate\Http\Request;
use App\Services\ImageService;
use App\Services\DateService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class HostelController extends Controller
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
            $hostels = Hostel::with(['blocks', 'rooms'])->paginate(10);
            return response()->json($hostels);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch hostels: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'owner_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer',
            'pan_number' => 'nullable|string|max:50',
            'logo' => 'nullable|file|mimes:jpg,jpeg,png',
        ]);

        try {
            $hostelData = $request->except('logo');
            $hostelData['created_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle logo upload if present
            if ($request->hasFile('logo')) {
                $hostelData['logo'] = $this->imageService->processImageAsync(
                    $request->file('logo'),
                    'hostels/logos',
                    null,
                    Hostel::class,
                    null, // ID will be available after creation
                    'logo'
                );
            }
            
            $hostel = Hostel::create($hostelData);
            return response()->json($hostel, 201);
            
        } catch (\Exception $e) {
            // Delete the uploaded file if hostel creation fails
            if (isset($hostelData['logo']) && $request->hasFile('logo')) {
                Storage::disk('public')->delete($hostelData['logo']);
            }
            return response()->json(['message' => 'Failed to create hostel: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $hostel = Hostel::with(['blocks', 'rooms', 'students', 'staff'])->findOrFail($id);
            return response()->json($hostel);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Hostel not found'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'owner_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer',
            'pan_number' => 'nullable|string|max:50',
            'logo' => 'nullable|file|mimes:jpg,jpeg,png',
        ]);

        try {
            $hostel = Hostel::findOrFail($id);
            $hostelData = $request->except('logo');
            $hostelData['updated_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle logo upload if present
            if ($request->hasFile('logo')) {
                $hostelData['logo'] = $this->imageService->processImageAsync(
                    $request->file('logo'),
                    'hostels/logos',
                    $hostel->logo,
                    Hostel::class,
                    $hostel->id,
                    'logo'
                );
            }
            
            $hostel->update($hostelData);
            return response()->json($hostel);
            
        } catch (\Exception $e) {
            // Clean up if update fails
            if (isset($hostelData['logo']) && $request->hasFile('logo')) {
                Storage::disk('public')->delete($hostelData['logo']);
            }
            return response()->json(['message' => 'Failed to update hostel: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $hostel = Hostel::findOrFail($id);
            
            // Check if there are related records before deletion
            if ($hostel->blocks()->count() > 0 || $hostel->rooms()->count() > 0 || 
                $hostel->students()->count() > 0 || $hostel->staff()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete hostel because it has related records. Remove all blocks, rooms, students, and staff first.'
                ], 422);
            }
            
            // Delete logo if exists
            if ($hostel->logo) {
                Storage::disk('public')->delete($hostel->logo);
            }
            
            $hostel->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete hostel: ' . $e->getMessage()], 500);
        }
    }
}
