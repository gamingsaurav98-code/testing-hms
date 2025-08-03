<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;
use App\Models\Block;
use App\Models\StaffCheckoutRule;
use App\Models\StaffCheckoutFinancial;

class StaffCheckInCheckOut extends Model
{
    protected $fillable = [
        'staff_id',
        'requested_checkin_time',
        'requested_checkout_time',
        'checkin_time',
        'checkout_time',
        'estimated_checkin_date',
        'date',
        'block_id',
        'remarks',
        'status',
        'checkout_rule_id',
        'checkout_duration'
    ];
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function block()
    {
        return $this->belongsTo(Block::class);
    }
    
    public function checkoutRule()
    {
        return $this->belongsTo(StaffCheckoutRule::class);
    }
    
    public function checkoutFinancials()
    {
        return $this->hasMany(StaffCheckoutFinancial::class, 'checkout_id');
    }
}
