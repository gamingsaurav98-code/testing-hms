<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Block;
use App\Models\InquirySeater;
use App\Models\Attachment;
use App\Models\Staff;

class Inquiry extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'seater_type',
        'staff_id'
    ];

    protected $casts = [
        'seater_type' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Always include timestamps in JSON
    protected $visible = [
        'id',
        'name',
        'email',
        'phone',
        'seater_type',
        'staff_id',
        'staff',
        'created_at',
        'updated_at'
    ];

    // Append relationships to JSON
    protected $with = ['staff'];

    /**
     * Get the staff who created this inquiry
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }

    /**
     * Get the human-readable seater type
     */
    public function getSeaterTypeTextAttribute()
    {
        return match($this->seater_type) {
            1 => 'Single Seater',
            2 => 'Double Seater',
            3 => 'Triple Seater',
            4 => 'Four Seater',
            default => $this->seater_type . ' Seater'
        };
    }
}
