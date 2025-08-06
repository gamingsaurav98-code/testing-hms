<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
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

// =============================================================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================================================

// Authentication routes
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']); // Admin only in practice
Route::post('auth/create-account', [AuthController::class, 'createAccount']); // Public account creation for pre-registered staff/students

// =============================================================================
// =============================================================================
// AUTHENTICATED ROUTES (Require Authentication)
// =============================================================================

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Authentication management
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/logout-all', [AuthController::class, 'logoutFromAllDevices']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('auth/refresh-token', [AuthController::class, 'refreshToken']);
    Route::post('auth/check-permission', [AuthController::class, 'checkPermission']);
    Route::get('auth/active-sessions', [AuthController::class, 'getActiveSessions']);
    
    // =============================================================================
    // STUDENT-ONLY ROUTES (Must come BEFORE admin routes to prevent conflicts)
    // =============================================================================
    
    Route::middleware(['role:student'])->group(function () {
        
        // Student profile and data (own data only)
        Route::get('student/profile', [StudentController::class, 'getMyProfile']);
        Route::put('student/profile', [StudentController::class, 'updateMyProfile']);
        
        // Student check-in/check-out (own records only)
        Route::post('student/checkin', [StudentCheckInCheckOutController::class, 'checkIn']);
        Route::post('student/checkout', [StudentCheckInCheckOutController::class, 'checkOut']);
        Route::get('student/checkincheckouts', [StudentCheckInCheckOutController::class, 'getMyRecords']);
        Route::get('student/today-attendance', [StudentCheckInCheckOutController::class, 'getMyTodayAttendance']);
        
        // Student financial records (own records only)
        Route::get('student/financials', [StudentFinancialController::class, 'getMyFinancials']);
        Route::get('student/payment-history', [StudentFinancialController::class, 'getMyPaymentHistory']);
        Route::get('student/outstanding-dues', [StudentFinancialController::class, 'getMyOutstandingDues']);
        
        // Student complaints (own complaints only)
        Route::get('student/complains', [ComplainController::class, 'getMyComplaints']);
        Route::post('student/complains', [ComplainController::class, 'createComplaint']);
        Route::get('student/complains/{id}', [ComplainController::class, 'getMyComplaint']);
        Route::put('student/complains/{id}', [ComplainController::class, 'updateMyComplaint']);
        
        // Student notices (notices targeted to student)
        Route::get('student/notices', [NoticeController::class, 'getMyNotices']);
        Route::get('student/notices/{id}', [NoticeController::class, 'getNotice']);
        
    });
    
    // =============================================================================
    // STAFF-ONLY ROUTES (Must come BEFORE admin routes to prevent conflicts)
    // =============================================================================
    
    Route::middleware(['role:staff'])->group(function () {
        
        // Staff profile and data (own data only)
        Route::get('my-staff/profile', [StaffController::class, 'getMyProfile']);
        Route::put('my-staff/profile', [StaffController::class, 'updateMyProfile']);
        
        // Staff check-in/check-out (own records only)
        Route::post('my-staff/checkin', [StaffCheckInCheckOutController::class, 'checkIn']);
        Route::post('my-staff/checkout', [StaffCheckInCheckOutController::class, 'checkOut']);
        Route::get('my-staff/my-checkincheckouts', [StaffCheckInCheckOutController::class, 'getMyRecords']);
        Route::get('my-staff/today-attendance', [StaffCheckInCheckOutController::class, 'getMyTodayAttendance']);
        
        // Staff financial records (own records only)
        Route::get('my-staff/financials', [StaffFinancialController::class, 'getMyFinancials']);
        Route::get('my-staff/salary-history', [StaffFinancialController::class, 'getMySalaryHistory']);
        
        // Staff complaints to admin (own complaints only)
        Route::get('my-staff/complaints-list', [ComplainController::class, 'getMyStaffComplaints']);
        Route::post('my-staff/complaints-create', [ComplainController::class, 'createStaffComplaint']);
        Route::get('my-staff/complaints-view/{id}', [ComplainController::class, 'getMyStaffComplaint']);
        Route::put('my-staff/complaints-update/{id}', [ComplainController::class, 'updateMyStaffComplaint']);
        
        // Staff notices (notices targeted to staff)
        Route::get('my-staff/notices', [NoticeController::class, 'getMyNotices']);
        Route::get('my-staff/notices/{id}', [NoticeController::class, 'getNotice']);
        
    });
    
    // =============================================================================
    // ADMIN-ONLY ROUTES (Must come AFTER specific user routes)
    // =============================================================================
    
    Route::middleware(['role:admin'])->group(function () {
        
        // Core Management
        Route::apiResource('blocks', BlockController::class);
        Route::apiResource('rooms', RoomController::class);
        Route::get('available-rooms', [RoomController::class, 'getAvailableRooms']);
        Route::get('rooms/{id}/students', [RoomController::class, 'getStudentsByRoom']);
        
        // User Management
        Route::apiResource('students', StudentController::class);
        Route::get('students/fields/metadata', [StudentController::class, 'getFields']);
        Route::apiResource('staff', StaffController::class);
        Route::get('staff/fields/metadata', [StaffController::class, 'getFields']);
        
        // Financial Management
        Route::apiResource('student-financials', StudentFinancialController::class);
        Route::get('student-financials/fields/metadata', [StudentFinancialController::class, 'getFields']);
        Route::get('students/{id}/financials', [StudentFinancialController::class, 'getStudentFinancials']);
        Route::apiResource('staff-financials', StaffFinancialController::class);
        Route::get('staff-financials/fields/metadata', [StaffFinancialController::class, 'getFields']);
        Route::get('staff/{id}/financials', [StaffFinancialController::class, 'getStaffFinancials']);
        Route::apiResource('incomes', IncomeController::class);
        Route::apiResource('income-types', IncomeTypeController::class);
        Route::apiResource('payment-types', PaymentTypeController::class);
        Route::post('incomes/{id}/attachment', [IncomeController::class, 'uploadAttachment']);
        
        // Supplier Management
        Route::apiResource('suppliers', SupplierController::class);
        Route::apiResource('supplier-financials', SupplierFinancialController::class);
        Route::get('suppliers/{id}/financials', [SupplierFinancialController::class, 'getFinancialsBySupplier']);
        Route::post('suppliers/{id}/attachment', [SupplierController::class, 'uploadAttachment']);
        Route::post('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'updateAttachment']);
        Route::delete('suppliers/{id}/attachment/{attachmentId}', [SupplierController::class, 'deleteAttachment']);
        
        // Expense Management
        Route::apiResource('expenses', ExpenseController::class);
        Route::apiResource('expense-categories', ExpenseCategoryController::class);
        Route::get('expenses/category/{categoryId}', [ExpenseController::class, 'getExpensesByCategory']);
        Route::get('expenses/date-range', [ExpenseController::class, 'getExpensesByDateRange']);
        Route::post('expenses/{id}/attachment', [ExpenseController::class, 'uploadAttachment']);
        Route::delete('expenses/{expenseId}/attachments/{attachmentId}', [ExpenseController::class, 'deleteAttachment']);
        
        // Salary Management
        Route::apiResource('salaries', SalaryController::class);
        Route::get('staff/{staffId}/salaries', [SalaryController::class, 'getStaffSalaries']);
        Route::get('salaries/statistics', [SalaryController::class, 'getSalaryStatistics']);
        
        // Admin Check-in/Check-out Management
        Route::apiResource('student-checkincheckouts', StudentCheckInCheckOutController::class);
        Route::post('student-checkincheckouts/{id}/approve-checkout', [StudentCheckInCheckOutController::class, 'approveCheckout']);
        Route::post('student-checkincheckouts/{id}/decline-checkout', [StudentCheckInCheckOutController::class, 'declineCheckout']);
        Route::get('student-checkincheckouts/today/attendance', [StudentCheckInCheckOutController::class, 'getTodayAttendance']);
        
        Route::apiResource('staff-checkincheckouts', StaffCheckInCheckOutController::class);
        Route::post('staff-checkincheckouts/{id}/approve-checkout', [StaffCheckInCheckOutController::class, 'approveCheckout']);
        Route::post('staff-checkincheckouts/{id}/decline-checkout', [StaffCheckInCheckOutController::class, 'declineCheckout']);
        Route::get('staff-checkincheckouts/today/attendance', [StaffCheckInCheckOutController::class, 'getTodayAttendance']);
        
        // Checkout Rules Management
        Route::apiResource('student-checkout-rules', StudentCheckoutRuleController::class);
        Route::get('student-checkout-rules/student/{student_id}', [StudentCheckoutRuleController::class, 'getStudentRules']);
        Route::post('student-checkout-rules/{id}/toggle-status', [StudentCheckoutRuleController::class, 'toggleStatus']);
        Route::get('student-checkout-rules/preview/{student_id}', [StudentCheckoutRuleController::class, 'getRulePreview']);
        
        Route::apiResource('staff-checkout-rules', StaffCheckoutRuleController::class);
        Route::get('staff-checkout-rules/staff/{staff_id}', [StaffCheckoutRuleController::class, 'getStaffRules']);
        Route::post('staff-checkout-rules/{id}/toggle-status', [StaffCheckoutRuleController::class, 'toggleStatus']);
        Route::get('staff-checkout-rules/preview/{staff_id}', [StaffCheckoutRuleController::class, 'getRulePreview']);
        
        // Notice Management (Admin - Full CRUD)
        Route::apiResource('notices', NoticeController::class);
        Route::delete('notices/{noticeId}/attachments/{attachmentId}', [NoticeController::class, 'deleteAttachment']);
        Route::get('debug/notices/schema', [NoticeController::class, 'debug']);
        Route::get('notices/target/{targetType}', [NoticeController::class, 'getNoticesByTargetType']);
        Route::get('notices/student/{studentId}', [NoticeController::class, 'getNoticesForStudent']);
        Route::get('notices/staff/{staffId}', [NoticeController::class, 'getNoticesForStaff']);
        Route::get('notices/block/{blockId}', [NoticeController::class, 'getNoticesForBlock']);
        Route::get('notices-create/students', [NoticeController::class, 'getStudentsForNotice']);
        Route::get('notices-create/staff', [NoticeController::class, 'getStaffForNotice']);
        Route::get('notices-create/blocks', [NoticeController::class, 'getBlocksForNotice']);
        
        // Complaint Management (Admin - Full Management)
        Route::apiResource('complains', ComplainController::class);
        
        // Inquiry Management
        Route::apiResource('inquiries', InquiryController::class);
        Route::apiResource('inquiry-seaters', InquirySeaterController::class);
        Route::delete('inquiries/{inquiryId}/attachments/{attachmentId}', [InquiryController::class, 'deleteAttachment']);
        Route::get('inquiries/block/{blockId}', [InquiryController::class, 'getInquiriesByBlock']);
        Route::get('inquiry-seaters/inquiry/{inquiryId}', [InquirySeaterController::class, 'getSeatersByInquiry']);
        Route::get('inquiry-seaters/room/{roomId}', [InquirySeaterController::class, 'getSeatersByRoom']);
        
    });
    
    // =============================================================================
    // SHARED AUTHENTICATED ROUTES (All authenticated users)
    // =============================================================================
    
    // Chat routes for complaint communication (accessible to all authenticated users)
    Route::prefix('chats')->group(function () {
        Route::get('/complaint/{complainId}', [ChatController::class, 'getComplaintChats']);
        Route::post('/send', [ChatController::class, 'sendMessage']);
        Route::put('/{chatId}/edit', [ChatController::class, 'editMessage']);
        Route::delete('/{chatId}', [ChatController::class, 'deleteMessage']);
        Route::post('/mark-read', [ChatController::class, 'markAsRead']);
        Route::get('/unread-count', [ChatController::class, 'getUnreadCount']);
    });
    
    // User notices (notices for authenticated user)
    Route::get('notices/user', [NoticeController::class, 'getNoticesForUser']);
    
});

// API Routes organized and cleaned - All duplicates removed

