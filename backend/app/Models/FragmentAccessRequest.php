<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FragmentAccessRequest extends Model
{
    protected $fillable = [
        'patient_id',
        'requester_doctor_id',
        'owner_doctor_id',
        'patient_approved',
        'doctor_approved',
        'status'
    ];

    protected $casts = [
        'patient_approved' => 'boolean',
        'doctor_approved' => 'boolean',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_doctor_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_doctor_id');
    }
}
