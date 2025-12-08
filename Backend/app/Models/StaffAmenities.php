<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;

class StaffAmenities extends Model
{
    protected $fillable = [
        'staff_id',
        'name',
        'description',
    ];
    
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
