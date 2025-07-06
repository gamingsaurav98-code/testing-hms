<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\ComplainController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\IncomeTypeController;
use App\Http\Controllers\PaymentTypeController;
use App\Http\Controllers\StudentController;

Route::apiResource('blocks', BlockController::class);
Route::apiResource('complains', ComplainController::class);
Route::apiResource('rooms', RoomController::class);
Route::apiResource('incomes', IncomeController::class);
Route::apiResource('income-types', IncomeTypeController::class);
Route::apiResource('payment-types', PaymentTypeController::class);
Route::apiResource('students', StudentController::class);

Route::post('incomes/{id}/attachment', [IncomeController::class, 'uploadAttachment']);
Route::get('available-rooms', [RoomController::class, 'getAvailableRooms']);

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

