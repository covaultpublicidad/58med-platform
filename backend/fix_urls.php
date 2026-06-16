<?php
use App\Models\User;
use App\Models\Tenant;

User::all()->each(function($u){
    $u->profile_photo_url = str_replace('http://localhost:8000http://localhost:8000', 'http://localhost:8000', $u->profile_photo_url);
    $u->cover_photo_url = str_replace('http://localhost:8000http://localhost:8000', 'http://localhost:8000', $u->cover_photo_url);
    $u->signature_url = str_replace('http://localhost:8000http://localhost:8000', 'http://localhost:8000', $u->signature_url);
    $u->save();
});

Tenant::all()->each(function($t){
    $t->logo_url = str_replace('http://localhost:8000http://localhost:8000', 'http://localhost:8000', $t->logo_url);
    $t->stamp_url = str_replace('http://localhost:8000http://localhost:8000', 'http://localhost:8000', $t->stamp_url);
    $t->save();
});
