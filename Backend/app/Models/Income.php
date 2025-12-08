<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Student;
use App\Models\IncomeType;
use App\Models\PaymentType;
use App\Services\ImageService;
use App\Services\DateService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

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
        'payment_status',
    ];
    
    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['payment_status'];
    
    /**
     * The directory where income attachments are stored
     *
     * @var string
     */
    protected $attachmentDirectory = 'incomes';
    
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
            
            // Format income_date to store only the date part using DateService
            if ($income->income_date) {
                try {
                    $dateService = app(DateService::class);
                    $income->income_date = $dateService->formatDate($income->income_date, 'Y-m-d');
                } catch (\Exception $e) {
                    Log::error('Error formatting income date: ' . $e->getMessage());
                }
            }
        });
    }
    
    /**
     * Handle the attachment upload
     *
     * @param UploadedFile $file
     * @return string|null
     */
    public function uploadAttachment(UploadedFile $file): ?string
    {
        $imageService = app(ImageService::class);
        $oldPath = $this->income_attachment;
        
        $path = $imageService->processImage($file, $this->attachmentDirectory, $oldPath);
        
        if ($path) {
            $this->income_attachment = $path;
            $this->save();
        }
        
        return $path;
    }
    
    /**
     * Get the formatted income date (date only)
     *
     * @param string $value
     * @return string
     */
    public function getIncomeDateAttribute($value)
    {
        if (!$value) return null;
        
        try {
            $dateService = app(DateService::class);
            return $dateService->formatDate($value, 'Y-m-d');
        } catch (\Exception $e) {
            Log::error('Error getting formatted income date: ' . $e->getMessage());
            return $value;
        }
    }
    
    /**
     * Set the income date attribute (store as date only)
     *
     * @param string $value
     * @return void
     */
    public function setIncomeDateAttribute($value)
    {
        if (!$value) {
            $this->attributes['income_date'] = null;
            return;
        }
        
        try {
            $dateService = app(DateService::class);
            $this->attributes['income_date'] = $dateService->formatDate($value, 'Y-m-d');
        } catch (\Exception $e) {
            Log::error('Error setting income date: ' . $e->getMessage());
            $this->attributes['income_date'] = $value;
        }
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
     * Get the status of the income (paid or partial)
     *
     * @return string
     */
    public function getPaymentStatusAttribute()
    {
        if ($this->due_amount <= 0) {
            return 'paid';
        } else {
            return 'partial';
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
