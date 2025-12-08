<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\StudentCheckInCheckOut;
use App\Models\StudentCheckoutRule;

class StudentCheckoutFinancial extends Model
{
    protected $fillable = [
        'student_id',
        'checkout_id',
        'checkout_duration',
        'deducted_amount',
        'checkout_rule_id'
    ];
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function checkInCheckOut()
    {
        return $this->belongsTo(StudentCheckInCheckOut::class, 'checkout_id');
    }
    
    public function checkoutRule()
    {
        return $this->belongsTo(StudentCheckoutRule::class, 'checkout_rule_id');
    }
}
