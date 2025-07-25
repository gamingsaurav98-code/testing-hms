<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            'email' => 'required|email',
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
            $credentials = $request->only('email', 'password');
            $authData = $this->authService->authenticate($credentials);

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => $authData
            ]);
            
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Authentication failed',
                'errors' => $e->errors()
            ], 401);
        } catch (\Exception $e) {
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
            $userData = $this->authService->formatUserData($user);
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
            $credentials = ['email' => $user->email, 'password' => null]; // We don't have password here
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
}
