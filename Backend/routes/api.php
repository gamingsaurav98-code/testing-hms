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
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\InquirySeaterController;

Route::apiResource('blocks', BlockController::class);
Route::apiResource('complains', ComplainController::class);
Route::apiResource('rooms', RoomController::class);
Route::apiResource('incomes', IncomeController::class);
Route::apiResource('income-types', IncomeTypeController::class);
Route::apiResource('payment-types', PaymentTypeController::class);
Route::apiResource('students', StudentController::class);
Route::apiResource('suppliers', SupplierController::class);
Route::apiResource('inquiries', InquiryController::class);
Route::apiResource('inquiry-seaters', InquirySeaterController::class);

Route::post('incomes/{id}/attachment', [IncomeController::class, 'uploadAttachment']);
Route::post('suppliers/{id}/attachment', [SupplierController::class, 'uploadAttachment']);
Route::post('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'updateAttachment']);
Route::delete('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'deleteAttachment']);
Route::get('available-rooms', [RoomController::class, 'getAvailableRooms']);
Route::get('rooms/{id}/students', [RoomController::class, 'getStudentsByRoom']);
Route::apiResource('supplier-financials', SupplierFinancialController::class);
Route::get('suppliers/{id}/financials', [SupplierFinancialController::class, 'getFinancialsBySupplier']);

// Notice routes
Route::apiResource('notices', NoticeController::class);
Route::delete('notices/{noticeId}/attachments/{attachmentId}', [NoticeController::class, 'deleteAttachment']);
Route::get('debug/notices/schema', [NoticeController::class, 'debug']);
Route::get('notices/target/{targetType}', [NoticeController::class, 'getNoticesByTargetType']);
Route::get('notices/student/{studentId}', [NoticeController::class, 'getNoticesForStudent']);
Route::get('notices/staff/{staffId}', [NoticeController::class, 'getNoticesForStaff']);
Route::get('notices/block/{blockId}', [NoticeController::class, 'getNoticesForBlock']);
Route::get('notices/user', [NoticeController::class, 'getNoticesForUser'])->middleware('auth:sanctum');

// Routes for fetching data for notice creation/editing
Route::get('notices-create/students', [NoticeController::class, 'getStudentsForNotice']);
Route::get('notices-create/staff', [NoticeController::class, 'getStaffForNotice']);
Route::get('notices-create/blocks', [NoticeController::class, 'getBlocksForNotice']);

// Inquiry routes
Route::delete('inquiries/{inquiryId}/attachments/{attachmentId}', [InquiryController::class, 'deleteAttachment']);
Route::get('inquiries/block/{blockId}', [InquiryController::class, 'getInquiriesByBlock']);

// Inquiry Seater routes
Route::get('inquiry-seaters/inquiry/{inquiryId}', [InquirySeaterController::class, 'getSeatersByInquiry']);
Route::get('inquiry-seaters/room/{roomId}', [InquirySeaterController::class, 'getSeatersByRoom']);

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

