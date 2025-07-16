<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Complain;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

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

            // Create the chat message
            $chat = Chat::create([
                'complain_id' => $request->complain_id,
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
                'data' => $chat
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

            $chat = Chat::findOrFail($chatId);
            
            // Use the model method to edit the message
            $chat->editMessage($request->message);

            return response()->json([
                'status' => 'success',
                'message' => 'Message updated successfully',
                'data' => [
                    'id' => $chat->id,
                    'message' => $chat->message,
                    'is_edited' => $chat->is_edited,
                    'updated_at' => $chat->updated_at,
                    'message_preview' => $chat->getMessagePreview(),
                    'formatted_timestamp' => $chat->getFormattedTimestamp(),
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
    public function deleteMessage($chatId): JsonResponse
    {
        try {
            $chat = Chat::findOrFail($chatId);
            $chat->delete();

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
