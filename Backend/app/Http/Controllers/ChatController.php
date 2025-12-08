<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Complain;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    /**
     * Get all chat messages for a complaint
     */
    public function getComplaintChats($complainId): JsonResponse
    {
        try {
            $complain = Complain::findOrFail($complainId);
            
            $chats = Chat::forComplaint($complainId)
                ->orderBy('created_at', 'asc')
                ->get();

            // Add additional properties to each chat
            $formattedChats = $chats->map(function ($chat) {
                return [
                    'id' => $chat->id,
                    'complain_id' => $chat->complain_id,
                    'sender_id' => $chat->sender_id,
                    'sender_type' => $chat->sender_type,
                    'sender_name' => $chat->sender_name,
                    'message' => $chat->message,
                    'is_edited' => $chat->is_edited,
                    'is_read' => $chat->is_read,
                    'read_at' => $chat->read_at,
                    'created_at' => $chat->created_at,
                    'updated_at' => $chat->updated_at,
                    'message_preview' => $chat->getMessagePreview(),
                    'formatted_timestamp' => $chat->getFormattedTimestamp(),
                    'time_ago' => $chat->getTimeAgo(),
                    'is_unread' => $chat->isUnread(),
                    'is_edited_flag' => $chat->isEdited(),
                    'can_be_edited' => $chat->canBeEdited(),
                    'edit_time_remaining' => $chat->getEditTimeRemaining(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'complain' => [
                        'id' => $complain->id,
                        'title' => $complain->title,
                        'status' => $complain->status,
                        'chat_summary' => $complain->getChatSummary(),
                    ],
                    'chats' => $formattedChats,
                    'total_messages' => $chats->count(),
                    'unread_count' => $chats->where('is_read', false)->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve chat messages: ' . $e->getMessage()
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
                'message' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get current authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Create the chat message with sender information
            $chat = Chat::create([
                'complain_id' => $request->complain_id,
                'sender_id' => $user->id,
                'sender_type' => $user->role, // 'admin', 'student', 'staff'
                'sender_name' => $user->name,
                'message' => $request->message,
                'is_edited' => false,
                'is_read' => false,
            ]);

            // Update complaint statistics
            $complain = Complain::find($request->complain_id);
            if ($complain) {
                $complain->updateChatStatistics();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Message sent successfully',
                'data' => [
                    'id' => $chat->id,
                    'complain_id' => $chat->complain_id,
                    'sender_id' => $chat->sender_id,
                    'sender_type' => $chat->sender_type,
                    'sender_name' => $chat->sender_name,
                    'message' => $chat->message,
                    'is_edited' => $chat->is_edited,
                    'is_read' => $chat->is_read,
                    'read_at' => $chat->read_at,
                    'created_at' => $chat->created_at,
                    'updated_at' => $chat->updated_at,
                    'can_be_edited' => $chat->canBeEdited(),
                    'edit_time_remaining' => $chat->getEditTimeRemaining(),
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
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get current authenticated user
            $user = Auth::user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated'
                ], 401);
            }

            $chat = Chat::findOrFail($chatId);
            
            // Check if user can edit this message (owns it and within 5 minutes)
            if (!$chat->canBeEditedBy($user->id, $user->role)) {
                $message = 'You can only edit your own messages within 5 minutes of posting.';
                if (!$chat->isOwnedBy($user->id, $user->role)) {
                    $message = 'You can only edit your own messages.';
                } else if (!$chat->canBeEdited()) {
                    $message = 'Messages can only be edited within 5 minutes of posting.';
                }
                
                return response()->json([
                    'status' => 'error',
                    'message' => $message
                ], 403);
            }
            
            // Use the model method to edit the message
            $chat->editMessage($request->message);

            return response()->json([
                'status' => 'success',
                'message' => 'Message updated successfully',
                'data' => [
                    'id' => $chat->id,
                    'complain_id' => $chat->complain_id,
                    'sender_id' => $chat->sender_id,
                    'sender_type' => $chat->sender_type,
                    'sender_name' => $chat->sender_name,
                    'message' => $chat->message,
                    'is_edited' => $chat->is_edited,
                    'is_read' => $chat->is_read,
                    'read_at' => $chat->read_at,
                    'created_at' => $chat->created_at,
                    'updated_at' => $chat->updated_at,
                    'message_preview' => $chat->getMessagePreview(),
                    'formatted_timestamp' => $chat->getFormattedTimestamp(),
                    'can_be_edited' => $chat->canBeEdited(),
                    'edit_time_remaining' => $chat->getEditTimeRemaining(),
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
     * Delete a chat message - DISABLED
     * Messages cannot be deleted as per business requirements
     */
    public function deleteMessage($chatId): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => 'Messages cannot be deleted. You can only edit messages within 5 minutes of posting.'
        ], 403);
    }

    /**
     * Mark messages as read
     */
    public function markAsRead(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'complain_id' => 'required|exists:complains,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Use the scope method and update in bulk
            $markedCount = Chat::forComplaint($request->complain_id)
                ->unread()
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            // Update complaint statistics
            $complain = Complain::find($request->complain_id);
            if ($complain) {
                $complain->updateChatStatistics();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Messages marked as read',
                'marked_count' => $markedCount
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark messages as read: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread message count
     */
    public function getUnreadCount(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'complain_id' => 'sometimes|exists:complains,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = Chat::where('is_read', false);
            
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
