<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Block;
use App\Models\Expense;
use App\Models\Student;
use App\Models\Staff;
use App\Models\Complain;
use App\Models\ExpenseCategory;
use App\Models\PaymentType;
use App\Models\Supplier;
use App\Models\Room;

class Hostel extends Model
{
    protected $fillable = [
        'name',
        'address',
        'email',
        'phone',
        'logo',
        'owner_name',
        'contact_person',
        'capacity',
        'pan_number',
    ];
    
    public function blocks()
    {
        return $this->hasMany(Block::class);
    }
    
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
    
    public function students()
    {
        return $this->hasMany(Student::class);
    }
    
    public function staff()
    {
        return $this->hasMany(Staff::class);
    }
    
    public function complaints()
    {
        return $this->hasMany(Complain::class);
    }
    
    public function expenseCategories()
    {
        return $this->hasMany(ExpenseCategory::class);
    }
    
    public function paymentTypes()
    {
        return $this->hasMany(PaymentType::class);
    }
    
    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }
    
    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
    
}
