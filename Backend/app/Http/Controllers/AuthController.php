<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\Student;
use App\Models\Staff;
use App\Services\AuthService;

class AuthController extends Controller
{
    protected $authService;
    
    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Login user and return token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $credentials = $request->only('user_id', 'password');
            $authData = $this->authService->authenticate($credentials);

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => $authData
            ]);
            
        } catch (ValidationException $e) {
            // Extract the actual error message from validation errors
            $errors = $e->errors();
            $errorMessage = 'Authentication failed';
            if (!empty($errors)) {
                // Get the first error message from the errors array
                $firstError = reset($errors);
                if (is_array($firstError) && !empty($firstError)) {
                    $errorMessage = $firstError[0];
                }
            }
            
            return response()->json([
                'status' => 'error',
                'message' => $errorMessage,
                'errors' => $errors
            ], 401);
        } catch (\Exception $e) {
            // Log details (non-sensitive) so we can inspect server-side cause of 500
            try {
                $userId = $request->input('user_id') ?? 'unknown';
                Log::error('AuthController::login exception', [
                    'user_id' => substr((string)$userId, 0, 64),
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            } catch (\Throwable $_) {
                // ignore any logging errors
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Login failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request)
    {
        try {
            $success = $this->authService->logout($request->user());
            
            if ($success) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Logged out successfully'
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Logout failed'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Logout failed',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Logout from all devices
     */
    public function logoutFromAllDevices(Request $request)
    {
        try {
            $success = $this->authService->logoutFromAllDevices($request->user());
            
            if ($success) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Logged out from all devices successfully'
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Logout from all devices failed'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Logout from all devices failed',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            // Don't include profile data for faster auth checks - profile can be fetched separately if needed
            $userData = $this->authService->formatUserData($user, false);
            $permissions = $this->authService->getUserPermissions($user);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => $userData,
                    'permissions' => $permissions
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user data',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Register new user (Admin only)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,student,staff',
            'user_type_id' => 'nullable|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'user_type_id' => $request->user_type_id,
                'is_active' => true
            ]);

            $userData = $this->authService->formatUserData($user);

            return response()->json([
                'status' => 'success',
                'message' => 'User registered successfully',
                'data' => [
                    'user' => $userData
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Registration failed',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Create account for pre-registered staff/student
     */
    public function createAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
            'name' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            
            // Check if user already exists
            if (User::where('email', $email)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'An account with this email already exists'
                ], 409);
            }

            // Check if email exists in students table
            $student = Student::where('email', $email)->first();
            if ($student) {
                // Check if student already has a user account
                if ($student->user_id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Account already exists for this email'
                    ], 409);
                }

                // Create user account for student
                $user = User::create([
                    'name' => $request->name,
                    'email' => $email,
                    'password' => Hash::make($request->password),
                    'role' => 'student',
                    'is_active' => true
                ]);

                // Link student to user
                $student->user_id = $user->id;
                $student->save();

                $userData = $this->authService->formatUserData($user);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Account created successfully! Please login to access your dashboard.',
                    'data' => [
                        'user' => $userData
                    ]
                ], 201);
            }

            // Check if email exists in staff table
            $staff = Staff::where('email', $email)->first();
            if ($staff) {
                // Check if staff already has a user account
                if ($staff->user_id) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Account already exists for this email'
                    ], 409);
                }

                // Create user account for staff
                $user = User::create([
                    'name' => $request->name,
                    'email' => $email,
                    'password' => Hash::make($request->password),
                    'role' => 'staff',
                    'is_active' => true
                ]);

                // Link staff to user
                $staff->user_id = $user->id;
                $staff->save();

                $userData = $this->authService->formatUserData($user);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Account created successfully! Please login to access your dashboard.',
                    'data' => [
                        'user' => $userData
                    ]
                ], 201);
            }

            // Email not found in students or staff tables
            return response()->json([
                'status' => 'error',
                'message' => 'This email is not registered by admin. Please contact administrator to register your details first.'
            ], 403);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Account creation failed',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $success = $this->authService->changePassword(
                $request->user(),
                $request->current_password,
                $request->new_password
            );

            if ($success) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Password changed successfully'
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to change password'
                ], 500);
            }
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Password change failed',
                'errors' => $e->errors()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to change password',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Refresh token (optional - if you want to implement token refresh)
     */
    public function refreshToken(Request $request)
    {
        try {
            $user = $request->user();
            
            // Delete current token
            $request->user()->currentAccessToken()->delete();
            
            // Create new token
            $credentials = ['user_id' => $user->email, 'password' => null]; // We don't have password here
            $abilities = $this->authService->getTokenAbilities($user->role);
            $token = $user->createToken('auth_token', $abilities)->plainTextToken;
            
            return response()->json([
                'status' => 'success',
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to refresh token',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Check if user has specific permission
     */
    public function checkPermission(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'permission' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            $permissions = $this->authService->getUserPermissions($user);
            $hasPermission = isset($permissions[$request->permission]) && $permissions[$request->permission];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'has_permission' => $hasPermission,
                    'permission' => $request->permission,
                    'user_role' => $user->role
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check permission',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get user's active sessions/tokens
     */
    public function getActiveSessions(Request $request)
    {
        try {
            $user = $request->user();
            $tokens = $user->tokens()->get()->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'abilities' => $token->abilities,
                    'last_used_at' => $token->last_used_at,
                    'created_at' => $token->created_at,
                    'expires_at' => $token->expires_at,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'active_sessions' => $tokens,
                    'total_sessions' => $tokens->count()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch active sessions',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get user profile
     */
    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch profile',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Update user profile (email only for now)
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email,' . $request->user()->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();
            $user->email = $request->email;
            $user->save();

            // If user is a staff or student, also update their email in the respective table
            if ($user->role === 'staff') {
                $staff = Staff::where('user_id', $user->id)->first();
                if ($staff) {
                    $staff->email = $request->email;
                    $staff->save();
                }
            } elseif ($user->role === 'student') {
                $student = Student::where('user_id', $user->id)->first();
                if ($student) {
                    $student->email = $request->email;
                    $student->save();
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'updated_at' => $user->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update profile',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
