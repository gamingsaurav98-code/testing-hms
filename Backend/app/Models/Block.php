<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Room;
use App\Models\StaffCheckInCheckOut;
use App\Models\StudentCheckInCheckOut;
use App\Models\Inquiry;
use App\Models\InquirySeater;
use App\Models\Attachment;

class Block extends Model
{
    
    protected $fillable = [
        'block_name',
        'location',
        'manager_name',
        'manager_contact',
        'remarks',
        'block_attachment',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::deleting(function ($block) {
            // Check if block has any rooms before deleting
            if ($block->rooms()->count() > 0) {
                throw new \Exception('Cannot delete block that has rooms. Delete the rooms first.');
            }
        });
    }
    
    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
    
    public function staffCheckInCheckOuts()
    {
        return $this->hasMany(StaffCheckInCheckOut::class);
    }
    
    public function studentCheckInCheckOuts()
    {
        return $this->hasMany(StudentCheckInCheckOut::class);
    }
    
    public function inquiries()
    {
        return $this->hasMany(Inquiry::class);
    }
    
    public function inquirySeaters()
    {
        return $this->hasMany(InquirySeater::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    /**
     * Get total capacity of all rooms in this block
     *
     * @return int
     */
    public function getTotalCapacityAttribute()
    {
        return $this->rooms()->sum('capacity');
    }
    
    /**
     * Get total number of vacant beds in this block
     *
     * @return int
     */
    public function getVacantBedsAttribute()
    {
        $totalCapacity = $this->total_capacity;
        $occupiedBeds = $this->rooms()
            ->withCount('students')
            ->get()
            ->sum('students_count');
        return max(0, $totalCapacity - $occupiedBeds);
    }
}
