<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Income extends Model
{
    protected $fillable = [
        'income_type',
        'amount',
        'income_date',
        'title',
        'description',
        'student_id',
        'income_attachment', // e.g., file path or URL
    ];
}
