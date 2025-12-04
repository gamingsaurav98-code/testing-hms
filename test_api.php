<?php

// Simple API test script
require_once 'Backend/vendor/autoload.php';

$app = require_once 'Backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing API endpoints...\n\n";

// Get admin user and create token
$user = \App\Models\User::where('role', 'admin')->first();
if (!$user) {
    echo "No admin user found!\n";
    exit(1);
}

$token = $user->createToken('test')->plainTextToken;
echo "Using token for user: {$user->email}\n\n";

// Test students endpoint
echo "1. Testing students endpoint...\n";
try {
    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Accept' => 'application/json',
        'Authorization' => 'Bearer ' . $token
    ])->get('http://localhost:8000/api/students?paginate=false');

    echo "Status: {$response->status()}\n";
    if ($response->successful()) {
        $data = $response->json();
        $count = isset($data['data']) ? count($data['data']) : (is_array($data) ? count($data) : 'N/A');
        echo "Students count: {$count}\n";
    } else {
        echo "Error: {$response->body()}\n";
    }
} catch (Exception $e) {
    echo "Exception: {$e->getMessage()}\n";
}

echo "\n";

// Test rooms endpoint
echo "2. Testing rooms endpoint...\n";
try {
    $response = \Illuminate\Support\Facades\Http::withHeaders([
        'Accept' => 'application/json',
        'Authorization' => 'Bearer ' . $token
    ])->get('http://localhost:8000/api/rooms?per_page=1000');

    echo "Status: {$response->status()}\n";
    if ($response->successful()) {
        $data = $response->json();
        $rooms = isset($data['data']) ? $data['data'] : [];
        $count = is_array($rooms) ? count($rooms) : 'N/A';
        echo "Rooms count: {$count}\n";

        if (is_array($rooms) && count($rooms) > 0) {
            $totalCapacity = 0;
            foreach ($rooms as $room) {
                $totalCapacity += $room['capacity'] ?? 0;
            }
            echo "Total capacity: {$totalCapacity}\n";
        }
    } else {
        echo "Error: {$response->body()}\n";
    }
} catch (Exception $e) {
    echo "Exception: {$e->getMessage()}\n";
}

echo "\nTest completed.\n";
