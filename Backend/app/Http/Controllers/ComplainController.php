<?php

namespace App\Http\Controllers;

use App\Models\Complain;
use App\Models\Chat;
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
            $query = Complain::with(['student', 'staff'])
                ->withCount(['chats', 'unreadChats']);
            
            // Handle staff filtering for staff users
            if (request('staff_filter') && auth()->user()->role === 'staff') {
                $staff = \App\Models\Staff::where('user_id', auth()->user()->id)->first();
                if ($staff) {
                    $query->where('staff_id', $staff->id);
                }
            }
            
            $complains = $query->paginate(10);
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
            $complain = Complain::with(['student', 'staff', 'chats'])
                ->withCount(['chats', 'unreadChats'])
                ->findOrFail($id);
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

    // ========== STUDENT-SPECIFIC METHODS ==========

    /**
     * Get complaints for the authenticated student
     */
    public function getMyComplaints()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $complaints = Complain::where('student_id', $student->id)
                ->with(['student', 'staff'])
                ->withCount(['chats as total_messages'])
                ->withCount(['chats as unread_messages' => function($query) {
                    $query->where('is_read', false);
                }])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'data' => $complaints,
                'total' => $complaints->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch your complaints: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new complaint for the authenticated student
     */
    public function createComplaint(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'complain_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $complainData = $request->except('complain_attachment');
            $complainData['student_id'] = $student->id;
            $complainData['status'] = 'pending';
            $complainData['created_at'] = $this->dateService->getCurrentDateTime();
            
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
            $complain->load(['student', 'staff']);
            
            return response()->json($complain, 201);
            
        } catch (\Exception $e) {
            // Delete the uploaded file if complain creation fails
            if (isset($complainData['complain_attachment'])) {
                Storage::disk('public')->delete($complainData['complain_attachment']);
            }
            return response()->json(['message' => 'Failed to create complaint: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific complaint for the authenticated student
     */
    public function getMyComplaint(string $id)
    {
        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $complain = Complain::where('id', $id)
                ->where('student_id', $student->id)
                ->with(['student', 'staff', 'chats'])
                ->withCount(['chats', 'unreadChats'])
                ->first();

            if (!$complain) {
                return response()->json(['message' => 'Complaint not found'], 404);
            }

            return response()->json($complain);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch complaint: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a specific complaint for the authenticated student
     */
    public function updateMyComplaint(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'complain_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'student') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get student record
            $student = \App\Models\Student::where('user_id', $user->id)->first();
            if (!$student) {
                return response()->json(['message' => 'Student record not found'], 404);
            }

            $complain = Complain::where('id', $id)
                ->where('student_id', $student->id)
                ->first();

            if (!$complain) {
                return response()->json(['message' => 'Complaint not found'], 404);
            }

            // Only allow editing if complaint is still pending
            if ($complain->status !== 'pending') {
                return response()->json(['message' => 'Cannot edit complaint that is no longer pending'], 403);
            }

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
            $complain->load(['student', 'staff']);
            
            return response()->json($complain);
            
        } catch (\Exception $e) {
            // Clean up if update fails
            if (isset($complainData['complain_attachment']) && $request->hasFile('complain_attachment')) {
                Storage::disk('public')->delete($complainData['complain_attachment']);
            }
            return response()->json(['message' => 'Failed to update complaint: ' . $e->getMessage()], 500);
        }
    }

    // ========== STAFF-SPECIFIC METHODS ==========

    /**
     * Get complaints created by the authenticated staff member
     */
    public function getMyStaffComplaints()
    {
        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get staff record
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            
            if (!$staff) {
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            $complaints = Complain::where('staff_id', $staff->id)
                ->with(['student', 'staff'])
                ->withCount(['chats as total_messages'])
                ->withCount(['chats as unread_messages' => function($query) {
                    $query->where('is_read', false);
                }])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'data' => $complaints,
                'total' => $complaints->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch your complaints: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a new complaint by the authenticated staff member to admin
     */
    public function createStaffComplaint(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'complain_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get staff record
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            if (!$staff) {
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            $complainData = $request->except('complain_attachment');
            $complainData['staff_id'] = $staff->id;
            $complainData['status'] = 'pending';
            $complainData['created_at'] = $this->dateService->getCurrentDateTime();
            
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
            $complain->load(['student', 'staff']);
            
            return response()->json($complain, 201);
            
        } catch (\Exception $e) {
            // Delete the uploaded file if complain creation fails
            if (isset($complainData['complain_attachment'])) {
                Storage::disk('public')->delete($complainData['complain_attachment']);
            }
            return response()->json(['message' => 'Failed to create complaint: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a specific complaint created by the authenticated staff member
     */
    public function getMyStaffComplaint(string $id)
    {
        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get staff record
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            if (!$staff) {
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            $complain = Complain::where('id', $id)
                ->where('staff_id', $staff->id)
                ->with(['student', 'staff', 'chats'])
                ->withCount(['chats', 'unreadChats'])
                ->first();

            if (!$complain) {
                return response()->json(['message' => 'Complaint not found'], 404);
            }

            return response()->json($complain);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch complaint: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a specific complaint created by the authenticated staff member
     */
    public function updateMyStaffComplaint(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'complain_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $user = auth()->user();
            if (!$user || $user->role !== 'staff') {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get staff record
            $staff = \App\Models\Staff::where('user_id', $user->id)->first();
            if (!$staff) {
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            $complain = Complain::where('id', $id)
                ->where('staff_id', $staff->id)
                ->first();

            if (!$complain) {
                return response()->json(['message' => 'Complaint not found'], 404);
            }

            // Only allow editing if complaint is still pending
            if ($complain->status !== 'pending') {
                return response()->json(['message' => 'Cannot edit complaint that is no longer pending'], 403);
            }

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
            $complain->load(['student', 'staff']);
            
            return response()->json($complain);
            
        } catch (\Exception $e) {
            // Clean up if update fails
            if (isset($complainData['complain_attachment']) && $request->hasFile('complain_attachment')) {
                Storage::disk('public')->delete($complainData['complain_attachment']);
            }
            return response()->json(['message' => 'Failed to update complaint: ' . $e->getMessage()], 500);
        }
    }
}
