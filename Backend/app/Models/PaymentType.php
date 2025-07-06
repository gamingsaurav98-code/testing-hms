<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\StudentFinancial;
use App\Models\StaffFinancial;
use App\Models\SalaryPayment;
use App\Models\ShareHolderFinance;
use App\Models\Expense;
use App\Models\SupplierFinancial;
use App\Models\SupplierPayment;
use App\Models\StaffSalaryGenerate;

class PaymentType extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active'
    ];

    
    // Payment relationship removed as requested

    public function studentFinancials()
    {
        return $this->hasMany(StudentFinancial::class);
    }

    public function staffFinancials()
    {
        return $this->hasMany(StaffFinancial::class);
    }

    public function salaryPayments()
    {
        return $this->hasMany(SalaryPayment::class);
    }

    public function shareHolderFinances()
    {
        return $this->hasMany(ShareHolderFinance::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function supplierFinancials()
    {
        return $this->hasMany(SupplierFinancial::class);
    }

    public function supplierPayments()
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function staffSalaryGenerates()
    {
        return $this->hasMany(StaffSalaryGenerate::class);
    }
}
