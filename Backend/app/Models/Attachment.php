<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Student;
use App\Models\Staff;
use App\Models\Expense;
use App\Models\Inquiry;
use App\Models\Block;
use App\Models\Complain;
use App\Models\ShareHolder;
use App\Models\Supplier;
use App\Models\Notice;
use App\Models\Income;
use App\Models\Room;
use App\Models\Salary;
use App\Models\SalaryPayment;

class Attachment extends Model
{
    protected $fillable = [
        'name',
        'path',
        'type',
        'student_id',
        'staff_id',
        'expense_id',
        'inquiry_id',
        'block_id',
        'complain_id',
        'shareholder_id',
        'supplier_id',
        'notice_id',
        'income_id',
        'room_id',
        'salary_id',
        'salary_payment_id',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
    
    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }
    
    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class);
    }
    
    public function block()
    {
        return $this->belongsTo(Block::class);
    }
    
    public function complain()
    {
        return $this->belongsTo(Complain::class);
    }
    
    public function shareholder()
    {
        return $this->belongsTo(ShareHolder::class);
    }
    
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
    
    public function notice()
    {
        return $this->belongsTo(Notice::class);
    }
    
    public function income()
    {
        return $this->belongsTo(Income::class, 'income_id');
    }
    
    public function room()
    {
        return $this->belongsTo(Room::class);
    }
    
    public function salary()
    {
        return $this->belongsTo(Salary::class);
    }
    
    public function salaryPayment()
    {
        return $this->belongsTo(SalaryPayment::class, 'salary_payment_id');
    }
}
