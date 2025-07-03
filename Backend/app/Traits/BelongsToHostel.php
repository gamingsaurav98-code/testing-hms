<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToHostel
{
    /**
     * Scope a query to only include records for a specific hostel.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  int|null  $hostelId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForHostel(Builder $query, $hostelId = null)
    {
        $hostelId = $hostelId ?: session('current_hostel_id');
        
        if ($hostelId) {
            return $query->where('hostel_id', $hostelId);
        }
        
        return $query;
    }
    
    /**
     * Ensure the hostel_id field is consistent when saving.
     * This helps maintain data integrity across relations.
     *
     * @return void
     */
    protected static function bootBelongsToHostel()
    {
        static::saving(function ($model) {
            // If we have a current hostel in session and no hostel_id is set
            if (!$model->hostel_id && session()->has('current_hostel_id')) {
                $model->hostel_id = session('current_hostel_id');
            }
            
            // Example: Room gets hostel_id from its block
            if (property_exists($model, 'block_id') && $model->block_id && 
                (empty($model->hostel_id) || $model->isDirty('block_id'))) {
                $block = \App\Models\Block::find($model->block_id);
                if ($block) {
                    $model->hostel_id = $block->hostel_id;
                }
            }
            
            // Example: Student gets hostel_id from its room
            if (property_exists($model, 'room_id') && $model->room_id && 
                (empty($model->hostel_id) || $model->isDirty('room_id'))) {
                $room = \App\Models\Room::find($model->room_id);
                if ($room) {
                    $model->hostel_id = $room->hostel_id;
                }
            }
        });
        
        // You could add global scopes here if you want automatic filtering
        // but it's often better to use the scopeForHostel method explicitly
    }
}
