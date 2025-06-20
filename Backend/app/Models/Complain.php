<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complain extends Model
{
    protected $fillable = [
        'student_id',
        'staff_id',
        'title',
        'complain_attachment',
        'description',
        'status',
    ];
}
