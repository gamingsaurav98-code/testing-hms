<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use App\Models\Attachment;
use App\Models\Student;
use App\Models\Staff;
use App\Models\Block;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class NoticeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);
        
        // Load notices with basic relationships
        $notices = Notice::with([
                'attachments', 
                'student' => function($query) {
                    $query->with('room.block'); // Include room and block info for students
                },
                'staff',
                'block' => function($query) {
                    $query->withCount('rooms'); // Include room count for blocks
                }
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        // Process the notices to add detailed profile information based on target type
        $notices->getCollection()->transform(function ($notice) {
            return $this->addDetailedProfileData($notice);
        });
        
        return response()->json($notices);
    }
    
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'schedule_time' => 'nullable|date|after:now', // Allow null, but if provided must be future date
            'status' => 'nullable|string|in:active,inactive',
            'target_type' => 'required|string|in:all,student,staff,specific_student,specific_staff,block',
            'notice_type' => 'nullable|string|in:general,urgent,event,announcement',
            'notice_attachments' => 'nullable|array',
            'notice_attachments.*' => 'file|max:10240', // Max 10MB per file
            'student_id' => 'nullable|exists:students,id',
            'staff_id' => 'nullable|exists:staff,id',
            'block_id' => 'nullable|exists:blocks,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $notice = Notice::create([
            'title' => $request->title,
            'description' => $request->description,
            'schedule_time' => $request->schedule_time ?? now(), // Use current time if not scheduled
            'status' => $request->status ?? 'active',
            'target_type' => $request->target_type,
            'notice_type' => $request->notice_type ?? 'general',
            'student_id' => $request->student_id,
            'staff_id' => $request->staff_id,
            'block_id' => $request->block_id,
            'notice_attachment' => null, // We'll update this if files are uploaded
        ]);

        // Handle attachments
        if ($request->hasFile('notice_attachments')) {
            $mainAttachment = null;
            
            foreach ($request->file('notice_attachments') as $index => $file) {
                $path = $file->store('notice_attachments', 'public');
                
                $attachment = new Attachment([
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'type' => $file->getClientMimeType(),
                    'notice_id' => $notice->id,
                ]);
                
                $attachment->save();
                
                // Use the first attachment as the main notice_attachment
                if ($index === 0) {
                    $mainAttachment = $path;
                }
            }
            
            // Update the notice with the main attachment
            if ($mainAttachment) {
                $notice->notice_attachment = $mainAttachment;
                $notice->save();
            }
        }

        return response()->json($notice->load('attachments'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        // Load notice with detailed relationships
        $notice = Notice::with([
                'attachments', 
                'student' => function($query) {
                    $query->with('room.block'); // Include room and block info for students
                },
                'staff',
                'block' => function($query) {
                    $query->withCount('rooms'); // Include room count for blocks
                }
            ])
            ->findOrFail($id);
            
        // Add detailed profile information based on target type
        $notice = $this->addDetailedProfileData($notice);
        
        return response()->json($notice);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $notice = Notice::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'schedule_time' => 'nullable|date|after:now', // Allow null, but if provided must be future date
            'status' => 'nullable|string|in:active,inactive',
            'target_type' => 'sometimes|required|string|in:all,student,staff,specific_student,specific_staff,block',
            'notice_type' => 'nullable|string|in:general,urgent,event,announcement',
            'notice_attachments' => 'nullable|array',
            'notice_attachments.*' => 'file|max:10240', // Max 10MB per file
            'student_id' => 'nullable|exists:students,id',
            'staff_id' => 'nullable|exists:staff,id',
            'block_id' => 'nullable|exists:blocks,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $notice->update([
            'title' => $request->title ?? $notice->title,
            'description' => $request->description ?? $notice->description,
            'schedule_time' => $request->schedule_time ?? $notice->schedule_time,
            'status' => $request->status ?? $notice->status,
            'target_type' => $request->target_type ?? $notice->target_type,
            'notice_type' => $request->notice_type ?? $notice->notice_type,
            'student_id' => $request->student_id ?? $notice->student_id,
            'staff_id' => $request->staff_id ?? $notice->staff_id,
            'block_id' => $request->block_id ?? $notice->block_id,
        ]);

        // Handle attachments
        if ($request->hasFile('notice_attachments')) {
            $mainAttachment = null;
            $isFirstAttachment = !$notice->attachments()->exists();
            
            foreach ($request->file('notice_attachments') as $index => $file) {
                $path = $file->store('notice_attachments', 'public');
                
                $attachment = new Attachment([
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'type' => $file->getClientMimeType(),
                    'notice_id' => $notice->id,
                ]);
                
                $attachment->save();
                
                // If this is the first attachment and no main attachment exists
                if ($index === 0 && ($isFirstAttachment || !$notice->notice_attachment)) {
                    $mainAttachment = $path;
                }
            }
            
            // Update the notice with the main attachment if needed
            if ($mainAttachment) {
                $notice->notice_attachment = $mainAttachment;
                $notice->save();
            }
        }

        return response()->json($notice->load('attachments'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $notice = Notice::findOrFail($id);
        
        // Delete all attachments and their files
        foreach ($notice->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->path);
            $attachment->delete();
        }
        
        $notice->delete();
        
        return response()->json(null, 204);
    }
    
    /**
     * Delete an attachment from a notice.
     */
    public function deleteAttachment(string $noticeId, string $attachmentId)
    {
        $notice = Notice::findOrFail($noticeId);
        $attachment = Attachment::where('id', $attachmentId)
            ->where('notice_id', $noticeId)
            ->firstOrFail();
        
        $attachmentPath = $attachment->path;
        
        // Check if this is the main attachment
        $isMainAttachment = $notice->notice_attachment === $attachmentPath;
        
        // Delete the file from storage
        Storage::disk('public')->delete($attachmentPath);
        
        // Delete the attachment record
        $attachment->delete();
        
        // If this was the main attachment, update the notice to use another attachment or null
        if ($isMainAttachment) {
            $newMainAttachment = $notice->attachments()->first();
            $notice->notice_attachment = $newMainAttachment ? $newMainAttachment->path : null;
            $notice->save();
        }
        
        return response()->json(null, 204);
    }
    
    /**
     * Get notices by target type
     */
    public function getNoticesByTargetType(Request $request, string $targetType)
    {
        $validator = Validator::make(['target_type' => $targetType], [
            'target_type' => 'required|string|in:all,student,staff,specific_student,specific_staff,block',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $perPage = $request->query('per_page', 10);
        
        $notices = Notice::with([
                        'attachments', 
                        'student' => function($query) {
                            $query->with('room.block'); // Include room and block info for students
                        },
                        'staff',
                        'block' => function($query) {
                            $query->withCount('rooms'); // Include room count for blocks
                        }
                    ])
                    ->where('target_type', $targetType)
                    ->where('status', 'active')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);
        
        // Process the notices to add detailed profile information
        $notices->getCollection()->transform(function ($notice) {
            return $this->addDetailedProfileData($notice);
        });
        
        return response()->json($notices);
    }
    
    /**
     * Get notices for a specific student
     */
    public function getNoticesForStudent(Request $request, string $studentId)
    {
        $perPage = $request->query('per_page', 10);
        
        $notices = Notice::with([
                        'attachments', 
                        'student' => function($query) {
                            $query->with('room.block'); // Include room and block info for students
                        },
                        'staff',
                        'block' => function($query) {
                            $query->withCount('rooms'); // Include room count for blocks
                        }
                    ])
                    ->where(function($query) use ($studentId) {
                        $query->where('target_type', 'all')
                            ->orWhere('target_type', 'student')
                            ->orWhere(function($q) use ($studentId) {
                                $q->where('target_type', 'specific_student')
                                  ->where('student_id', $studentId);
                            });
                    })
                    ->where('status', 'active')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);
        
        // Process the notices to add detailed profile information
        $notices->getCollection()->transform(function ($notice) {
            return $this->addDetailedProfileData($notice);
        });
        
        return response()->json($notices);
    }
    
    /**
     * Get notices for a specific staff
     */
    public function getNoticesForStaff(Request $request, string $staffId)
    {
        $perPage = $request->query('per_page', 10);
        
        $notices = Notice::with([
                        'attachments', 
                        'student' => function($query) {
                            $query->with('room.block'); // Include room and block info for students
                        },
                        'staff',
                        'block' => function($query) {
                            $query->withCount('rooms'); // Include room count for blocks
                        }
                    ])
                    ->where(function($query) use ($staffId) {
                        $query->where('target_type', 'all')
                            ->orWhere('target_type', 'staff')
                            ->orWhere(function($q) use ($staffId) {
                                $q->where('target_type', 'specific_staff')
                                  ->where('staff_id', $staffId);
                            });
                    })
                    ->where('status', 'active')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);
        
        // Process the notices to add detailed profile information
        $notices->getCollection()->transform(function ($notice) {
            return $this->addDetailedProfileData($notice);
        });
        
        return response()->json($notices);
    }
    
    /**
     * Get notices for a specific block
     */
    public function getNoticesForBlock(Request $request, string $blockId)
    {
        $perPage = $request->query('per_page', 10);
        
        $notices = Notice::with([
                        'attachments', 
                        'student' => function($query) {
                            $query->with('room.block'); // Include room and block info for students
                        },
                        'staff',
                        'block' => function($query) {
                            $query->withCount('rooms'); // Include room count for blocks
                        }
                    ])
                    ->where(function($query) use ($blockId) {
                        $query->where('target_type', 'all')
                            ->orWhere(function($q) use ($blockId) {
                                $q->where('target_type', 'block')
                                  ->where('block_id', $blockId);
                            });
                    })
                    ->where('status', 'active')
                    ->orderBy('created_at', 'desc')
                    ->paginate($perPage);
        
        // Process the notices to add detailed profile information
        $notices->getCollection()->transform(function ($notice) {
            return $this->addDetailedProfileData($notice);
        });
        
        return response()->json($notices);
    }
    
    /**
     * Get notices for a user (can be either student or staff)
     */
    public function getNoticesForUser(Request $request)
    {
        // Get the authenticated user
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $perPage = $request->query('per_page', 10);
        
        // Check if the user is a student or staff
        $student = Student::where('user_id', $user->id)->first();
        $staff = Staff::where('user_id', $user->id)->first();
        
        $query = Notice::with([
                    'attachments', 
                    'student' => function($query) {
                        $query->with('room.block'); // Include room and block info for students
                    },
                    'staff',
                    'block' => function($query) {
                        $query->withCount('rooms'); // Include room count for blocks
                    }
                ]);
                
        // Only filter by active status for students, staff can see all notices
        if ($student) {
            $query->where('status', 'active');
        }
                    
        if ($student) {
            // If user is a student, get student-specific notices
            $query->where(function($q) use ($student) {
                $q->where('target_type', 'all')
                  ->orWhere('target_type', 'student')
                  ->orWhere(function($subq) use ($student) {
                      $subq->where('target_type', 'specific_student')
                           ->where('student_id', $student->id);
                  });
                  
                // Also include block notices if student is assigned to a room in a block
                if ($student->room_id) {
                    $room = Room::find($student->room_id);
                        if ($room && $room->block_id) {
                            // Add block-targeted notices via the outer query builder ($q)
                            $q->orWhere(function($blockq) use ($room) {
                            $blockq->where('target_type', 'block')
                                  ->where('block_id', $room->block_id);
                        });
                    }
                }
            });
        } elseif ($staff) {
            // If user is a staff, get staff-specific notices
            $query->where(function($q) use ($staff) {
                $q->where('target_type', 'all')
                  ->orWhere('target_type', 'staff')
                  ->orWhere(function($subq) use ($staff) {
                      $subq->where('target_type', 'specific_staff')
                           ->where('staff_id', $staff->id);
                  });
            });
        } else {
            // If neither student nor staff, just get general notices
            $query->where('target_type', 'all');
        }
        
        $notices = $query->orderBy('schedule_time', 'desc')
                        ->paginate($perPage);
                        
        // Process the notices to add detailed profile information
        $notices->getCollection()->transform(function ($notice) {
            return $this->addDetailedProfileData($notice);
        });
        
        return response()->json($notices);
    }
    
    /**
     * Add detailed profile data to a notice based on its target type
     * 
     * @param Notice $notice
     * @return Notice
     */
    private function addDetailedProfileData(Notice $notice)
    {
        // Create a profile_data attribute to hold the detailed information
        $profileData = [];
        
        switch ($notice->target_type) {
            case 'specific_student':
                if ($notice->student) {
                    $profileData = [
                        'name' => $notice->student->student_name,
                        'student_id' => $notice->student->student_id,
                        'contact_number' => $notice->student->contact_number,
                        'email' => $notice->student->email,
                        'image' => $notice->student->student_image,
                        'room' => $notice->student->room ? [
                            'id' => $notice->student->room->id,
                            'room_number' => $notice->student->room->room_number ?? null,
                            'capacity' => $notice->student->room->capacity ?? null,
                            'block' => $notice->student->room->block ? [
                                'id' => $notice->student->room->block->id,
                                'name' => $notice->student->room->block->block_name,
                                'location' => $notice->student->room->block->location
                            ] : null
                        ] : null,
                        'educational_institution' => $notice->student->educational_institution,
                        'level_of_study' => $notice->student->level_of_study,
                        'blood_group' => $notice->student->blood_group,
                        'food_preference' => $notice->student->food
                    ];
                }
                break;
                
            case 'specific_staff':
                if ($notice->staff) {
                    $profileData = [
                        'name' => $notice->staff->staff_name,
                        'staff_id' => $notice->staff->staff_id,
                        'contact_number' => $notice->staff->contact_number,
                        'email' => $notice->staff->email,
                        'image' => $notice->staff->staff_image,
                        'blood_group' => $notice->staff->blood_group,
                        'food_preference' => $notice->staff->food,
                        'educational_institution' => $notice->staff->educational_institution,
                        'level_of_study' => $notice->staff->level_of_study
                    ];
                }
                break;
                
            case 'block':
                if ($notice->block) {
                    $profileData = [
                        'name' => $notice->block->block_name,
                        'location' => $notice->block->location,
                        'manager_name' => $notice->block->manager_name,
                        'manager_contact' => $notice->block->manager_contact,
                        'room_count' => $notice->block->rooms_count ?? 0,
                        'total_capacity' => $notice->block->total_capacity ?? null,
                        'vacant_beds' => $notice->block->vacant_beds ?? null,
                        'remarks' => $notice->block->remarks
                    ];
                }
                break;
        }
        
        // Add the profile data to the notice
        $notice->profile_data = $profileData;
        
        return $notice;
    }
    
    /**
     * Get a list of students for selection during notice creation
     */
    public function getStudentsForNotice(Request $request)
    {
        $search = $request->query('search', '');
        $perPage = $request->query('per_page', 15);
        
        $query = Student::query()
            ->with(['room' => function($query) {
                $query->with('block:id,block_name,location');
            }])
            ->select([
                'id', 
                'student_name', 
                'student_id', 
                'contact_number', 
                'email',
                'room_id',
                'student_image',
                'educational_institution',
                'level_of_study'
            ])
            ->where('is_active', true);
            
        // Apply search if provided
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('student_name', 'LIKE', "%{$search}%")
                  ->orWhere('student_id', 'LIKE', "%{$search}%")
                  ->orWhere('contact_number', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }
        
        $students = $query->orderBy('student_name')
            ->paginate($perPage);
            
        // Format the data for easier consumption in the frontend
        $students->getCollection()->transform(function ($student) {
            $roomInfo = null;
            if ($student->room) {
                $roomInfo = [
                    'id' => $student->room->id,
                    'room_number' => $student->room->room_number ?? '',
                    'block' => $student->room->block ? [
                        'id' => $student->room->block->id,
                        'name' => $student->room->block->block_name,
                        'location' => $student->room->block->location
                    ] : null
                ];
            }
            
            return [
                'id' => $student->id,
                'name' => $student->student_name,
                'student_id' => $student->student_id,
                'contact' => $student->contact_number,
                'email' => $student->email,
                'image' => $student->student_image,
                'room' => $roomInfo,
                'educational_institution' => $student->educational_institution,
                'level_of_study' => $student->level_of_study
            ];
        });
        
        return response()->json($students);
    }
    
    /**
     * Get a list of staff for selection during notice creation
     */
    public function getStaffForNotice(Request $request)
    {
        $search = $request->query('search', '');
        $perPage = $request->query('per_page', 15);
        
        $query = Staff::query()
            ->select([
                'id', 
                'staff_name', 
                'staff_id', 
                'contact_number', 
                'email',
                'staff_image',
                'educational_institution',
                'level_of_study'
            ]);
            
        // Apply search if provided
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('staff_name', 'LIKE', "%{$search}%")
                  ->orWhere('staff_id', 'LIKE', "%{$search}%")
                  ->orWhere('contact_number', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }
        
        $staff = $query->orderBy('staff_name')
            ->paginate($perPage);
            
        // Format the data for easier consumption in the frontend
        $staff->getCollection()->transform(function ($staffMember) {
            return [
                'id' => $staffMember->id,
                'name' => $staffMember->staff_name,
                'staff_id' => $staffMember->staff_id,
                'contact' => $staffMember->contact_number,
                'email' => $staffMember->email,
                'image' => $staffMember->staff_image,
                'educational_institution' => $staffMember->educational_institution,
                'level_of_study' => $staffMember->level_of_study
            ];
        });
        
        return response()->json($staff);
    }
    
    /**
     * Get a list of blocks for selection during notice creation
     */
    public function getBlocksForNotice(Request $request)
    {
        $search = $request->query('search', '');
        $perPage = $request->query('per_page', 15);
        
        $query = Block::query()
            ->select([
                'id', 
                'block_name', 
                'location', 
                'manager_name', 
                'manager_contact',
                'remarks',
                'block_attachment'
            ])
            ->withCount('rooms');
            
        // Apply search if provided
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('block_name', 'LIKE', "%{$search}%")
                  ->orWhere('location', 'LIKE', "%{$search}%")
                  ->orWhere('manager_name', 'LIKE', "%{$search}%")
                  ->orWhere('manager_contact', 'LIKE', "%{$search}%");
            });
        }
        
        $blocks = $query->orderBy('block_name')
            ->paginate($perPage);
            
        // Format the data for easier consumption in the frontend
        $blocks->getCollection()->transform(function ($block) {
            return [
                'id' => $block->id,
                'name' => $block->block_name,
                'location' => $block->location,
                'manager_name' => $block->manager_name,
                'manager_contact' => $block->manager_contact,
                'room_count' => $block->rooms_count,
                'total_capacity' => $block->total_capacity,
                'vacant_beds' => $block->vacant_beds,
                'remarks' => $block->remarks,
                'image' => $block->block_attachment
            ];
        });
        
        return response()->json($blocks);
    }

    // ========== STUDENT-SPECIFIC METHODS ==========

    /**
     * Get notices for the authenticated user (student or staff)
     */
    public function getMyNotices()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Check if user is student or staff
            $student = null;
            $staff = null;
            
            if ($user->role === 'student') {
                $student = Student::where('user_id', $user->id)->first();
                if (!$student) {
                    return response()->json(['message' => 'Student record not found'], 404);
                }
            } elseif ($user->role === 'staff') {
                $staff = Staff::where('user_id', $user->id)->first();
                if (!$staff) {
                    return response()->json(['message' => 'Staff record not found'], 404);
                }
            } else {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Build query based on user type
            $notices = Notice::where(function($query) use ($student, $staff) {
                $query->where('target_type', 'all');
                
                if ($student) {
                    // Student-specific notices
                    $query->orWhere('target_type', 'student')
                          ->orWhere(function($q) use ($student) {
                              $q->where('target_type', 'specific_student')
                                ->where('student_id', $student->id);
                          });
                    
                    // Block notices if student has a room
                    if ($student->room_id) {
                        $room = Room::find($student->room_id);
                        if ($room && $room->block_id) {
                            $query->orWhere(function($q) use ($room) {
                                $q->where('target_type', 'block')
                                  ->where('block_id', $room->block_id);
                            });
                        }
                    }
                } elseif ($staff) {
                    // Staff-specific notices
                    $query->orWhere('target_type', 'staff')
                          ->orWhere(function($q) use ($staff) {
                              $q->where('target_type', 'specific_staff')
                                ->where('staff_id', $staff->id);
                          });
                }
            })
            ->with(['attachments', 'student', 'staff', 'block'])
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'data' => $notices,
                'total' => $notices->count()
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch notices: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get a single notice for authenticated user (student or staff)
     */
    public function getNotice(string $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Check if user is student or staff
            $student = null;
            $staff = null;
            
            if ($user->role === 'student') {
                $student = Student::where('user_id', $user->id)->first();
                if (!$student) {
                    return response()->json(['message' => 'Student record not found'], 404);
                }
            } elseif ($user->role === 'staff') {
                $staff = Staff::where('user_id', $user->id)->first();
                if (!$staff) {
                    return response()->json(['message' => 'Staff record not found'], 404);
                }
            } else {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Get the notice and check if user has access to it
            $notice = Notice::with([
                'attachments', 
                'student' => function($query) {
                    $query->with('room.block');
                },
                'staff',
                'block' => function($query) {
                    $query->withCount('rooms');
                }
            ])
            ->where('id', $id)
            ->where(function($query) use ($student, $staff) {
                $query->where('target_type', 'all');
                
                if ($student) {
                    // Student-specific notices
                    $query->orWhere('target_type', 'student')
                          ->orWhere(function($q) use ($student) {
                              $q->where('target_type', 'specific_student')
                                ->where('student_id', $student->id);
                          });
                    
                    // Block notices if student has a room
                    if ($student->room_id) {
                        $room = Room::find($student->room_id);
                        if ($room && $room->block_id) {
                            $query->orWhere(function($q) use ($room) {
                                $q->where('target_type', 'block')
                                  ->where('block_id', $room->block_id);
                            });
                        }
                    }
                } elseif ($staff) {
                    // Staff-specific notices
                    $query->orWhere('target_type', 'staff')
                          ->orWhere(function($q) use ($staff) {
                              $q->where('target_type', 'specific_staff')
                                ->where('staff_id', $staff->id);
                          });
                }
            })
            ->first();

            if (!$notice) {
                return response()->json(['message' => 'Notice not found or access denied'], 404);
            }

            // Add detailed profile information
            $notice = $this->addDetailedProfileData($notice);

            return response()->json($notice);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch notice: ' . $e->getMessage()], 500);
        }
    }
}
