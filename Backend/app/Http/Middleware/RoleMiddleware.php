<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
                'code' => 'UNAUTHENTICATED'
            ], 401);
        }

        $user = $request->user();

        // Check if user is active
        if (!$user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Account is deactivated',
                'code' => 'ACCOUNT_DEACTIVATED'
            ], 403);
        }

        // Check if user has any of the required roles
        if (!in_array($user->role, $roles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Required role(s): ' . implode(', ', $roles),
                'code' => 'INSUFFICIENT_ROLE',
                'required_roles' => $roles,
                'user_role' => $user->role
            ], 403);
        }

        return $next($request);
    }
}
