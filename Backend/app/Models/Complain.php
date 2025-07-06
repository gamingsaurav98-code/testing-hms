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
}
