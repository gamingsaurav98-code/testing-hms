<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AdminDashboardService;

class AdminDashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard/stats
     */
    public function stats(Request $request)
    {
        try {
            // Allow callers to force refresh to bypass the short cache (useful in debug)
            $force = $request->query('force_refresh') ? true : false;
            $data = AdminDashboardService::buildDashboardSummary($force);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to build dashboard stats'], 500);
        }
    }
}
