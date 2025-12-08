<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\ShareHolderFinance;
use App\Models\Attachment;

class ShareHolder extends Model
{
    protected $fillable =[
        'name',
        'email',
        'phone',
        'address',
        'father_name',
        'grandfather_name',
        'spouse_name',
        'share_percentage',
        'investment_amount',
        'shareholder_image_attachment',
        'joined_date',
        'remark',
        'is_active',
    ];
    // Share relationship removed as requested - ShareHolder includes share data
    
    // ShareTransaction relationship removed - ShareHolderFinance handles this
    
    public function finances()
    {
        return $this->hasMany(ShareHolderFinance::class);
    }
    
    public function attachments()
    {
        return $this->hasMany(Attachment::class, 'shareholder_id');
    }
}
