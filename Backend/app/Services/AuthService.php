<?php

namespace App\Services;

use App\Models\User;
use App\Models\Student;
use App\Models\Staff;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Authenticate user and generate token
     */
    public function authenticate(array $credentials): array
    {
        $user = null;

        // Support both new email-based login and legacy user_id-based login
        $identifier = $credentials['email'] ?? ($credentials['user_id'] ?? null);

        if ($identifier === null) {
            throw ValidationException::withMessages([
                'email' => ['Email is required.'],
            ]);
        }

        // If identifier looks like an email, try direct user email lookup first
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $identifier)->first();
        }

        // If not an email (or not found by email), fall back to student/staff IDs
        if (!$user && !filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            // First try to find student with matching student_id
            $student = Student::where('student_id', $identifier)->first();
            if ($student && $student->user_id) {
                $user = User::find($student->user_id);
            }

            // If not found in students, try staff with matching staff_id
            if (!$user) {
                $staff = Staff::where('staff_id', $identifier)->first();
                if ($staff && $staff->user_id) {
                    $user = User::find($staff->user_id);
                }
            }
        }
        
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email or password is incorrect.'],
            ]);
        }
        
        // Check if user is active
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'user_id' => ['Your account has been deactivated.'],
            ]);
        }
        
        // Generate token with specific abilities based on role
        $abilities = $this->getTokenAbilities($user->role);
        try {
            $token = $user->createToken('auth_token', $abilities)->plainTextToken;
        } catch (\Throwable $t) {
            // Log token creation failure and rethrow so controller returns 500 with debug info
            try { 
                \Illuminate\Support\Facades\Log::error('AuthService::authenticate token creation failed', [
                    'user_id' => $user->id ?? null,
                    'email' => $user->email ?? null,
                    'role' => $user->role ?? null,
                    'error' => $t->getMessage()
                ]);
            } catch (\Throwable $_) {}
            throw $t;
        }
        
        return [
            'user' => $this->formatUserData($user, true), // Include profile data on login
            'token' => $token,
            'token_type' => 'Bearer'
        ];
    }
    
    /**
     * Get token abilities based on user role
     */
    public function getTokenAbilities(string $role): array
    {
        return match($role) {
            'admin' => [
                'admin:read', 'admin:write', 'admin:delete',
                'users:read', 'users:write', 'users:delete',
                'students:read', 'students:write', 'students:delete',
                'staff:read', 'staff:write', 'staff:delete',
                'finances:read', 'finances:write', 'finances:delete',
                'notices:read', 'notices:write', 'notices:delete',
                'complaints:read', 'complaints:write', 'complaints:delete',
                'reports:read'
            ],
            'student' => [
                'student:read', 'student:write',
                'student:profile', 'student:attendance',
                'student:finances', 'student:complaints',
                'student:notices', 'student:checkout'
            ],
            'staff' => [
                'staff:read', 'staff:write',
                'staff:profile', 'staff:attendance',
                'staff:finances', 'staff:notices',
                'staff:checkout'
            ],
            default => []
        };
    }
    
    /**
     * Format user data for response
     */
    public function formatUserData(User $user, bool $includeProfile = false): array
    {
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'user_type_id' => $user->user_type_id,
            'is_active' => $user->is_active,
            'email_verified_at' => $user->email_verified_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
        
        // Only add profile data if explicitly requested
        if ($includeProfile) {
            $profileData = $this->getUserProfileData($user);
            if ($profileData) {
                $userData['profile'] = $profileData;
            }
        }
        
        return $userData;
    }
    
    /**
     * Get user profile data based on role
     */
    private function getUserProfileData(User $user): ?array
    {
        switch ($user->role) {
            case 'student':
                if ($user->user_type_id) {
                    $student = Student::with(['room.block', 'amenities'])->find($user->user_type_id);
                    return $student ? $student->toArray() : null;
                }
                break;
            
            case 'staff':
                if ($user->user_type_id) {
                    $staff = Staff::with(['amenities'])->find($user->user_type_id);
                    return $staff ? $staff->toArray() : null;
                }
                break;
            
            case 'admin':
                return [
                    'admin_level' => 'super_admin',
                    'permissions' => ['full_access'],
                    'can_manage_users' => true,
                    'can_manage_finances' => true,
                    'can_view_reports' => true
                ];
        }
        
        return null;
    }
    
    /**
     * Logout user by revoking current token
     */
    public function logout(User $user): bool
    {
        try {
            // Revoke current token
            $token = $user->currentAccessToken();
            if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
                $token->delete();
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Logout from all devices by revoking all tokens
     */
    public function logoutFromAllDevices(User $user): bool
    {
        try {
            // Revoke all tokens
            $user->tokens()->delete();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Change user password
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        // Verify current password
        if (!Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }
        
        try {
            $user->update([
                'password' => Hash::make($newPassword)
            ]);
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Check if user has specific ability
     */
    public function hasAbility(User $user, string $ability): bool
    {
        $abilities = $this->getTokenAbilities($user->role);
        return in_array($ability, $abilities);
    }
    
    /**
     * Get user permissions based on role
     */
    public function getUserPermissions(User $user): array
    {
        return match($user->role) {
            'admin' => [
                'can_manage_users' => true,
                'can_manage_students' => true,
                'can_manage_staff' => true,
                'can_manage_finances' => true,
                'can_manage_rooms' => true,
                'can_manage_blocks' => true,
                'can_view_reports' => true,
                'can_manage_notices' => true,
                'can_manage_complaints' => true,
                'can_manage_inquiries' => true,
                'can_manage_expenses' => true,
                'can_manage_income' => true,
                'can_manage_suppliers' => true,
                'can_manage_checkout_rules' => true,
            ],
            'student' => [
                'can_view_profile' => true,
                'can_update_profile' => true,
                'can_view_finances' => true,
                'can_checkin_checkout' => true,
                'can_view_notices' => true,
                'can_create_complaints' => true,
                'can_view_complaints' => true,
                'can_chat' => true,
            ],
            'staff' => [
                'can_view_profile' => true,
                'can_update_profile' => true,
                'can_view_finances' => true,
                'can_checkin_checkout' => true,
                'can_view_notices' => true,
                'can_chat' => true,
            ],
            default => []
        };
    }
}
