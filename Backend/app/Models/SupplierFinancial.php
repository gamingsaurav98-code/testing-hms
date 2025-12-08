<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Supplier;
use App\Models\PaymentType;

class SupplierFinancial extends Model
{
    protected $fillable = [
        'supplier_id',
        'initial_balance',
        'balance_type', // due or advance
        'amount',
        'payment_date',
        'remark',
        'payment_type_id',
    ];
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
}
