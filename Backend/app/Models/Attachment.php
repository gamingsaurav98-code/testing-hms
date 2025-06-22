<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    protected $fillable = [
        'name',
        'path',
        'type',
        'student_id',
        'staff_id',
        'expense_id',
        'inquiry_id',
        'block_id',
        'complain_id',
        'shareholder_id',
        
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
