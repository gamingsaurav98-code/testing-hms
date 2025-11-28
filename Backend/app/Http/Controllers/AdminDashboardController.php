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
            $data = AdminDashboardService::buildDashboardSummary();
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to build dashboard stats'], 500);
        }
    }
}
