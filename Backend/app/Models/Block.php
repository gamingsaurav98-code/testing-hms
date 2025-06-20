<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Block extends Model
{
    protected $fillable = [
        'block_name',
        'location',
        'manager_name',
        'manager_contact',
        'remarks',
        'room_id',
        'block_attachment',
        'floor_id',
    ];
}
