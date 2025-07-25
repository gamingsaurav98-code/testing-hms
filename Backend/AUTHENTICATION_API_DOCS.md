# Laravel Sanctum Authentication API Documentation

## Overview
This document describes the authentication system for the HMS (Hotel Management System) Laravel API using Laravel Sanctum for API token authentication.

## Base URL
```
http://localhost:8000/api
```

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

Login a user and receive an API token.

#### Request Body
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

#### Success Response (200)
```json
{
    "status": "success",
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "user@example.com",
            "role": "admin",
            "user_type_id": null,
            "is_active": true,
            "email_verified_at": null,
            "created_at": "2025-07-25T10:00:00.000000Z",
            "updated_at": "2025-07-25T10:00:00.000000Z",
            "profile": {
                "admin_level": "super_admin",
                "permissions": ["full_access"]
            }
        },
        "token": "1|abcd1234...",
        "token_type": "Bearer"
    }
}
```

#### Error Response (401)
```json
{
    "status": "error",
    "message": "Authentication failed",
    "errors": {
        "email": ["The provided credentials are incorrect."]
    }
}
```

### 2. Register
**POST** `/auth/register`

Register a new user (Admin only).

#### Request Body
```json
{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "password_confirmation": "Password123!",
    "role": "student",
    "user_type_id": 1
}
```

#### Success Response (201)
```json
{
    "status": "success",
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": 2,
            "name": "Jane Doe",
            "email": "jane@example.com",
            "role": "student",
            "user_type_id": 1,
            "is_active": true,
            "created_at": "2025-07-25T10:00:00.000000Z",
            "updated_at": "2025-07-25T10:00:00.000000Z"
        }
    }
}
```

### 3. Get Current User
**GET** `/auth/me`

Get the current authenticated user's information.

#### Headers
```
Authorization: Bearer {token}
```

#### Success Response (200)
```json
{
    "status": "success",
    "data": {
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "user@example.com",
            "role": "admin",
            "user_type_id": null,
            "is_active": true,
            "profile": {
                "admin_level": "super_admin",
                "permissions": ["full_access"]
            }
        },
        "permissions": {
            "can_manage_users": true,
            "can_manage_students": true,
            "can_manage_staff": true,
            "can_manage_finances": true,
            "can_view_reports": true
        }
    }
}
```

### 4. Logout
**POST** `/auth/logout`

Logout the current user and revoke the current token.

#### Headers
```
Authorization: Bearer {token}
```

#### Success Response (200)
```json
{
    "status": "success",
    "message": "Logged out successfully"
}
```

### 5. Logout from All Devices
**POST** `/auth/logout-all`

Logout the user from all devices by revoking all tokens.

#### Headers
```
Authorization: Bearer {token}
```

#### Success Response (200)
```json
{
    "status": "success",
    "message": "Logged out from all devices successfully"
}
```

### 6. Change Password
**POST** `/auth/change-password`

Change the current user's password.

#### Headers
```
Authorization: Bearer {token}
```

#### Request Body
```json
{
    "current_password": "oldpassword123",
    "new_password": "NewPassword123!",
    "new_password_confirmation": "NewPassword123!"
}
```

#### Success Response (200)
```json
{
    "status": "success",
    "message": "Password changed successfully"
}
```

### 7. Refresh Token
**POST** `/auth/refresh-token`

Refresh the current API token.

#### Headers
```
Authorization: Bearer {token}
```

#### Success Response (200)
```json
{
    "status": "success",
    "message": "Token refreshed successfully",
    "data": {
        "token": "2|efgh5678...",
        "token_type": "Bearer"
    }
}
```

### 8. Check Permission
**POST** `/auth/check-permission`

Check if the current user has a specific permission.

#### Headers
```
Authorization: Bearer {token}
```

#### Request Body
```json
{
    "permission": "can_manage_users"
}
```

#### Success Response (200)
```json
{
    "status": "success",
    "data": {
        "has_permission": true,
        "permission": "can_manage_users",
        "user_role": "admin"
    }
}
```

### 9. Get Active Sessions
**GET** `/auth/active-sessions`

Get all active sessions/tokens for the current user.

#### Headers
```
Authorization: Bearer {token}
```

#### Success Response (200)
```json
{
    "status": "success",
    "data": {
        "active_sessions": [
            {
                "id": 1,
                "name": "auth_token",
                "abilities": ["admin:read", "admin:write"],
                "last_used_at": "2025-07-25T10:00:00.000000Z",
                "created_at": "2025-07-25T09:00:00.000000Z",
                "expires_at": null
            }
        ],
        "total_sessions": 1
    }
}
```

## User Roles and Permissions

### Admin Role
- Full access to all endpoints
- Can manage users, students, staff
- Can access financial data and reports
- Can manage system settings

### Student Role
- Can view and update own profile
- Can check-in/check-out
- Can view own financial records
- Can create and view own complaints
- Can view notices

### Staff Role
- Can view and update own profile
- Can check-in/check-out
- Can view own financial records
- Can view notices

## Token Abilities

Tokens are created with specific abilities based on user roles:

### Admin Abilities
- `admin:read`, `admin:write`, `admin:delete`
- `users:read`, `users:write`, `users:delete`
- `students:read`, `students:write`, `students:delete`
- `staff:read`, `staff:write`, `staff:delete`
- `finances:read`, `finances:write`, `finances:delete`
- `notices:read`, `notices:write`, `notices:delete`
- `complaints:read`, `complaints:write`, `complaints:delete`
- `reports:read`

### Student Abilities
- `student:read`, `student:write`
- `student:profile`, `student:attendance`
- `student:finances`, `student:complaints`
- `student:notices`, `student:checkout`

### Staff Abilities
- `staff:read`, `staff:write`
- `staff:profile`, `staff:attendance`
- `staff:finances`, `staff:notices`
- `staff:checkout`

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHENTICATED` | No valid token provided |
| `ACCOUNT_DEACTIVATED` | User account is disabled |
| `INSUFFICIENT_ROLE` | User doesn't have required role |
| `VALIDATION_ERROR` | Request validation failed |
| `INVALID_CREDENTIALS` | Login credentials are incorrect |

## Example Usage

### JavaScript/Fetch
```javascript
// Login
const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
    })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// Make authenticated request
const userResponse = await fetch('http://localhost:8000/api/auth/me', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    }
});
```

### cURL
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Get current user
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer 1|abcd1234..." \
  -H "Accept: application/json"
```

## Security Considerations

1. **Token Storage**: Store tokens securely (e.g., httpOnly cookies or secure storage)
2. **Token Rotation**: Implement token refresh for long-lived applications
3. **Rate Limiting**: Implement rate limiting on authentication endpoints
4. **HTTPS**: Always use HTTPS in production
5. **Token Expiration**: Configure appropriate token expiration times
6. **Password Policy**: Enforce strong password requirements
