<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientConsent extends Model
{
    protected $fillable = [
        'patient_id',
        'granted_to_tenant_id',
        'granted_by_tenant_id',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function grantedToTenant()
    {
        return $this->belongsTo(Tenant::class, 'granted_to_tenant_id');
    }

    public function grantedByTenant()
    {
        return $this->belongsTo(Tenant::class, 'granted_by_tenant_id');
    }
}
