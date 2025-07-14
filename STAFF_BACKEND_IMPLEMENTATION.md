# Staff Management Backend Implementation

This document provides a comprehensive overview of the staff management backend implementation, following the same patterns and structure as the student management system.

## Overview

The staff management backend has been completely implemented with full CRUD operations, amenities management, financial tracking, check-in/check-out functionality, and comprehensive validation - mirroring the student section's functionality.

## Components Implemented

### 1. Models

#### Staff Model (`app/Models/Staff.php`)
- **Location**: `Backend/app/Models/Staff.php`
- **Features**:
  - Complete fillable fields including personal, professional, and family information
  - Relationships with salaries, amenities, financials, check-ins, attachments
  - Scopes for active staff, department filtering, position filtering
  - Boolean field parsing for frontend compatibility

#### StaffAmenities Model (`app/Models/StaffAmenities.php`)
- **Location**: `Backend/app/Models/StaffAmenities.php`
- **Features**:
  - Staff-specific amenities (WiFi, uniform, meals, parking, etc.)
  - Cascade deletion when staff is removed

### 2. Controllers

#### StaffController (`app/Http/Controllers/StaffController.php`)
- **Location**: `Backend/app/Http/Controllers/StaffController.php`
- **Features**:
  - Full CRUD operations (Create, Read, Update, Delete)
  - Advanced filtering (active status, department, position, search)
  - File upload handling (staff image, citizenship, contract)
  - Amenities management (add, update, remove)
  - Comprehensive validation
  - API metadata for frontend integration
  - Pagination and bulk retrieval

#### StaffFinancialController (`app/Http/Controllers/StaffFinancialController.php`)
- **Location**: `Backend/app/Http/Controllers/StaffFinancialController.php`
- **Features**:
  - Financial record management
  - Payment tracking
  - Staff-specific financial history
  - Integration with payment types

#### StaffCheckInCheckOutController (`app/Http/Controllers/StaffCheckInCheckOutController.php`)
- **Location**: `Backend/app/Http/Controllers/StaffCheckInCheckOutController.php`
- **Features**:
  - Daily attendance tracking
  - Check-in/check-out management
  - Approval workflow for checkout requests
  - Today's attendance reports
  - Block-wise filtering

### 3. Database Migrations

#### Staff Table Migration
- **File**: `database/migrations/2025_06_20_055417_create_staff_table.php`
- **Additional Fields Migration**: `database/migrations/2025_07_14_100001_add_fields_to_staff_table.php`
- **New Fields Added**:
  - `is_active` (boolean, default true)
  - `position` (string, nullable)
  - `department` (string, nullable)
  - `joining_date` (date, nullable)
  - `salary_amount` (string, nullable)
  - `employment_type` (enum: full-time, part-time, contract, intern)
  - `declaration_agreed` (boolean, default false)
  - `contract_agreed` (boolean, default false)

#### Staff Amenities Table Migration
- **File**: `database/migrations/2025_07_14_100000_create_staff_amenities_table.php`
- **Structure**:
  - `id` (primary key)
  - `staff_id` (foreign key to staff table)
  - `name` (string)
  - `description` (text, nullable)
  - `timestamps`

### 4. API Routes

All routes follow RESTful conventions and are registered in `routes/api.php`:

#### Basic Staff Management
```php
Route::apiResource('staff', StaffController::class);
Route::get('staff/fields/metadata', [StaffController::class, 'getFields']);
```

#### Staff Financial Management
```php
Route::apiResource('staff-financials', StaffFinancialController::class);
Route::get('staff-financials/fields/metadata', [StaffFinancialController::class, 'getFields']);
Route::get('staff/{id}/financials', [StaffFinancialController::class, 'getStaffFinancials']);
```

#### Staff Check-in/Check-out
```php
Route::apiResource('staff-checkincheckouts', StaffCheckInCheckOutController::class);
Route::post('staff-checkincheckouts/checkin', [StaffCheckInCheckOutController::class, 'checkIn']);
Route::post('staff-checkincheckouts/checkout', [StaffCheckInCheckOutController::class, 'checkOut']);
Route::get('staff-checkincheckouts/today/attendance', [StaffCheckInCheckOutController::class, 'getTodayAttendance']);
Route::post('staff-checkincheckouts/{id}/approve-checkout', [StaffCheckInCheckOutController::class, 'approveCheckout']);
Route::post('staff-checkincheckouts/{id}/decline-checkout', [StaffCheckInCheckOutController::class, 'declineCheckout']);
```

### 5. Seeders

#### CompleteStaffSeeder (`database/seeders/CompleteStaffSeeder.php`)
- **Location**: `Backend/database/seeders/CompleteStaffSeeder.php`
- **Features**:
  - Creates 20 sample staff members
  - Realistic Nepali names and data
  - Various positions and departments
  - Random amenities assignment (2-5 per staff)
  - Complete family and personal information
  - Different employment types and salary ranges

## API Endpoints Documentation

### Staff Management Endpoints

#### GET /api/staff
- **Purpose**: List all staff with filtering options
- **Parameters**:
  - `search` - Search in name, staff_id, email, contact, position, department
  - `active` - Filter by active status (true/false)
  - `department` - Filter by department
  - `position` - Filter by position
  - `all=true` - Get all active staff without pagination
  - `per_page` - Items per page (default: 15)

#### POST /api/staff
- **Purpose**: Create new staff member
- **Required Fields**: `staff_name`, `date_of_birth`, `contact_number`, `email`
- **File Uploads**: `staff_image`, `staff_citizenship_image`, `staff_contract_image`
- **Amenities**: Array of amenity objects with `name` and `description`

#### GET /api/staff/{id}
- **Purpose**: Get specific staff details
- **Includes**: Salaries, amenities, attachments, financials

#### PUT/PATCH /api/staff/{id}
- **Purpose**: Update staff information
- **Features**: 
  - Amenities management (add/update/remove)
  - File replacement with old file deletion
  - Document removal tracking

#### DELETE /api/staff/{id}
- **Purpose**: Delete staff member
- **Features**: Cascades to amenities, cleans up files

### Staff Financial Endpoints

#### GET /api/staff-financials
- **Purpose**: List all staff financial records

#### POST /api/staff-financials
- **Purpose**: Create financial record for staff

#### GET /api/staff/{id}/financials
- **Purpose**: Get all financial records for specific staff

### Staff Check-in/Check-out Endpoints

#### POST /api/staff-checkincheckouts/checkin
- **Purpose**: Check-in a staff member
- **Required**: `staff_id`, `block_id`

#### POST /api/staff-checkincheckouts/checkout
- **Purpose**: Request checkout for staff member
- **Required**: `staff_id`

#### GET /api/staff-checkincheckouts/today/attendance
- **Purpose**: Get today's attendance records

#### POST /api/staff-checkincheckouts/{id}/approve-checkout
- **Purpose**: Approve a checkout request

#### POST /api/staff-checkincheckouts/{id}/decline-checkout
- **Purpose**: Decline a checkout request

## Key Features

### 1. Complete CRUD Operations
- Create, read, update, delete staff with comprehensive validation
- File upload handling for images and documents
- Soft deletion support with cleanup

### 2. Amenities Management
- Staff-specific amenities (uniform, parking, WiFi, etc.)
- Add, update, remove amenities during staff creation/editing
- Bulk removal tracking for frontend optimization

### 3. Advanced Filtering & Search
- Multi-field search across name, ID, email, contact, position, department
- Filter by active status, department, position
- Pagination with configurable page size

### 4. Financial Tracking
- Separate financial record management
- Payment type integration
- Staff-specific financial history

### 5. Attendance Management
- Daily check-in/check-out tracking
- Approval workflow for checkout requests
- Real-time attendance reports
- Block-wise filtering

### 6. Professional Data Management
- Position and department tracking
- Employment type categorization
- Salary amount tracking
- Joining date management

### 7. Relationship Management
- Full family information tracking
- Guardian details
- Contact information management
- Emergency contact support

## Validation Rules

### Staff Creation/Update
- **Required**: staff_name, date_of_birth, contact_number, email
- **Unique**: email (except during updates)
- **File Types**: Images only (jpg, jpeg, png) max 2MB
- **Employment Type**: Enum validation (full-time, part-time, contract, intern)
- **Food Preference**: Enum validation (vegetarian, non-vegetarian, egg-only)

### Amenities
- **Required**: name (when amenities array is provided)
- **Optional**: description
- **Max Length**: name (255), description (500)

### Financial Records
- **Required**: staff_id, amount, payment_date
- **Foreign Key**: staff_id must exist in staff table
- **Optional**: payment_type_id, remark

## Database Relationships

### Staff Model Relationships
- `hasMany` Salaries
- `hasMany` StaffAmenities
- `hasMany` StaffFinancials
- `hasMany` StaffCheckInCheckOut
- `hasMany` StaffCheckoutFinancials
- `hasMany` StaffCheckoutRules
- `hasMany` Attachments
- `hasMany` Notices
- `hasMany` Expenses
- `hasMany` Complains
- `belongsTo` User

## Migration Instructions

To implement this staff backend:

1. **Run Migrations** (if using Laravel artisan):
   ```bash
   php artisan migrate
   ```

2. **Seed Sample Data**:
   ```bash
   php artisan db:seed --class=CompleteStaffSeeder
   ```

3. **Clear Cache** (if needed):
   ```bash
   php artisan config:clear
   php artisan route:clear
   ```

## Frontend Integration Notes

### API Response Format
- All endpoints return JSON responses
- Success responses include data and optional pagination
- Error responses include error messages and validation details
- File URLs are returned as relative paths (use storage URL helper)

### Boolean Field Handling
- Boolean fields accept: true/false, "true"/"false", 1/0, "1"/"0"
- Frontend should handle checkbox values properly

### File Upload Handling
- Use FormData for multipart/form-data requests
- Support for multiple file types
- Old files automatically cleaned up on replacement

### Amenities Management
- Send amenities as array of objects: `[{name: "WiFi", description: "High-speed internet"}]`
- For updates, include amenity ID to update existing: `[{id: 1, name: "Updated WiFi"}]`
- Use `removedAmenityIds` array to specify amenities to delete

This implementation provides a complete, production-ready staff management backend that mirrors the student section's functionality while being specifically tailored for staff management needs.
