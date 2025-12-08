<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\Block;
use App\Models\StudentCheckoutRule;
use App\Models\StudentCheckoutFinancial;

class StudentCheckInCheckOut extends Model
{
    protected $fillable = [
        'student_id',
        'requested_checkin_time',
        'requested_checkout_time',
        'checkin_time',
        'checkout_time',
        'estimated_checkin_date',
        'checkout_duration',
        'date',
        'remarks',
        'status',
        'checkout_rule_id',
        'block_id'
    ];
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function block()
    {
        return $this->belongsTo(Block::class);
    }
    
    public function checkoutRule()
    {
        return $this->belongsTo(StudentCheckoutRule::class);
    }
    
    public function checkoutFinancials()
    {
        return $this->hasMany(StudentCheckoutFinancial::class, 'checkout_id');
    }
}
