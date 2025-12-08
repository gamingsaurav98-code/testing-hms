<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ShareHolder;
use App\Models\PaymentType;

class ShareHolderFinance extends Model
{
    protected $fillable = [
        'shareholder_id',
        'amount',
        'payment_date',
        'remark',
        'payment_type_id',
    ];
    
    public function shareHolder()
    {
        return $this->belongsTo(ShareHolder::class, 'shareholder_id');
    }

    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
}
