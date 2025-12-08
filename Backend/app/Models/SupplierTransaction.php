<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Supplier;
use App\Models\PaymentType;

class SupplierTransaction extends Model
{
    protected $fillable = [
        'supplier_id',
        'amount',
        'description',
        'payment_status',
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
