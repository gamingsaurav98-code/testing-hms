<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Hostel;
use App\Models\ExpenseCategory;
use App\Models\Student;
use App\Models\Staff;
use App\Models\Supplier;
use App\Models\PaymentType;
use App\Models\Purchase;
use App\Models\Attachment;
use App\Traits\BelongsToHostel;

class Expense extends Model
{
    use BelongsToHostel;
    
    protected $fillable = [
        'hostel_id',
        'expense_category_id',
        'expense_type',
        'amount',
        'expense_date',
        'title',
        'description',
        'student_id',
        'staff_id',
        'supplier_id',
        'expense_attachment',
        'payment_type_id',
        'paid_amount',
        'due_amount',
    ];

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($expense) {
            // If student is provided, ensure student's hostel matches expense hostel
            if ($expense->student_id && $expense->hostel_id) {
                $student = Student::find($expense->student_id);
                if ($student && $student->hostel_id != $expense->hostel_id) {
                    throw new \Exception('The selected student does not belong to the selected hostel.');
                }
            }
            
            // If staff is provided, ensure staff's hostel matches expense hostel
            if ($expense->staff_id && $expense->hostel_id) {
                $staff = Staff::find($expense->staff_id);
                if ($staff && $staff->hostel_id != $expense->hostel_id) {
                    throw new \Exception('The selected staff does not belong to the selected hostel.');
                }
            }
            
            // Ensure amount is positive
            if ($expense->amount <= 0) {
                throw new \Exception('Expense amount must be greater than zero.');
            }
            
            // Calculate due amount if not provided
            if ($expense->paid_amount !== null && $expense->due_amount === null) {
                $expense->due_amount = max(0, $expense->amount - $expense->paid_amount);
            }
        });
    }

    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
    }

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
    
    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }
    
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    /**
     * Get the status of the expense (paid, partially paid, unpaid)
     *
     * @return string
     */
    public function getPaymentStatusAttribute()
    {
        if ($this->due_amount <= 0) {
            return 'paid';
        } elseif ($this->paid_amount > 0) {
            return 'partially_paid';
        } else {
            return 'unpaid';
        }
    }
    
    /**
     * Scope a query to only include expenses for a specific date range
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $startDate
     * @param  string  $endDate
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDateRange(Builder $query, $startDate, $endDate)
    {
        return $query->whereBetween('expense_date', [$startDate, $endDate]);
    }
    
    /**
     * Scope a query to only include expenses for a specific expense category
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  int  $expenseCategoryId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCategory(Builder $query, $expenseCategoryId)
    {
        return $query->where('expense_category_id', $expenseCategoryId);
    }
}
