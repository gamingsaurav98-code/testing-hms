<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Student;
use App\Models\IncomeType;
use App\Models\PaymentType;

class Income extends Model
{
    protected $fillable = [
        'income_type_id',
        'amount',
        'income_date',
        'title',
        'description',
        'student_id',
        'income_attachment',
        'payment_type_id',
        'received_amount',
        'due_amount',
    ];
    
    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($income) {
            
            // Ensure amount is positive
            if ($income->amount <= 0) {
                throw new \Exception('Income amount must be greater than zero.');
            }
            
            // Calculate due amount if not provided
            if ($income->received_amount !== null && $income->due_amount === null) {
                $income->due_amount = max(0, $income->amount - $income->received_amount);
            }
        });
    }
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function incomeType()
    {
        return $this->belongsTo(IncomeType::class);
    }
    

    
    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
    
    /**
     * Get the status of the income (received, partially received, pending)
     *
     * @return string
     */
    public function getPaymentStatusAttribute()
    {
        if ($this->due_amount <= 0) {
            return 'received';
        } elseif ($this->received_amount > 0) {
            return 'partially_received';
        } else {
            return 'pending';
        }
    }
    
    /**
     * Scope a query to only include incomes for a specific date range
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $startDate
     * @param  string  $endDate
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDateRange(Builder $query, $startDate, $endDate)
    {
        return $query->whereBetween('income_date', [$startDate, $endDate]);
    }
    
    /**
     * Scope a query to only include incomes for a specific income type
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  int  $incomeTypeId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByType(Builder $query, $incomeTypeId)
    {
        return $query->where('income_type_id', $incomeTypeId);
    }
}
