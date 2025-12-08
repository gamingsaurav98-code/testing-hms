<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Block;
use App\Models\Room;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure a block exists
        $block = Block::first();
        if (! $block) {
            $block = Block::create([
                'block_name' => 'Block A',
                'location' => 'Main Campus',
                'manager_name' => 'Block Manager',
            ]);
        }

        // Define rooms with types and capacities (single..four-bed)
        $rooms = [
            ['room_name' => 'Room S1', 'capacity' => 1, 'room_type' => 'single'],
            ['room_name' => 'Room D1', 'capacity' => 2, 'room_type' => 'double'],
            ['room_name' => 'Room D2', 'capacity' => 2, 'room_type' => 'double'],
            ['room_name' => 'Room T1', 'capacity' => 3, 'room_type' => 'triple'],
            ['room_name' => 'Room T2', 'capacity' => 3, 'room_type' => 'triple'],
            ['room_name' => 'Room Q1', 'capacity' => 4, 'room_type' => 'four-bed'],
            ['room_name' => 'Room Q2', 'capacity' => 4, 'room_type' => 'four-bed'],
            // Extra room to ensure total capacity >= 20
            ['room_name' => 'Room Q3', 'capacity' => 4, 'room_type' => 'four-bed'],
        ];

        foreach ($rooms as $r) {
            Room::updateOrCreate(
                ['room_name' => $r['room_name']],
                [
                    'block_id' => $block->id,
                    'capacity' => $r['capacity'],
                    'room_type' => $r['room_type'],
                    'room_attachment' => null,
                    'status' => 'available',
                ]
            );
        }
    }
}
