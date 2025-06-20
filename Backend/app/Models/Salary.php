<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    protected $fillable = [
        'staff_id',
        'amount',
        'month',
        'year',
        'status',
    ];
}
