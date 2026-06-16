<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 
        'date_of_birth', 
        'gender', 
        'blood_type', 
        'height', 
        'weight', 
        'allergies', 
        'medical_history',
        'address',
        'emergency_contact_name',
        'emergency_contact_relation',
        'emergency_contact_phone',
        'preexisting_conditions'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
