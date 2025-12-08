<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;

class StudentAmenities extends Model
{
    protected $fillable = [
        'student_id',
        'name',
        'description',
    ];
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}