<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// A simple named login route to satisfy redirects from the auth middleware.
// This avoids "Route [login] not defined" errors for unauthenticated
// requests that try to redirect guests. For API calls, callers should
// prefer sending Accept: application/json so Laravel returns a 401 JSON
// response instead of redirecting.
Route::get('/login', function () {
    // For now redirect back to the app home (frontend) or show a simple message.
    return redirect(config('app.url'));
})->name('login');
