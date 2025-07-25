<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test users with different roles
        
        // Admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@hms.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Student user
        User::factory()->create([
            'name' => 'Student User',
            'email' => 'student@hms.com',
            'password' => Hash::make('password123'),
            'role' => 'student',
            'is_active' => true,
        ]);

        // Staff user
        User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@hms.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
            'is_active' => true,
        ]);

        // Legacy test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Call the seeders in correct order
        $this->call([
            BlockSeeder::class,         // Create blocks first
            RoomSeeder::class,          // Then create rooms
            StudentSeeder::class,       // Create students
            CompleteStaffSeeder::class, // Create staff members
            ComplainSeeder::class,      // Create complains with chat messages
        ]);
    }
}
