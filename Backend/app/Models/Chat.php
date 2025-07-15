<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Carbon\Carbon;

class Chat extends Model
{
    protected $fillable = [
        'complain_id',
        'sender_id',
        'sender_type',
        'message',
        'original_message',
        'is_edited',
        'edited_at',
        'is_deleted',
        'deleted_at',
        'is_read',
        'read_at',
        'attachments',
        'message_type',
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_edited' => 'boolean',
        'is_deleted' => 'boolean',
        'is_read' => 'boolean',
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    protected $dates = [
        'edited_at',
        'deleted_at',
        'read_at',
        'created_at',
        'updated_at',
    ];

    // Constants for sender types
    const SENDER_TYPE_ADMIN = 'admin';
    const SENDER_TYPE_STUDENT = 'student';
    const SENDER_TYPE_STAFF = 'staff';

    // Constants for message types
    const MESSAGE_TYPE_TEXT = 'text';
    const MESSAGE_TYPE_FILE = 'file';
    const MESSAGE_TYPE_IMAGE = 'image';

    // Constants for edit time limit (in minutes)
    const EDIT_TIME_LIMIT = 15; // 15 minutes

    /**
     * Get the complaint that owns the chat message
     */
    public function complain(): BelongsTo
    {
        return $this->belongsTo(Complain::class);
    }

    /**
     * Get the sender (polymorphic relation)
     * This will return Student, Staff, or Admin based on sender_type
     */
    public function sender(): MorphTo
    {
        return $this->morphTo('sender', 'sender_type', 'sender_id');
    }

    /**
     * Get student sender if sender_type is 'student'
     */
    public function studentSender(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'sender_id')->where('sender_type', self::SENDER_TYPE_STUDENT);
    }

    /**
     * Get staff sender if sender_type is 'staff'
     */
    public function staffSender(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'sender_id')->where('sender_type', self::SENDER_TYPE_STAFF);
    }

    /**
     * Scope for non-deleted messages
     */
    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    /**
     * Scope for unread messages
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for messages by sender type
     */
    public function scopeBySenderType($query, $senderType)
    {
        return $query->where('sender_type', $senderType);
    }

    /**
     * Scope for messages by complaint
     */
    public function scopeByComplaint($query, $complainId)
    {
        return $query->where('complain_id', $complainId);
    }

    /**
     * Check if message can be edited (within time limit)
     */
    public function canBeEdited(): bool
    {
        if ($this->is_deleted || $this->is_edited) {
            return false;
        }

        $timeLimit = Carbon::now()->subMinutes(self::EDIT_TIME_LIMIT);
        return $this->created_at->greaterThan($timeLimit);
    }

    /**
     * Check if message can be deleted (within time limit)
     */
    public function canBeDeleted(): bool
    {
        if ($this->is_deleted) {
            return false;
        }

        $timeLimit = Carbon::now()->subMinutes(self::EDIT_TIME_LIMIT);
        return $this->created_at->greaterThan($timeLimit);
    }

    /**
     * Edit the message
     */
    public function editMessage(string $newMessage): bool
    {
        if (!$this->canBeEdited()) {
            return false;
        }

        $this->original_message = $this->message;
        $this->message = $newMessage;
        $this->is_edited = true;
        $this->edited_at = Carbon::now();

        return $this->save();
    }

    /**
     * Soft delete the message
     */
    public function deleteMessage(): bool
    {
        if (!$this->canBeDeleted()) {
            return false;
        }

        $this->is_deleted = true;
        $this->deleted_at = Carbon::now();

        return $this->save();
    }

    /**
     * Mark message as read
     */
    public function markAsRead(): bool
    {
        if ($this->is_read) {
            return true;
        }

        $this->is_read = true;
        $this->read_at = Carbon::now();

        return $this->save();
    }

    /**
     * Get sender name based on sender type
     */
    public function getSenderNameAttribute(): string
    {
        switch ($this->sender_type) {
            case self::SENDER_TYPE_STUDENT:
                return $this->studentSender?->student_name ?? 'Student';
            case self::SENDER_TYPE_STAFF:
                return $this->staffSender?->staff_name ?? 'Staff';
            case self::SENDER_TYPE_ADMIN:
                return 'Admin';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get formatted message with edit indicator
     */
    public function getFormattedMessageAttribute(): string
    {
        $message = $this->is_deleted ? '[Message deleted]' : $this->message;
        
        if ($this->is_edited && !$this->is_deleted) {
            $message .= ' (edited)';
        }

        return $message;
    }

    /**
     * Get time remaining for edit (in minutes)
     */
    public function getEditTimeRemainingAttribute(): int
    {
        if (!$this->canBeEdited()) {
            return 0;
        }

        $elapsed = $this->created_at->diffInMinutes(Carbon::now());
        return max(0, self::EDIT_TIME_LIMIT - $elapsed);
    }

    /**
     * Check if sender is admin
     */
    public function isFromAdmin(): bool
    {
        return $this->sender_type === self::SENDER_TYPE_ADMIN;
    }

    /**
     * Check if sender is student
     */
    public function isFromStudent(): bool
    {
        return $this->sender_type === self::SENDER_TYPE_STUDENT;
    }

    /**
     * Check if sender is staff
     */
    public function isFromStaff(): bool
    {
        return $this->sender_type === self::SENDER_TYPE_STAFF;
    }
}
