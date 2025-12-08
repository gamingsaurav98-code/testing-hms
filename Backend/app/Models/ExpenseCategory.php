<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Expense;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];
    

    
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
