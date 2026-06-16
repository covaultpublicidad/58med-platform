<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$c = new \App\Http\Controllers\DashboardController();
$r = request();
$r->setUserResolver(function() { return \App\Models\User::find(1); });
try {
    echo $c->metrics($r)->getContent();
} catch (\Throwable $e) {
    echo $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine();
}
