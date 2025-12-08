<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Block;
use App\Models\Room;
use App\Models\Student;
use Illuminate\Support\Str;

class StudentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Remove any previously created test students with emails 1@gmail.com .. 20@gmail.com
        $emails = [];
        for ($i = 1; $i <= 20; $i++) {
            $emails[] = $i . '@gmail.com';
        }
        Student::whereIn('email', $emails)->delete();

        // Ensure rooms exist (created by RoomSeeder)
        $rooms = Room::orderBy('capacity', 'desc')->get()->all();
        if (empty($rooms)) {
            throw new \Exception('No rooms available. Please run RoomSeeder first.');
        }

        // Create 20 students and place them into rooms respecting capacity
        $studentIndex = 1;
        for ($i = 1; $i <= 20; $i++) {
            $email = $i . '@gmail.com';

            // Find a room with available capacity
            $assigned = false;
            foreach ($rooms as $room) {
                $occupied = Student::where('room_id', $room->id)->count();
                if ($occupied < $room->capacity) {
                    Student::create([
                        'student_name' => "Student {$i}",
                        'date_of_birth' => now()->subYears(18)->toDateString(),
                        'contact_number' => '98000000' . str_pad($i, 2, '0', STR_PAD_LEFT),
                        'email' => $email,
                        'district' => 'Default District',
                        'city_name' => 'Default City',
                        'student_id' => 'S' . str_pad($i, 4, '0', STR_PAD_LEFT),
                        'room_id' => $room->id,
                        'is_active' => true,
                    ]);
                    $assigned = true;
                    break;
                }
            }

            if (! $assigned) {
                throw new \Exception("Not enough room capacity to place student {$email}");
            }
        }
    }
}
