<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryPayment extends Model
{
    protected $fillable = [
        'staff_id',
        'amount',
        'payment_date',
        'payment_type',
        'remark',
    ];
}
