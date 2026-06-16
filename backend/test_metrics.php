<?php

$u = App\Models\User::where('email', 'ana@sanitas.com')->first();
$req = request();
$req->setUserResolver(function() use ($u) { return $u; });
try {
    $res = app(App\Http\Controllers\DashboardController::class)->metrics($req);
    echo $res->getContent() . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
