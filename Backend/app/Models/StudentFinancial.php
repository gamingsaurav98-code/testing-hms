<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Student;
use App\Models\PaymentType;
use App\Models\StudentFeeGenerate;

class StudentFinancial extends Model
{
    protected $fillable = [
        'student_id',
        'amount',
        'admission_fee',
        'form_fee',
        'security_deposit',
        'monthly_fee',
        'is_existing_student',
        'previous_balance',
        'initial_balance_after_registration',
        'balance_type', // "due" or "advance"
        'payment_date',
        'remark',
        'payment_type_id',
        'joining_date',
    ];
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
    
    public function studentFeeGenerates()
    {
        return $this->hasMany(StudentFeeGenerate::class, 'student_id', 'student_id');
    }
}
