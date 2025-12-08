<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Block;
use App\Models\Student;
use App\Models\InquirySeater;
use App\Models\Attachment;

class Room extends Model
{
    
    protected $fillable = [
        'room_name',
        'block_id',
        'capacity',
        'status',
        'room_type',
        'room_attachment',
    ];
    
    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($room) {
            // Ensure capacity is a positive number
            if ($room->capacity <= 0) {
                throw new \Exception('Room capacity must be greater than zero.');
            }
        });
        
        static::updating(function ($room) {
            // Prevent reducing capacity below current occupancy
            if ($room->isDirty('capacity')) {
                $currentStudents = $room->students()->count();
                if ($room->capacity < $currentStudents) {
                    throw new \Exception("Cannot reduce room capacity below current occupancy ($currentStudents students).");
                }
            }
        });
    }
    
    // Hostel relationship removed as part of single-tenant conversion
    
    public function block()
    {
        return $this->belongsTo(Block::class);
    }
    
    /**
     * Get all students assigned to this room.
     * Only includes active students unless specified otherwise.
     */
    public function students()
    {
        return $this->hasMany(Student::class);
    }
    
    /**
     * Get only active students in this room.
     */
    public function activeStudents()
    {
        return $this->hasMany(Student::class)->where('is_active', true);
    }
    
    public function inquirySeaters()
    {
        return $this->hasMany(InquirySeater::class);
    }
    
    // Seater relationship removed as requested - capacity field is used instead
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    /**
     * Get count of vacant beds in this room
     *
     * @return int
     */
    public function getVacantBedsAttribute()
    {
        $occupiedBeds = $this->students()->count();
        return max(0, $this->capacity - $occupiedBeds);
    }
    
    /**
     * Get the current status of the room based on occupancy
     *
     * @return string
     */
    public function getStatusAttribute($value)
    {
        // If status is set to maintenance, don't override it
        if ($value === 'maintenance') {
            return $value;
        }
        
        $occupiedBeds = $this->students()->count();
        
        if ($occupiedBeds >= $this->capacity) {
            return 'occupied';
        } else {
            return 'vacant';
        }
    }
    
    /**
     * Scope a query to only include rooms with vacant beds
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeHasVacancy(Builder $query)
    {
        return $query->whereRaw('capacity > (SELECT COUNT(*) FROM students WHERE students.room_id = rooms.id)');
    }
}
