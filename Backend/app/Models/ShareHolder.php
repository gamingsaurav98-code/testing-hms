<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShareHolder extends Model
{
    protected $fillable =[
        'name',
        'email',
        'phone',
        'address',
        'father_name',
        'grandfather_name',
        'spouse_name',
        'share_percentage',
        'investment_amount',
        'shareholder_image_attachment',
        'joined_date',
        'remark',
        'is_active',
    ];
}
