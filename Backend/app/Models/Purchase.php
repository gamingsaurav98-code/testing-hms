<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Expense;

class Purchase extends Model
{
    protected $fillable = [
        'expense_id',
        'item_name',
        'item_quantity',
        'item_price',
        'item_unit_price',
        'purchase_date',
        'total_amount',
    ];
    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }
}
