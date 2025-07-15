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
        'last_message_at',
        'last_message_preview',
        'last_message_sender_type',
        'total_messages',
        'unread_messages_count',
        'has_unread_admin_messages',
        'has_unread_user_messages',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'has_unread_admin_messages' => 'boolean',
        'has_unread_user_messages' => 'boolean',
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
        return $this->hasMany(Chat::class)->notDeleted()->orderBy('created_at', 'asc');
    }
    
    /**
     * Update chat statistics for this complaint
     */
    public function updateChatStatistics()
    {
        $latestMessage = $this->chats()->notDeleted()->latest()->first();
        
        if ($latestMessage) {
            $this->update([
                'last_message_at' => $latestMessage->created_at,
                'last_message_preview' => \Str::limit($latestMessage->message, 100),
                'last_message_sender_type' => $latestMessage->sender_type,
                'total_messages' => $this->chats()->notDeleted()->count(),
            ]);
        }
        
        $this->updateUnreadCounts();
    }
    
    /**
     * Update unread message counts
     */
    public function updateUnreadCounts()
    {
        $totalUnread = $this->chats()->unread()->count();
        $adminUnread = $this->chats()->unread()->where('sender_type', '!=', 'admin')->count();
        $userUnread = $this->chats()->unread()->where('sender_type', 'admin')->count();
        
        $this->update([
            'unread_messages_count' => $totalUnread,
            'has_unread_admin_messages' => $adminUnread > 0,
            'has_unread_user_messages' => $userUnread > 0,
        ]);
    }
    
    /**
     * Mark all messages as read for a specific user type
     */
    public function markMessagesAsReadFor($userType, $userId)
    {
        $this->chats()
            ->where('is_read', false)
            ->where(function ($query) use ($userType, $userId) {
                $query->where('sender_type', '!=', $userType)
                      ->orWhere('sender_id', '!=', $userId);
            })
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
            
        $this->updateUnreadCounts();
    }
    
    /**
     * Get unread count for admin (messages from students/staff)
     */
    public function getUnreadCountForAdmin()
    {
        return $this->chats()->unread()->where('sender_type', '!=', 'admin')->count();
    }
    
    /**
     * Get unread count for user (messages from admin)
     */
    public function getUnreadCountForUser($userType, $userId)
    {
        return $this->chats()
            ->unread()
            ->where('sender_type', 'admin')
            ->count();
    }
}
