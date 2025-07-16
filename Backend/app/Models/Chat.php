<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chat extends Model
{
    protected $fillable = [
        'complain_id',
        'message',
        'is_edited',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_edited' => 'boolean',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Get the complaint that owns the chat message
     */
    public function complain(): BelongsTo
    {
        return $this->belongsTo(Complain::class);
    }
    
    /**
     * Scope to get only unread messages
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
    
    /**
     * Scope to get only read messages
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }
    
    /**
     * Scope to get messages for a specific complaint
     */
    public function scopeForComplaint($query, $complainId)
    {
        return $query->where('complain_id', $complainId);
    }
    
    /**
     * Mark this message as read
     */
    public function markAsRead()
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
            
            // Update complaint statistics
            $this->complain->updateChatStatistics();
        }
        
        return $this;
    }
    
    /**
     * Edit this message
     */
    public function editMessage($newMessage)
    {
        $this->update([
            'message' => $newMessage,
            'is_edited' => true,
        ]);
        
        return $this;
    }
    
    /**
     * Get message preview (first 50 characters)
     */
    public function getMessagePreview()
    {
        return \Str::limit($this->message, 50);
    }
    
    /**
     * Check if message is unread
     */
    public function isUnread()
    {
        return !$this->is_read;
    }
    
    /**
     * Check if message has been edited
     */
    public function isEdited()
    {
        return $this->is_edited;
    }
    
    /**
     * Get formatted timestamp for display
     */
    public function getFormattedTimestamp()
    {
        return $this->created_at->format('M j, Y \a\t g:i A');
    }
    
    /**
     * Get time ago format
     */
    public function getTimeAgo()
    {
        return $this->created_at->diffForHumans();
    }
}
