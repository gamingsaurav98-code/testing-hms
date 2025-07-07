<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\SupplierFinancial;
use App\Models\SupplierPayment;
use App\Models\SupplierTransaction;
use App\Models\Expense;
use App\Models\Attachment;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'email',
        'contact_number',
        'address',
        'description',
        'pan_number',
        'opening_balance',
        'balance_type',
    ];

    
    // Payment relationship removed as requested
    
    public function financials()
    {
        return $this->hasMany(SupplierFinancial::class);
    }

    public function supplierPayments()
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function transactions()
    {
        return $this->hasMany(SupplierTransaction::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
}
