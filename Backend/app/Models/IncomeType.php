<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Income;

class IncomeType extends Model
{
    protected $fillable = [
        'title',
        'description',
    ];
    
    public function incomes()
    {
        return $this->hasMany(Income::class);
    }
}
