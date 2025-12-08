<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;
use App\Models\PaymentType;
use App\Models\Attachment;

class SalaryPayment extends Model
{
    protected $fillable = [
        'staff_id',
        'amount',
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
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class, 'salary_payment_id');
    }
}
