<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\StudentCheckoutFinancial;
use App\Models\StudentCheckInCheckOut;

class StudentCheckoutRule extends Model
{
    protected $fillable = [
        'student_id',
        'is_active',
        'active_after_days',
        'percentage',
    ];
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function checkoutFinancials()
    {
        return $this->hasMany(StudentCheckoutFinancial::class, 'checkout_rule_id');
    }
    
    public function checkInCheckOuts()
    {
        return $this->hasMany(StudentCheckInCheckOut::class, 'checkout_rule_id');
    }
}
