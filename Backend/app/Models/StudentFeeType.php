<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\StudentFeeGenerate;

class StudentFeeType extends Model
{
    protected $fillable = [
        'fee_type',
        'amount',
        'is_active'
    ];
    
    public function studentFeeGenerates()
    {
        return $this->hasMany(StudentFeeGenerate::class, 'fee_type');
    }
    
    // Removed self-referencing relationship as it's unusual
    // for a model to have a relationship with itself unless it's hierarchical
}
