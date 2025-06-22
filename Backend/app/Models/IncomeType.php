<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IncomeType extends Model
{
    protected $fillable =[
        'title',
        'amount',
        'student_id',
    ];
}
