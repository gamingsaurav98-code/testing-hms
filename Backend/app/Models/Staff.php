<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use App\Models\User;
use App\Models\Salary;
use App\Models\SalaryPayment;
use App\Models\StaffCheckInCheckOut;
use App\Models\StaffFinancial;
use App\Models\StaffSalaryGenerate;
use App\Models\StaffCheckoutFinancial;
use App\Models\StaffCheckoutRule;
use App\Models\Notice;
use App\Models\Expense;
use App\Models\Complain;
use App\Models\Attachment;
use App\Models\StaffAmenities;

class Staff extends Model
{
    protected $fillable = [
        'staff_id',
        'user_id',
        'staff_name',
        'date_of_birth',
        'contact_number',
        'email',
        'district',
        'city_name',
        'ward_no',
        'street_name',
        'citizenship_no',
        'date_of_issue',
        'citizenship_issued_district',
        'educational_institution',
        'level_of_study',
        'blood_group',
        'food',
        'disease',
        'father_name',
        'father_contact',
        'father_occupation',
        'mother_name',
        'mother_contact',
        'mother_occupation',
        'spouse_name',
        'spouse_contact',
        'spouse_occupation',
        'local_guardian_name',
        'local_guardian_contact',
        'local_guardian_occupation',
        'local_guardian_relation',
        'local_guardian_address',
        'verified_by',
        'verified_on',
        'staff_contract_image',
        'staff_image',
        'staff_citizenship_image',
        'is_active',
        'position',
        'department',
        'joining_date',
        'salary_amount',
        'employment_type',
        'declaration_agreed',
        'contract_agreed',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    

    
    public function salaries()
    {
        return $this->hasMany(Salary::class);
    }
    
    public function salaryPayments()
    {
        return $this->hasMany(SalaryPayment::class);
    }
    
    public function checkInCheckOuts()
    {
        return $this->hasMany(StaffCheckInCheckOut::class);
    }
    
    public function financials()
    {
        return $this->hasMany(StaffFinancial::class);
    }
    
    public function salaryGenerates()
    {
        return $this->hasMany(StaffSalaryGenerate::class);
    }
    
    public function checkoutFinancials()
    {
        return $this->hasMany(StaffCheckoutFinancial::class);
    }
    
    public function checkoutRules()
    {
        return $this->hasMany(StaffCheckoutRule::class);
    }
    
    public function notices()
    {
        return $this->hasMany(Notice::class);
    }
    
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
    
    public function complains()
    {
        return $this->hasMany(Complain::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }
    
    public function amenities()
    {
        return $this->hasMany(StaffAmenities::class);
    }
    
    /**
     * Scope a query to only include active staff
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive(Builder $query)
    {
        return $query->where('is_active', true);
    }
    
    /**
     * Scope a query to filter by department
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $department
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByDepartment(Builder $query, $department)
    {
        return $query->where('department', $department);
    }
    
    /**
     * Scope a query to filter by position
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $position
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByPosition(Builder $query, $position)
    {
        return $query->where('position', $position);
    }
}
