<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\StudentFeeType;
use App\Models\StudentFinancial;

class StudentFeeGenerate extends Model
{
    protected $fillable = [
        'student_id',
        'fee_type',
        'amount',
        'year',
        'month',
    ];
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function feeType()
    {
        return $this->belongsTo(StudentFeeType::class, 'fee_type');
    }
    
    public function studentFinancial()
    {
        return $this->belongsTo(StudentFinancial::class, 'student_id', 'student_id');
    }

}
