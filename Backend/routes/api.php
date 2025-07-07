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
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierFinancialController;

Route::apiResource('blocks', BlockController::class);
Route::apiResource('complains', ComplainController::class);
Route::apiResource('rooms', RoomController::class);
Route::apiResource('incomes', IncomeController::class);
Route::apiResource('income-types', IncomeTypeController::class);
Route::apiResource('payment-types', PaymentTypeController::class);
Route::apiResource('students', StudentController::class);
Route::apiResource('suppliers', SupplierController::class);

Route::post('incomes/{id}/attachment', [IncomeController::class, 'uploadAttachment']);
Route::post('suppliers/{id}/attachment', [SupplierController::class, 'uploadAttachment']);
Route::post('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'updateAttachment']);
Route::delete('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'deleteAttachment']);
Route::get('available-rooms', [RoomController::class, 'getAvailableRooms']);
Route::get('rooms/{id}/students', [RoomController::class, 'getStudentsByRoom']);
Route::apiResource('supplier-financials', SupplierFinancialController::class);
Route::get('suppliers/{id}/financials', [SupplierFinancialController::class, 'getFinancialsBySupplier']);

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

