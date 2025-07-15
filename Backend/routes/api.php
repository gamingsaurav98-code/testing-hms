<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\ComplainController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\IncomeTypeController;
use App\Http\Controllers\PaymentTypeController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentFinancialController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierFinancialController;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\InquirySeaterController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StaffFinancialController;
use App\Http\Controllers\StaffCheckInCheckOutController;
use App\Http\Controllers\StudentCheckInCheckOutController;
use App\Http\Controllers\StudentCheckoutRuleController;
use App\Http\Controllers\StaffCheckoutRuleController;

Route::apiResource('blocks', BlockController::class);
Route::apiResource('complains', ComplainController::class);
Route::apiResource('rooms', RoomController::class);
Route::apiResource('incomes', IncomeController::class);
Route::apiResource('income-types', IncomeTypeController::class);
Route::apiResource('payment-types', PaymentTypeController::class);
Route::apiResource('students', StudentController::class);
Route::get('students/fields/metadata', [StudentController::class, 'getFields']);
Route::apiResource('student-financials', StudentFinancialController::class);
Route::get('student-financials/fields/metadata', [StudentFinancialController::class, 'getFields']);
Route::get('students/{id}/financials', [StudentFinancialController::class, 'getStudentFinancials']);
Route::apiResource('suppliers', SupplierController::class);
Route::apiResource('inquiries', InquiryController::class);
Route::apiResource('inquiry-seaters', InquirySeaterController::class);
Route::apiResource('expenses', ExpenseController::class);
Route::apiResource('expense-categories', ExpenseCategoryController::class);
Route::apiResource('salaries', SalaryController::class);
Route::apiResource('staff', StaffController::class);
Route::get('staff/fields/metadata', [StaffController::class, 'getFields']);
Route::apiResource('staff-financials', StaffFinancialController::class);
Route::get('staff-financials/fields/metadata', [StaffFinancialController::class, 'getFields']);
Route::get('staff/{id}/financials', [StaffFinancialController::class, 'getStaffFinancials']);

// Student Check-in/Check-out routes
Route::apiResource('student-checkincheckouts', StudentCheckInCheckOutController::class);
Route::post('student-checkincheckouts/checkin', [StudentCheckInCheckOutController::class, 'checkIn']);
Route::post('student-checkincheckouts/checkout', [StudentCheckInCheckOutController::class, 'checkOut']);
Route::get('student-checkincheckouts/today/attendance', [StudentCheckInCheckOutController::class, 'getTodayAttendance']);
Route::post('student-checkincheckouts/{id}/approve-checkout', [StudentCheckInCheckOutController::class, 'approveCheckout']);
Route::post('student-checkincheckouts/{id}/decline-checkout', [StudentCheckInCheckOutController::class, 'declineCheckout']);

// Student Checkout Rules routes
Route::apiResource('student-checkout-rules', StudentCheckoutRuleController::class);
Route::get('student-checkout-rules/student/{student_id}', [StudentCheckoutRuleController::class, 'getStudentRules']);
Route::post('student-checkout-rules/{id}/toggle-status', [StudentCheckoutRuleController::class, 'toggleStatus']);
Route::get('student-checkout-rules/preview/{student_id}', [StudentCheckoutRuleController::class, 'getRulePreview']);

// Staff Check-in/Check-out routes
Route::apiResource('staff-checkincheckouts', StaffCheckInCheckOutController::class);
Route::post('staff-checkincheckouts/checkin', [StaffCheckInCheckOutController::class, 'checkIn']);
Route::post('staff-checkincheckouts/checkout', [StaffCheckInCheckOutController::class, 'checkOut']);
Route::get('staff-checkincheckouts/today/attendance', [StaffCheckInCheckOutController::class, 'getTodayAttendance']);
Route::post('staff-checkincheckouts/{id}/approve-checkout', [StaffCheckInCheckOutController::class, 'approveCheckout']);
Route::post('staff-checkincheckouts/{id}/decline-checkout', [StaffCheckInCheckOutController::class, 'declineCheckout']);

// Staff Checkout Rules routes
Route::apiResource('staff-checkout-rules', StaffCheckoutRuleController::class);
Route::get('staff-checkout-rules/staff/{staff_id}', [StaffCheckoutRuleController::class, 'getStaffRules']);
Route::post('staff-checkout-rules/{id}/toggle-status', [StaffCheckoutRuleController::class, 'toggleStatus']);
Route::get('staff-checkout-rules/preview/{staff_id}', [StaffCheckoutRuleController::class, 'getRulePreview']);

Route::post('incomes/{id}/attachment', [IncomeController::class, 'uploadAttachment']);
Route::post('suppliers/{id}/attachment', [SupplierController::class, 'uploadAttachment']);
Route::post('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'updateAttachment']);
Route::delete('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'deleteAttachment']);
Route::get('available-rooms', [RoomController::class, 'getAvailableRooms']);
Route::get('rooms/{id}/students', [RoomController::class, 'getStudentsByRoom']);
Route::apiResource('supplier-financials', SupplierFinancialController::class);
Route::get('suppliers/{id}/financials', [SupplierFinancialController::class, 'getFinancialsBySupplier']);

// Expense routes
Route::get('expenses/category/{categoryId}', [ExpenseController::class, 'getExpensesByCategory']);
Route::get('expenses/date-range', [ExpenseController::class, 'getExpensesByDateRange']);
Route::post('expenses/{id}/attachment', [ExpenseController::class, 'uploadAttachment']);
Route::delete('expenses/{expenseId}/attachments/{attachmentId}', [ExpenseController::class, 'deleteAttachment']);

// Salary routes
Route::get('staff/{staffId}/salaries', [SalaryController::class, 'getStaffSalaries']);
Route::get('salaries/statistics', [SalaryController::class, 'getSalaryStatistics']);

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

// Chat routes for complaint communication
Route::prefix('chats')->group(function () {
    Route::get('/complaint/{complainId}', [App\Http\Controllers\ChatController::class, 'getComplaintChats']);
    Route::post('/send', [App\Http\Controllers\ChatController::class, 'sendMessage']);
    Route::put('/{chatId}/edit', [App\Http\Controllers\ChatController::class, 'editMessage']);
    Route::delete('/{chatId}', [App\Http\Controllers\ChatController::class, 'deleteMessage']);
    Route::post('/mark-read', [App\Http\Controllers\ChatController::class, 'markAsRead']);
    Route::get('/unread-count', [App\Http\Controllers\ChatController::class, 'getUnreadCount']);
});

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

