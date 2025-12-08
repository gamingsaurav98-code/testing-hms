<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;
use App\Models\StaffCheckoutFinancial;
use App\Models\StaffCheckInCheckOut;

class StaffCheckoutRule extends Model
{
     protected $fillable = [
        'staff_id',
        'is_active',
        'active_after_days',
        'percentage',
    ];
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function checkoutFinancials()
    {
        return $this->hasMany(StaffCheckoutFinancial::class, 'checkout_rule_id');
    }
    
    public function checkInCheckOuts()
    {
        return $this->hasMany(StaffCheckInCheckOut::class, 'checkout_rule_id');
    }
}
