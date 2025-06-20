<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'expense_type',
        'amount',
        'expense_date',
        'title',
        'description',
        'student_id',
        'staff_id',
        'expense_attachment',
        'payment_status',
        'payment_method',
    ];
}
