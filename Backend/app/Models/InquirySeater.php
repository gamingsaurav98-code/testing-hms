<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Room;
use App\Models\Inquiry;
use App\Models\Block;

class InquirySeater extends Model
{
    protected $fillable = [
        'inquiry_id',
        'seater_type',
        'notes'
    ];

    /**
     * Get the inquiry that this seater preference belongs to
     */
    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class);
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
            default => 'Unknown'
        };
    }
}
