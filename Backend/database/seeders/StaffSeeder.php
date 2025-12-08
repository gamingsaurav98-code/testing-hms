<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Staff;

class StaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Remove test staff entries if they exist
        for ($i = 1; $i <= 10; $i++) {
            $email = "staff{$i}@hms.com";
            Staff::where('email', $email)->delete();
        }

        $positions = [
            'Manager', 'Receptionist', 'Cleaner', 'Accountant', 'Caretaker',
            'Security', 'Cook', 'Nurse', 'Clerk', 'Supervisor'
        ];

        $departments = [
            'Administration', 'Front Desk', 'Maintenance', 'Finance', 'Housekeeping',
            'Security', 'Kitchen', 'Medical', 'Records', 'Operations'
        ];

        for ($i = 1; $i <= 10; $i++) {
            $email = "staff{$i}@hms.com";

            // Skip if exists
            if (Staff::where('email', $email)->exists()) {
                continue;
            }

            Staff::create([
                'staff_name' => "Staff Member {$i}",
                'date_of_birth' => now()->subYears(25 + $i)->toDateString(),
                'contact_number' => '9810000' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'email' => $email,
                'district' => 'Default District',
                'city_name' => 'Default City',
                'staff_id' => 'ST' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'is_active' => true,
                'position' => $positions[($i - 1) % count($positions)],
                'department' => $departments[($i - 1) % count($departments)],
                'joining_date' => now()->subMonths($i)->toDateString(),
                'salary_amount' => (5000 + ($i * 100)),
                'employment_type' => 'full-time',
            ]);
        }
    }
}
