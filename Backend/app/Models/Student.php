<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\User;
use App\Models\Hostel;
use App\Models\Room;
use App\Models\StudentCheckInCheckOut;
use App\Models\StudentFinancial;
use App\Models\StudentCheckoutFinancial;
use App\Models\StudentCheckoutRule;
use App\Models\Notice;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Complain;
use App\Models\StudentFeeGenerate;
use App\Models\StudentAmenities;
use App\Models\Attachment;
use App\Traits\BelongsToHostel;

class Student extends Model
{
    use BelongsToHostel;
    
    protected $fillable = [   
        'student_name',
        'user_id',
        'date_of_birth',
        'contact_number',
        'email',
        'district',
        'city_name',
        'ward_no',
        'street_name',
        'citizenship_no',
        'date_of_issue',
        'citizenship_issued_district',
        'educational_institution',
        'class_time',
        'level_of_study',
        'expected_stay_duration',
        'blood_group',
        'food',
        'disease',
        'father_name',
        'father_contact',
        'father_occupation',
        'mother_name',
        'mother_contact',
        'mother_occupation',
        'spouse_name',
        'spouse_contact',
        'spouse_occupation',
        'local_guardian_name',
        'local_guardian_address',
        'local_guardian_contact',
        'local_guardian_occupation',
        'local_guardian_relation',
        'verified_by',
        'verified_on',
        'student_id',
        'room_id',
        'hostel_id',
        'student_image',
        'student_citizenship_image',
        'registration_form_image',
        'is_active',
        'is_existing_student',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($student) {
            // Validate room belongs to hostel if both are provided
            if ($student->room_id && $student->hostel_id) {
                $room = Room::find($student->room_id);
                if ($room && $room->hostel_id != $student->hostel_id) {
                    throw new \Exception('The selected room does not belong to the selected hostel.');
                }
            }
            
            // Check if room has available capacity
            if ($student->room_id) {
                $room = Room::find($student->room_id);
                if ($room) {
                    $occupiedBeds = $room->students()->count();
                    if ($occupiedBeds >= $room->capacity) {
                        throw new \Exception('The selected room is already at full capacity.');
                    }
                }
            }
        });
        
        static::updating(function ($student) {
            // If room_id is changing, validate room belongs to hostel
            if ($student->isDirty('room_id') && $student->room_id && $student->hostel_id) {
                $room = Room::find($student->room_id);
                if ($room && $room->hostel_id != $student->hostel_id) {
                    throw new \Exception('The selected room does not belong to the selected hostel.');
                }
                
                // Check if new room has available capacity
                $occupiedBeds = $room->students()->where('id', '!=', $student->id)->count();
                if ($occupiedBeds >= $room->capacity) {
                    throw new \Exception('The selected room is already at full capacity.');
                }
            }
        });
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
    }
    
    public function room()
    {
        return $this->belongsTo(Room::class);
    }
    
    // Payment relationship removed as requested
    
    public function checkInCheckOuts()
    {
        return $this->hasMany(StudentCheckInCheckOut::class);
    }
    
    public function financials()
    {
        return $this->hasMany(StudentFinancial::class);
    }
    
    public function checkoutFinancials()
    {
        return $this->hasMany(StudentCheckoutFinancial::class);
    }
    
    public function checkoutRules()
    {
        return $this->hasMany(StudentCheckoutRule::class);
    }
    
    public function notices()
    {
        return $this->hasMany(Notice::class);
    }
    
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
    
    public function incomes()
    {
        return $this->hasMany(Income::class);
    }
    
    public function complains()
    {
        return $this->hasMany(Complain::class);
    }
    
    public function feeGenerates()
    {
        return $this->hasMany(StudentFeeGenerate::class);
    }
    
    public function amenities()
    {
        return $this->hasMany(StudentAmenities::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    /**
     * Scope a query to only include active students
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive(Builder $query)
    {
        return $query->where('is_active', true);
    }
    
    /**
     * Scope a query to only include students in a specific room
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  int  $roomId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInRoom(Builder $query, $roomId)
    {
        return $query->where('room_id', $roomId);
    }
}