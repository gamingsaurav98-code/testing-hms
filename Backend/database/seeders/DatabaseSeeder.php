<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run admin seeder
        $this->call([
            AdminSeeder::class,
            RoomSeeder::class,
            StaffSeeder::class,
            StudentsSeeder::class,
        ]);
    }
}
