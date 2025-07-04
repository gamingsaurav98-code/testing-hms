<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\ComplainController;
use App\Http\Controllers\HostelController;
use App\Http\Controllers\RoomController;

Route::apiResource('blocks', BlockController::class);
Route::apiResource('complains', ComplainController::class);
Route::apiResource('hostels', HostelController::class);
Route::apiResource('rooms', RoomController::class);
Route::get('available-rooms', [RoomController::class, 'getAvailableRooms']);

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

