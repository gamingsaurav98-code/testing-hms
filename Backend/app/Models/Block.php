<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Room;
use App\Models\Hostel;
use App\Models\StaffCheckInCheckOut;
use App\Models\StudentCheckInCheckOut;
use App\Models\Inquiry;
use App\Models\InquirySeater;
use App\Models\Attachment;
use App\Traits\BelongsToHostel;

class Block extends Model
{
    use BelongsToHostel;
    
    protected $fillable = [
        'hostel_id',
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
        static::creating(function ($block) {
            // Validate that hostel_id exists
            if (!$block->hostel_id) {
                throw new \Exception('A block must be associated with a hostel.');
            }
            
            // Check if hostel exists
            if (!\App\Models\Hostel::find($block->hostel_id)) {
                throw new \Exception('The selected hostel does not exist.');
            }
        });
        
        static::deleting(function ($block) {
            // Check if block has any rooms before deleting
            if ($block->rooms()->count() > 0) {
                throw new \Exception('Cannot delete block that has rooms. Delete the rooms first.');
            }
        });
    }

    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
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
