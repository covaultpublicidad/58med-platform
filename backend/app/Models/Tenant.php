<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'email', 
        'phone', 
        'address', 
        'subscription_plan', 
        'is_active',
        'rif',
        'social_media',
        'logo_url',
        'stamp_url'
    ];

    protected $casts = [
        'social_media' => 'array',
        'billing_enabled' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
