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
    
    /**
     * Get the room that owns the block.
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }
    
    /**
     * Get the floor that owns the block.
     */
    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }
}
