<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentCheckInCheckOut extends Model
{
    protected $fillable = [
        'student_id',
        'requested_checkin_time',
        'requested_checkout_time',
        'checkin_time',
        'checkout_time',
        'date',
        'block_id',
        'remarks',
        'status',
    ];
}
