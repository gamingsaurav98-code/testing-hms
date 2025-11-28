<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\AdminDashboardService;

final class AdminDashboardServiceTest extends TestCase
{
    public function test_build_dashboard_summary_returns_expected_keys()
    {
        $summary = AdminDashboardService::buildDashboardSummary();

        $this->assertIsArray($summary);

        // Top level keys
        $this->assertArrayHasKey('rooms', $summary);
        $this->assertArrayHasKey('students', $summary);
        $this->assertArrayHasKey('finance', $summary);
        $this->assertArrayHasKey('recent_activity', $summary);
        $this->assertArrayHasKey('calculation_date', $summary);

        // Rooms keys
        $this->assertArrayHasKey('total_capacity', $summary['rooms']);
        $this->assertArrayHasKey('occupied_beds', $summary['rooms']);
        $this->assertArrayHasKey('available_beds', $summary['rooms']);

        // Students keys
        $this->assertArrayHasKey('total', $summary['students']);
        $this->assertArrayHasKey('in_hostel', $summary['students']);

        // Finance keys
        $this->assertArrayHasKey('monthly_incomes', $summary['finance']);
        $this->assertArrayHasKey('monthly_expenses', $summary['finance']);

        // Types / defaults
        $this->assertIsNumeric($summary['rooms']['total_capacity']);
        $this->assertIsNumeric($summary['students']['total']);
        $this->assertIsNumeric($summary['finance']['monthly_incomes']);
    }
}
