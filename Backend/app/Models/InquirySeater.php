<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InquirySeater extends Model
{
    protected $fillable = [
        'room_id',
        'inquiry_id',
        'capacity'
    ];
}
