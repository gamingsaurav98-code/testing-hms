<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Block;
use Illuminate\Http\Request;
use App\Services\ImageService;
use App\Services\DateService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class RoomController extends Controller
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
    public function index(Request $request)
    {
        try {
            $query = Room::with(['hostel', 'block']);

            // Filter by block_id if provided
            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }

            // Filter by hostel_id if provided
            if ($request->has('hostel_id')) {
                $query->where('hostel_id', $request->hostel_id);
            }

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by room_type if provided
            if ($request->has('room_type')) {
                $query->where('room_type', $request->room_type);
            }

            // Filter by vacancy if requested
            if ($request->has('has_vacancy') && $request->has_vacancy) {
                $query->hasVacancy();
            }

            $rooms = $query->paginate(10);
            return response()->json($rooms);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch rooms: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'room_name' => 'required|string|max:255|unique:rooms',
            'block_id' => 'required|exists:blocks,id',
            'hostel_id' => 'required|exists:hostels,id',
            'capacity' => 'required|integer|min:1',
            'status' => 'required|string|in:available,occupied,maintenance',
            'room_type' => 'required|string|max:255',
            'room_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            // Validate block belongs to hostel
            $block = Block::find($request->block_id);
            if ($block && $block->hostel_id != $request->hostel_id) {
                return response()->json(['message' => 'The selected block does not belong to the selected hostel.'], 422);
            }

            $roomData = $request->except('room_attachment');
            $roomData['created_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle file upload if present
            if ($request->hasFile('room_attachment')) {
                $roomData['room_attachment'] = $this->imageService->processImageAsync(
                    $request->file('room_attachment'),
                    'rooms',
                    null,
                    Room::class,
                    null, // ID will be available after creation
                    'room_attachment'
                );
            }
            
            $room = Room::create($roomData);
            return response()->json($room, 201);
            
        } catch (\Exception $e) {
            // Delete the uploaded file if room creation fails
            if (isset($roomData['room_attachment'])) {
                Storage::disk('public')->delete($roomData['room_attachment']);
            }
            return response()->json(['message' => 'Failed to create room: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $room = Room::with(['hostel', 'block', 'students'])->findOrFail($id);
            
            // Add vacancy info to response
            $room->occupied_beds = $room->students->count();
            $room->vacant_beds = $room->vacant_beds;
            
            return response()->json($room);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Room not found'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json(['message' => 'Room not found'], 404);
        }
        
        $request->validate([
            'room_name' => ['required', 'string', 'max:255', Rule::unique('rooms')->ignore($id)],
            'block_id' => 'required|exists:blocks,id',
            'hostel_id' => 'required|exists:hostels,id',
            'capacity' => 'required|integer|min:1',
            'status' => 'required|string|in:available,occupied,maintenance',
            'room_type' => 'required|string|max:255',
            'room_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            // Validate block belongs to hostel
            $block = Block::find($request->block_id);
            if ($block && $block->hostel_id != $request->hostel_id) {
                return response()->json(['message' => 'The selected block does not belong to the selected hostel.'], 422);
            }
            
            // Check capacity if being reduced
            if ($request->capacity < $room->capacity) {
                $currentOccupancy = $room->students()->count();
                if ($request->capacity < $currentOccupancy) {
                    return response()->json(['message' => "Cannot reduce room capacity below current occupancy ($currentOccupancy students)."], 422);
                }
            }
            
            $roomData = $request->except('room_attachment');
            $roomData['updated_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle file upload if present
            if ($request->hasFile('room_attachment')) {
                $roomData['room_attachment'] = $this->imageService->processImageAsync(
                    $request->file('room_attachment'),
                    'rooms',
                    $room->room_attachment,
                    Room::class,
                    $room->id,
                    'room_attachment'
                );
            }
            
            $room->update($roomData);
            return response()->json($room);
            
        } catch (\Exception $e) {
            // Clean up if update fails
            if (isset($roomData['room_attachment']) && $request->hasFile('room_attachment')) {
                Storage::disk('public')->delete($roomData['room_attachment']);
            }
            return response()->json(['message' => 'Failed to update room: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $room = Room::findOrFail($id);
            
            // Check if room has students
            if ($room->students()->count() > 0) {
                return response()->json(['message' => 'Cannot delete room because it has assigned students.'], 422);
            }
            
            if ($room->room_attachment) {
                Storage::disk('public')->delete($room->room_attachment);
            }
            
            $room->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete room: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get a list of available rooms with vacancies.
     */
    public function getAvailableRooms(Request $request)
    {
        try {
            $query = Room::with(['hostel', 'block'])
                ->where('status', 'available')
                ->hasVacancy();
            
            // Filter by hostel if provided
            if ($request->has('hostel_id')) {
                $query->where('hostel_id', $request->hostel_id);
            }
            
            // Filter by block if provided
            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }
            
            $rooms = $query->get();
            
            // Add vacancy info to each room
            foreach ($rooms as $room) {
                $room->vacant_beds = $room->vacant_beds;
            }
            
            return response()->json($rooms);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch available rooms: ' . $e->getMessage()], 500);
        }
    }
}
