<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierFinancial extends Model
{
    protected $fillable = [
        'supplier_id',
        'amount',
        'payment_date',
        'payment_type',
        'remark',
    ];
}
