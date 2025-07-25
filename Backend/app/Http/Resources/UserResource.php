<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'user_type_id' => $this->user_type_id,
            'is_active' => $this->is_active,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Include profile data based on role
            'profile' => $this->when($this->role === 'student' && $this->user_type_id, function () {
                return $this->studentProfile;
            }) ?? $this->when($this->role === 'staff' && $this->user_type_id, function () {
                return $this->staffProfile;
            }) ?? $this->when($this->role === 'admin', [
                'admin_level' => 'super_admin',
                'permissions' => ['full_access'],
                'can_manage_users' => true,
                'can_manage_finances' => true,
                'can_view_reports' => true
            ]),
            
            // Include token information if available
            'tokens_count' => $this->when($request->user()?->id === $this->id, $this->tokens()->count()),
            'last_login_at' => $this->when(
                $request->user()?->id === $this->id && $this->tokens()->exists(), 
                $this->tokens()->latest('created_at')->first()?->created_at
            ),
        ];
    }
}
