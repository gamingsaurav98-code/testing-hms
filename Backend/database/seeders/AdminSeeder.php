<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the admin seeder.
     */
    public function run(): void
    {
        // Create admin user for the system
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@hms.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);
    }
}
