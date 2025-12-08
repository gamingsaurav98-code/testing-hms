<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Staff;
use App\Models\Attachment;

class Salary extends Model
{
    // Prevent automatic loading of relationships to improve performance
    protected $with = [];

    protected $fillable = [
        'staff_id',
        'amount',
        'month',
        'year',
        'description',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'month' => 'integer',
        'year' => 'integer',
    ];

    // Remove appends to improve performance - compute these on demand instead
    // protected $appends = ['month_name', 'formatted_amount'];

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    /**
     * Get the month name attribute
     */
    public function getMonthNameAttribute()
    {
        $months = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        return $months[$this->month] ?? '';
    }

    /**
     * Get the formatted amount attribute
     */
    public function getFormattedAmountAttribute()
    {
        return number_format($this->amount, 2);
    }

    /**
     * Scope to filter by month
     */
    public function scopeByMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    /**
     * Scope to filter by year
     */
    public function scopeByYear($query, $year)
    {
        return $query->where('year', $year);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by staff
     */
    public function scopeByStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }
}
