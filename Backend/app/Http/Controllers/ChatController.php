<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Complain;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    /**
     * Get all chat messages for a specific complaint
     */
    public function getComplaintChats(Request $request, $complainId): JsonResponse
    {
        try {
            $complain = Complain::findOrFail($complainId);
            
            $chats = Chat::with(['studentSender', 'staffSender'])
                ->byComplaint($complainId)
                ->notDeleted()
                ->orderBy('created_at', 'asc')
                ->get();

            // Format the response
            $formattedChats = $chats->map(function ($chat) {
                return [
                    'id' => $chat->id,
                    'message' => $chat->formatted_message,
                    'original_message' => $chat->original_message,
                    'sender_type' => $chat->sender_type,
                    'sender_name' => $chat->sender_name,
                    'sender_id' => $chat->sender_id,
                    'is_edited' => $chat->is_edited,
                    'is_read' => $chat->is_read,
                    'message_type' => $chat->message_type,
                    'attachments' => $chat->attachments,
                    'can_edit' => $chat->canBeEdited(),
                    'can_delete' => $chat->canBeDeleted(),
                    'edit_time_remaining' => $chat->edit_time_remaining,
                    'created_at' => $chat->created_at,
                    'edited_at' => $chat->edited_at,
                    'read_at' => $chat->read_at,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'complain' => [
                        'id' => $complain->id,
                        'title' => $complain->title,
                        'status' => $complain->status,
                    ],
                    'chats' => $formattedChats,
                    'total_messages' => $chats->count(),
                    'unread_count' => $chats->where('is_read', false)->count(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch chat messages: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a new chat message
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'complain_id' => 'required|exists:complains,id',
                'sender_id' => 'required|integer',
                'sender_type' => 'required|in:admin,student,staff',
                'message' => 'required_without:attachments|string|max:1000',
                'message_type' => 'in:text,file,image',
                'attachments' => 'array|max:5', // Maximum 5 attachments
                'attachments.*' => 'file|max:10240', // 10MB max per file
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Handle file attachments
            $attachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('chat_attachments', $filename, 'public');
                    
                    $attachments[] = [
                        'filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ];
                }
            }

            // Create the chat message
            $chat = Chat::create([
                'complain_id' => $validated['complain_id'],
                'sender_id' => $validated['sender_id'],
                'sender_type' => $validated['sender_type'],
                'message' => $validated['message'] ?? '',
                'message_type' => $validated['message_type'] ?? Chat::MESSAGE_TYPE_TEXT,
                'attachments' => !empty($attachments) ? $attachments : null,
            ]);

            // Load relationships
            $chat->load(['studentSender', 'staffSender']);

            return response()->json([
                'status' => 'success',
                'message' => 'Message sent successfully',
                'data' => [
                    'id' => $chat->id,
                    'message' => $chat->formatted_message,
                    'sender_type' => $chat->sender_type,
                    'sender_name' => $chat->sender_name,
                    'sender_id' => $chat->sender_id,
                    'message_type' => $chat->message_type,
                    'attachments' => $chat->attachments,
                    'can_edit' => $chat->canBeEdited(),
                    'can_delete' => $chat->canBeDeleted(),
                    'edit_time_remaining' => $chat->edit_time_remaining,
                    'created_at' => $chat->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send message: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Edit a chat message
     */
    public function editMessage(Request $request, $chatId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'message' => 'required|string|max:1000',
                'sender_id' => 'required|integer',
                'sender_type' => 'required|in:admin,student,staff',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $chat = Chat::findOrFail($chatId);

            // Check if the user is the sender
            if ($chat->sender_id != $request->sender_id || $chat->sender_type != $request->sender_type) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You can only edit your own messages'
                ], 403);
            }

            // Check if message can be edited
            if (!$chat->canBeEdited()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Message cannot be edited. Time limit exceeded or message already edited/deleted.'
                ], 422);
            }

            // Edit the message
            $success = $chat->editMessage($request->message);

            if (!$success) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to edit message'
                ], 500);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Message edited successfully',
                'data' => [
                    'id' => $chat->id,
                    'message' => $chat->formatted_message,
                    'original_message' => $chat->original_message,
                    'is_edited' => $chat->is_edited,
                    'edited_at' => $chat->edited_at,
                    'can_edit' => $chat->canBeEdited(),
                    'edit_time_remaining' => $chat->edit_time_remaining,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to edit message: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a chat message
     */
    public function deleteMessage(Request $request, $chatId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'sender_id' => 'required|integer',
                'sender_type' => 'required|in:admin,student,staff',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $chat = Chat::findOrFail($chatId);

            // Check if the user is the sender or admin
            $canDelete = ($chat->sender_id == $request->sender_id && $chat->sender_type == $request->sender_type) 
                        || $request->sender_type == 'admin';

            if (!$canDelete) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You can only delete your own messages'
                ], 403);
            }

            // Check if message can be deleted
            if (!$chat->canBeDeleted()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Message cannot be deleted. Time limit exceeded.'
                ], 422);
            }

            // Delete the message
            $success = $chat->deleteMessage();

            if (!$success) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to delete message'
                ], 500);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Message deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete message: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark messages as read
     */
    public function markAsRead(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'complain_id' => 'required|exists:complains,id',
                'reader_id' => 'required|integer',
                'reader_type' => 'required|in:admin,student,staff',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Mark all unread messages in this complaint as read
            // (except messages sent by the reader themselves)
            $updatedCount = Chat::where('complain_id', $request->complain_id)
                ->where('is_read', false)
                ->where(function ($query) use ($request) {
                    $query->where('sender_id', '!=', $request->reader_id)
                          ->orWhere('sender_type', '!=', $request->reader_type);
                })
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'status' => 'success',
                'message' => "Marked {$updatedCount} messages as read",
                'marked_count' => $updatedCount
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark messages as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread message count for a user
     */
    public function getUnreadCount(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
                'user_type' => 'required|in:admin,student,staff',
                'complain_id' => 'sometimes|exists:complains,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = Chat::where('is_read', false)
                ->where(function ($q) use ($request) {
                    $q->where('sender_id', '!=', $request->user_id)
                      ->orWhere('sender_type', '!=', $request->user_type);
                });

            if ($request->has('complain_id')) {
                $query->where('complain_id', $request->complain_id);
            }

            $unreadCount = $query->count();

            return response()->json([
                'status' => 'success',
                'unread_count' => $unreadCount
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to get unread count: ' . $e->getMessage()
            ], 500);
        }
    }
}
