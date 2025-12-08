<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\Staff;
use App\Models\Attachment;

class Complain extends Model
{
    protected $fillable = [
        'student_id',
        'staff_id',
        'title',
        'complain_attachment',
        'description',
        'status',
        'total_messages',
        'unread_admin_messages',
        'unread_student_messages',
        'unread_staff_messages',
        'last_message_at',
        'last_message_by',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'total_messages' => 'integer',
        'unread_admin_messages' => 'integer',
        'unread_student_messages' => 'integer',
        'unread_staff_messages' => 'integer',
    ];


    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    /**
     * Get all chat messages for this complaint
     */
    public function chats()
    {
        return $this->hasMany(Chat::class);
    }
    
    /**
     * Get unread chat messages for this complaint
     */
    public function unreadChats()
    {
        return $this->hasMany(Chat::class)->where('is_read', false);
    }
    
    /**
     * Get the latest chat message for this complaint
     */
    public function latestChat()
    {
        return $this->hasOne(Chat::class)->latest();
    }
    
    /**
     * Get chat messages ordered by creation date
     */
    public function orderedChats()
    {
        return $this->hasMany(Chat::class)->orderBy('created_at', 'asc');
    }
    
    /**
     * Update chat statistics for this complaint
     */
    public function updateChatStatistics()
    {
        $totalMessages = $this->chats()->count();
        $unreadCount = $this->chats()->where('is_read', false)->count();
        $latestMessage = $this->chats()->latest()->first();
        
        $this->update([
            'total_messages' => $totalMessages,
            'unread_admin_messages' => $unreadCount,
            'unread_student_messages' => $unreadCount,
            'unread_staff_messages' => $unreadCount,
            'last_message_at' => $latestMessage?->created_at,
            'last_message_by' => $latestMessage ? 'user' : null,
        ]);
    }
    
    /**
     * Mark all messages as read for this complaint
     */
    public function markAllMessagesAsRead()
    {
        $this->chats()
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
            
        $this->updateChatStatistics();
    }
    
    /**
     * Get unread message count
     */
    public function getUnreadCount()
    {
        return $this->chats()->where('is_read', false)->count();
    }
    
    /**
     * Check if complaint has unread messages
     */
    public function hasUnreadMessages()
    {
        return $this->getUnreadCount() > 0;
    }
    
    /**
     * Get latest message preview (first 100 characters)
     */
    public function getLatestMessagePreview()
    {
        $latestMessage = $this->latestChat;
        return $latestMessage ? \Str::limit($latestMessage->message, 100) : null;
    }
    
    /**
     * Get chat summary for this complaint
     */
    public function getChatSummary()
    {
        return [
            'total_messages' => $this->total_messages,
            'unread_count' => $this->getUnreadCount(),
            'has_unread' => $this->hasUnreadMessages(),
            'last_message_at' => $this->last_message_at,
            'last_message_preview' => $this->getLatestMessagePreview(),
        ];
    }
}
