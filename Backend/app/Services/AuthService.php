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
        // Find user by email
        $user = User::where('email', $credentials['email'])->first();
        
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Username or password is incorrect.'],
            ]);
        }
        
        // Check if user is active
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }
        
        // Generate token with specific abilities based on role
        $abilities = $this->getTokenAbilities($user->role);
        $token = $user->createToken('auth_token', $abilities)->plainTextToken;
        
        return [
            'user' => $this->formatUserData($user, true), // Include profile data on login
            'token' => $token,
            'token_type' => 'Bearer'
        ];
    }
    
    /**
     * Get token abilities based on user role
     */
    private function getTokenAbilities(string $role): array
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
            $user->currentAccessToken()->delete();
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
