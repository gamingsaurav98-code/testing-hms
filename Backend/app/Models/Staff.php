<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $fillable = [
        'staff_id',
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
    ];
}
