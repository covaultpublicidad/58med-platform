<?php
use App\Models\User;
use App\Models\Tenant;

$users = User::whereNull('tenant_id')->whereHas('roles', function($q) {
    $q->where('name', 'Médico');
})->get();

foreach ($users as $u) {
    $tenant = Tenant::create([
        'name' => 'Consultorio de ' . $u->name,
        'subscription_plan' => 'independent',
        'is_active' => true,
    ]);
    $u->update(['tenant_id' => $tenant->id]);
}
echo "Tenants assigned to " . count($users) . " doctors.\n";
