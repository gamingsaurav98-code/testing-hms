<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;
use App\Models\PaymentType;

class StaffSalaryGenerate extends Model
{
    protected $fillable = [
        'staff_id',
        'salary_amount',
        'year',
        'month',
        'payment_date',
        'remark',
        'payment_type_id',
    ];
    
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
}
