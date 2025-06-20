<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'block_id',
        'capacity',
        'status',
        'room_type',
        'floor_number',
        'room_attachment',
    ];
}
