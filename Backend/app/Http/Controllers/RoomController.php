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
            $query = Room::with(['block', 'students']);

            // Filter by block_id if provided
            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }

            // Filter by status if provided
            // Note: For dynamic status, we handle this after fetching records
            $requestedStatus = $request->has('status') ? $request->status : null;

            // Filter by room_type if provided
            if ($request->has('room_type')) {
                $query->where('room_type', $request->room_type);
            }

            // Filter by vacancy if requested
            if ($request->has('has_vacancy') && $request->has_vacancy) {
                $query->hasVacancy();
            }

            // Get paginated rooms
            $rooms = $query->paginate(10);
            
            // Calculate occupancy and actual status for each room
            foreach ($rooms as $room) {
                $room->occupied_beds = $room->students->count();
                $room->vacant_beds = max(0, $room->capacity - $room->occupied_beds);
                
                // Only apply status filtering here if requested
                if ($requestedStatus && $room->status !== $requestedStatus) {
                    $rooms->forget($room->id);
                }
            }
            
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
            'capacity' => 'required|integer|min:1',
            'room_type' => 'required|string|max:255',
            'room_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        try {
            \Log::info('Room creation started', ['request' => $request->except('room_attachment')]);

            $roomData = $request->except('room_attachment');
            $roomData['created_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle file upload if present
            if ($request->hasFile('room_attachment')) {
                try {
                    \Log::info('Room attachment upload attempt', [
                        'original_name' => $request->file('room_attachment')->getClientOriginalName(),
                        'mime' => $request->file('room_attachment')->getMimeType(),
                        'size' => $request->file('room_attachment')->getSize(),
                    ]);
                    
                    // Simple direct store approach
                    $path = $request->file('room_attachment')->store('rooms', 'public');
                    
                    if ($path) {
                        \Log::info('Room attachment stored successfully', ['path' => $path]);
                        $roomData['room_attachment'] = $path;
                    } else {
                        throw new \Exception("Failed to store the room image");
                    }
                } catch (\Exception $e) {
                    \Log::error('Room attachment upload failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json(['message' => 'Failed to upload room attachment: ' . $e->getMessage()], 500);
                }
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
    public function show(Request $request, string $id)
    {
        try {
            $query = Room::with('block');
            
            // Include students if requested
            if ($request->has('include_students') && $request->include_students === 'true') {
                $query->with(['students' => function($q) {
                    $q->where('is_active', true)
                      ->with(['financials' => function($q2) {
                          $q2->latest('created_at');
                      }]);
                }]);
            }
            
            $room = $query->findOrFail($id);
            
            // Add vacancy info to response
            $room->occupied_beds = $room->students->count();
            $room->vacant_beds = $room->vacant_beds;
            
            // If students are included, add their monthly fees and due amounts
            if ($request->has('include_students') && $request->include_students === 'true' && $room->students) {
                foreach ($room->students as $student) {
                    // Get due amount from income records
                    $dueAmount = $student->incomes()
                        ->where('due_amount', '>', 0)
                        ->sum('due_amount');
                    
                    $student->due_amount = $dueAmount > 0 ? $dueAmount : 0;
                }
            }
            
            return response()->json($room);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch room: ' . $e->getMessage()], 404);
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
            'capacity' => 'required|integer|min:1',
            'room_type' => 'required|string|max:255',
            'room_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            
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
                try {
                    \Log::info('Room attachment update attempt', [
                        'original_name' => $request->file('room_attachment')->getClientOriginalName(),
                        'mime' => $request->file('room_attachment')->getMimeType(),
                        'size' => $request->file('room_attachment')->getSize(),
                    ]);
                    
                    // Delete old file if it exists
                    if ($room->room_attachment) {
                        Storage::disk('public')->delete($room->room_attachment);
                    }
                    
                    // Simple direct store approach
                    $path = $request->file('room_attachment')->store('rooms', 'public');
                    
                    if ($path) {
                        \Log::info('Room attachment updated successfully', ['path' => $path]);
                        $roomData['room_attachment'] = $path;
                    } else {
                        throw new \Exception("Failed to store the room image");
                    }
                } catch (\Exception $e) {
                    \Log::error('Room attachment update failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json(['message' => 'Failed to upload room attachment: ' . $e->getMessage()], 500);
                }
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
            $query = Room::with(['block'])
                ->whereRaw('(SELECT COUNT(*) FROM students WHERE students.room_id = rooms.id) < rooms.capacity');
            
            // Filter by block if provided
            if ($request->has('block_id')) {
                $query->where('block_id', $request->block_id);
            }
            
            $rooms = $query->get();
            
            // Add vacancy info to each room
            foreach ($rooms as $room) {
                $room->vacant_beds = $room->vacant_beds;
                $room->occupied_beds = $room->students->count();
                
                // Ensure status reflects current occupancy (vacant or occupied)
                $room->status = $room->occupied_beds == 0 ? 'vacant' : 'occupied';
            }
            
            return response()->json($rooms);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch available rooms: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get all students in a specific room
     */
    public function getStudentsByRoom($id)
    {
        try {
            $room = Room::findOrFail($id);
            
            // Load students with their financials
            $students = $room->students()
                ->with(['financials' => function($query) {
                    $query->latest('created_at');
                }])
                ->where('is_active', true)
                ->get();
                
            // Add monthly fee to each student
            $students->each(function ($student) {
                // Get due amount from income records
                $dueAmount = $student->incomes()
                    ->where('due_amount', '>', 0)
                    ->sum('due_amount');
                
                $student->due_amount = $dueAmount > 0 ? $dueAmount : 0;
            });
            
            return response()->json($students);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch students: ' . $e->getMessage()], 500);
        }
    }
}
