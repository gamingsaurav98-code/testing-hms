<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShareHolderFinance extends Model
{
    protected $fillable =[
        'shareholder_id',
        'amount',
        'payment_date',
        'payment_type',
        'remark',
    ];
}
