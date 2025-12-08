<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\Staff;
use App\Models\Block;
use App\Models\Attachment;

class Notice extends Model
{
    protected $fillable = [
        'title',
        'description',
        'notice_attachment', // e.g., file path or URL
        'schedule_time',
        'status', // e.g., active, inactive
        'target_type', // e.g., all, student, staff, specific_student, specific_staff, block
        'notice_type', // e.g., general, urgent, event, announcement
        'student_id',
        'staff_id',
        'block_id',
    ];
    
    protected $appends = ['target_info'];
    public function student()
    {
        return $this->belongsTo(Student::class)->select([
            'id', 
            'student_name', 
            'student_id', 
            'contact_number', 
            'email', 
            'room_id',
            'student_image'
        ]);
    }
    
    public function staff()
    {
        return $this->belongsTo(Staff::class)->select([
            'id', 
            'staff_name', 
            'staff_id', 
            'contact_number', 
            'email',
            'staff_image'
        ]);
    }
    
    public function block()
    {
        return $this->belongsTo(Block::class)->select([
            'id', 
            'block_name', 
            'location', 
            'manager_name', 
            'manager_contact'
        ])->withCount('rooms');
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    /**
     * Get the target information based on the target_type
     */
    public function getTargetInfoAttribute()
    {
        switch ($this->target_type) {
            case 'all':
                return [
                    'type' => 'all',
                    'name' => 'All Users'
                ];
            case 'student':
                return [
                    'type' => 'student',
                    'name' => 'All Students'
                ];
            case 'staff':
                return [
                    'type' => 'staff',
                    'name' => 'All Staff'
                ];
            case 'specific_student':
                if ($this->student) {
                    return [
                        'type' => 'specific_student',
                        'id' => $this->student->id,
                        'name' => $this->student->student_name,
                        'identifier' => $this->student->student_id,
                        'contact' => $this->student->contact_number
                    ];
                }
                return null;
            case 'specific_staff':
                if ($this->staff) {
                    return [
                        'type' => 'specific_staff',
                        'id' => $this->staff->id,
                        'name' => $this->staff->staff_name,
                        'identifier' => $this->staff->staff_id,
                        'contact' => $this->staff->contact_number
                    ];
                }
                return null;
            case 'block':
                if ($this->block) {
                    return [
                        'type' => 'block',
                        'id' => $this->block->id,
                        'name' => $this->block->block_name,
                        'location' => $this->block->location,
                        'rooms_count' => $this->block->rooms_count
                    ];
                }
                return null;
            default:
                return null;
        }
    }
    
}