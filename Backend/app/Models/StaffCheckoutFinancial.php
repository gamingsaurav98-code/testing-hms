<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;
use App\Models\StaffCheckInCheckOut;
use App\Models\StaffCheckoutRule;

class StaffCheckoutFinancial extends Model
{
    protected $fillable = [
        'staff_id',
        'checkout_id',
        'checkout_duration',
        'deducted_amount',
        'checkout_rule_id'
    ];
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function checkInCheckOut()
    {
        return $this->belongsTo(StaffCheckInCheckOut::class, 'checkout_id');
    }
    
    public function checkoutRule()
    {
        return $this->belongsTo(StaffCheckoutRule::class, 'checkout_rule_id');
    }
}
