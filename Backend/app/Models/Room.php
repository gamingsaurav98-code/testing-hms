<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Hostel;
use App\Models\Block;
use App\Models\Student;
use App\Models\InquirySeater;
use App\Models\Attachment;
use App\Traits\BelongsToHostel;

class Room extends Model
{
    use BelongsToHostel;
    
    protected $fillable = [
        'room_name',
        'block_id',
        'hostel_id',
        'capacity',
        'status',
        'room_type',
        'floor_number',
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
            // Validate block belongs to hostel if both are provided
            if ($room->block_id && $room->hostel_id) {
                $block = Block::find($room->block_id);
                if ($block && $block->hostel_id != $room->hostel_id) {
                    throw new \Exception('The selected block does not belong to the selected hostel.');
                }
            }
            
            // Ensure capacity is a positive number
            if ($room->capacity <= 0) {
                throw new \Exception('Room capacity must be greater than zero.');
            }
        });
        
        static::updating(function ($room) {
            // Validate block belongs to hostel if both are provided
            if ($room->block_id && $room->hostel_id) {
                $block = Block::find($room->block_id);
                if ($block && $block->hostel_id != $room->hostel_id) {
                    throw new \Exception('The selected block does not belong to the selected hostel.');
                }
            }
            
            // Prevent reducing capacity below current occupancy
            if ($room->isDirty('capacity')) {
                $currentStudents = $room->students()->count();
                if ($room->capacity < $currentStudents) {
                    throw new \Exception("Cannot reduce room capacity below current occupancy ($currentStudents students).");
                }
            }
        });
    }
    
    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
    }
    
    public function block()
    {
        return $this->belongsTo(Block::class);
    }
    
    // Floor relationship removed as requested
    
    public function students()
    {
        return $this->hasMany(Student::class);
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
