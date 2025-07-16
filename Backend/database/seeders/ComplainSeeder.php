<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Complain;
use App\Models\Chat;
use App\Models\Student;
use App\Models\Staff;
use Faker\Factory as Faker;
use Carbon\Carbon;

class ComplainSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder creates comprehensive complain data with related chat messages.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Get existing students and staff
        $students = Student::all();
        $staff = Staff::all();

        if ($students->isEmpty() && $staff->isEmpty()) {
            $this->command->warn('No students or staff found! Please run StudentSeeder and StaffSeeder first.');
            return;
        }

        // Define realistic complain categories and titles
        $complainTypes = [
            'Accommodation' => [
                'Room heater not working',
                'Room AC malfunctioning',
                'Bed frame broken',
                'Mattress needs replacement',
                'Room door lock issue',
                'Window glass broken',
                'Ceiling fan not working',
                'Light bulb replacement needed',
                'Room cleaning not done properly',
                'Wardrobe door broken',
                'Study table damaged',
                'Chair needs repair',
                'Room smells bad',
                'Water leakage in room',
                'Power socket not working'
            ],
            'Food & Dining' => [
                'Food quality is poor',
                'Insufficient food quantity',
                'Food served cold',
                'Found hair in food',
                'Food poisoning after meals',
                'Dining hall not clean',
                'Mess timing inconvenient',
                'Limited vegetarian options',
                'Plates and utensils dirty',
                'Water not available during meals',
                'Food menu repetitive',
                'Kitchen staff behavior rude',
                'Late food service',
                'Special diet request not accommodated'
            ],
            'Facilities & Infrastructure' => [
                'WiFi connection very slow',
                'Internet not working',
                'Common toilet blocked',
                'Hot water not available',
                'Elevator not working',
                'Common room TV broken',
                'Library books missing',
                'Study room lights not working',
                'Laundry machine broken',
                'Water cooler not functioning',
                'Security camera not working',
                'Fire safety equipment missing',
                'Parking area inadequate',
                'Garden area not maintained'
            ],
            'Administrative' => [
                'Fees receipt not provided',
                'Staff behavior unprofessional',
                'Rule enforcement inconsistent',
                'Late night noise from other rooms',
                'Visitors policy too strict',
                'Maintenance requests ignored',
                'Security guard absent during duty',
                'Room allocation unfair',
                'Deposit amount incorrect',
                'Notice not communicated properly',
                'Complain box always full',
                'Office timing inconvenient',
                'Form submission process unclear'
            ],
            'Health & Safety' => [
                'First aid kit empty',
                'Medical facility not available',
                'Pest control needed urgently',
                'Fire extinguisher expired',
                'Emergency contact not working',
                'Unsafe electrical wiring',
                'Staircase handrail loose',
                'Floor slippery and dangerous',
                'Chemical smell in corridor',
                'Security lock malfunction',
                'Emergency exit blocked',
                'Medicine not available in medical room'
            ]
        ];

        // Realistic descriptions based on titles
        $descriptions = [
            'Room heater not working' => "The room heater in my room has stopped working since last week. With the cold weather, it's becoming very difficult to stay comfortable. The heater doesn't turn on even when plugged in properly. Please send maintenance staff to check and repair it as soon as possible.",
            
            'Food quality is poor' => "I want to complain about the deteriorating food quality in the mess. The vegetables are often overcooked, the rice is sometimes undercooked, and the dal lacks proper seasoning. Many students are facing digestive issues. Please improve the cooking quality and ensure fresh ingredients are used.",
            
            'WiFi connection very slow' => "The WiFi connection in our block is extremely slow, especially during evening hours when most students need internet for their studies. Video calls and online classes get disconnected frequently. The speed is not sufficient for academic work. Please upgrade the internet infrastructure.",
            
            'Staff behavior unprofessional' => "I want to report unprofessional behavior from one of the staff members. They were rude and dismissive when I approached them with a legitimate concern about room maintenance. This kind of attitude is not acceptable and creates a hostile environment for students.",
            
            'First aid kit empty' => "The first aid kit in our floor's common area is completely empty. Yesterday a student got injured and we couldn't find even basic medicines like band-aids or antiseptic. This is a serious safety concern that needs immediate attention."
        ];

        // Status options with their probabilities
        $statuses = [
            'pending' => 40,      // 40% pending
            'in_progress' => 35,  // 35% in progress
            'resolved' => 25,     // 25% resolved
        ];

        $this->command->info("Creating complains with related data...");

        // Create 50-80 complains
        $totalComplains = $faker->numberBetween(50, 80);

        for ($i = 1; $i <= $totalComplains; $i++) {
            // Randomly choose between student or staff complain (80% student, 20% staff)
            $isStudentComplain = $faker->boolean(80);
            $studentId = null;
            $staffId = null;

            if ($isStudentComplain && !$students->isEmpty()) {
                $studentId = $students->random()->id;
            } elseif (!$staff->isEmpty()) {
                $staffId = $staff->random()->id;
            } else {
                continue; // Skip if no users available
            }

            // Select random complain type and title
            $category = $faker->randomElement(array_keys($complainTypes));
            $title = $faker->randomElement($complainTypes[$category]);
            
            // Get description or generate realistic one
            $description = $descriptions[$title] ?? $this->generateDescription($title, $category, $faker);

            // Determine status based on probabilities
            $status = $this->getWeightedRandomStatus($statuses, $faker);

            // Create timestamps - complains created in last 6 months
            $createdAt = $faker->dateTimeBetween('-6 months', 'now');
            $updatedAt = $faker->dateTimeBetween($createdAt, 'now');

            // Create complain data
            $complainData = [
                'student_id' => $studentId,
                'staff_id' => $staffId,
                'title' => $title,
                'description' => $description,
                'status' => $status,
                'complain_attachment' => $faker->optional(0.3)->imageUrl(800, 600, 'business'), // 30% have attachments
                'total_messages' => 0, // Will be updated when we add chat messages
                'unread_admin_messages' => 0,
                'unread_student_messages' => 0,
                'unread_staff_messages' => 0,
                'last_message_at' => null,
                'last_message_by' => null,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ];

            // Create the complain
            $complain = Complain::create($complainData);

            // Create chat messages for this complain (0-15 messages per complain)
            $this->createChatMessages($complain, $faker);

            $this->command->info("Created complain {$i}: {$title} (Status: {$status})");
        }

        // Update complain statistics
        $this->updateComplainStatistics();

        $this->command->info("Complain seeder completed! Created {$totalComplains} complains with:");
        $this->command->info("✓ Realistic titles and descriptions");
        $this->command->info("✓ Student and staff associations");
        $this->command->info("✓ Various status types");
        $this->command->info("✓ Related chat messages");
        $this->command->info("✓ Proper statistics and timestamps");
    }

    /**
     * Generate realistic description based on title and category
     */
    private function generateDescription($title, $category, $faker)
    {
        $templates = [
            'Accommodation' => [
                "I am facing an issue with {issue} in my room. This problem started {timeframe} and is affecting my daily routine. Please send maintenance staff to fix this issue as it's making my stay uncomfortable.",
                "There is a problem with {issue} in my accommodation. It has been {timeframe} since this issue began and despite my previous requests, nothing has been done. Please resolve this matter urgently.",
                "I would like to report a problem regarding {issue}. This has been ongoing for {timeframe} and is causing significant inconvenience. Immediate action is required to fix this."
            ],
            'Food & Dining' => [
                "I want to complain about {issue} in the dining hall. This has been happening {timeframe} and many students are affected. The food service quality needs immediate improvement.",
                "There is a serious concern regarding {issue} in the mess facility. This problem has persisted for {timeframe} and is affecting our health and well-being. Please take necessary action.",
                "I am writing to report {issue} in the dining area. This issue has been noticed {timeframe} and requires urgent attention from the management."
            ],
            'Facilities & Infrastructure' => [
                "I want to report an issue with {issue} in our facility. This problem has been present {timeframe} and is affecting all residents. Please arrange for proper maintenance and repair.",
                "There is a technical problem with {issue} that needs immediate attention. This has been malfunctioning for {timeframe} and is causing inconvenience to everyone.",
                "I am facing difficulties due to {issue} in the building. This infrastructure problem has existed for {timeframe} and requires professional handling."
            ],
            'Administrative' => [
                "I have a concern regarding {issue} in the administrative process. This matter has been pending for {timeframe} and needs proper resolution from the management team.",
                "I would like to bring to your attention the issue of {issue}. This administrative problem has been ongoing for {timeframe} and requires immediate policy review.",
                "There is an administrative issue regarding {issue} that needs to be addressed. This has been a problem for {timeframe} and affects the overall management quality."
            ],
            'Health & Safety' => [
                "I want to report a safety concern about {issue} in our facility. This is a serious matter that has been neglected for {timeframe} and poses risk to all residents.",
                "There is an urgent health and safety issue regarding {issue}. This dangerous situation has existed for {timeframe} and requires immediate professional intervention.",
                "I am concerned about {issue} which is a safety hazard. This problem has been present for {timeframe} and could lead to serious accidents if not addressed quickly."
            ]
        ];

        $timeframes = [
            'several days', 'a week', 'two weeks', 'a month', 'several weeks',
            'the past few days', 'quite some time', 'more than a week'
        ];

        $template = $faker->randomElement($templates[$category]);
        $timeframe = $faker->randomElement($timeframes);
        
        return str_replace(['{issue}', '{timeframe}'], [strtolower($title), $timeframe], $template);
    }

    /**
     * Get weighted random status
     */
    private function getWeightedRandomStatus($statuses, $faker)
    {
        $randomNumber = $faker->numberBetween(1, 100);
        $currentWeight = 0;

        foreach ($statuses as $status => $weight) {
            $currentWeight += $weight;
            if ($randomNumber <= $currentWeight) {
                return $status;
            }
        }

        return 'pending'; // fallback
    }

    /**
     * Create chat messages for a complain
     */
    private function createChatMessages($complain, $faker)
    {
        // 30% chance of having no messages, 70% chance of having 1-15 messages
        if ($faker->boolean(30)) {
            return; // No messages
        }

        $messageCount = $faker->numberBetween(1, 15);
        $adminResponses = [
            "Thank you for reporting this issue. We have forwarded your complain to the maintenance team.",
            "We acknowledge your concern and are looking into this matter immediately.",
            "Your complain has been received. Our team will investigate and get back to you soon.",
            "We apologize for the inconvenience. This issue will be resolved within 24-48 hours.",
            "Thank you for bringing this to our attention. We are taking necessary action.",
            "Your feedback is valuable. We are working on improving this aspect of our service.",
            "We have noted your complain and assigned it to the relevant department for resolution.",
            "Thank you for your patience. We are committed to resolving this issue quickly.",
            "We understand your concern and have escalated this matter to senior management.",
            "Your complain is important to us. We will keep you updated on the progress."
        ];

        $userFollowUps = [
            "Thank you for the quick response. Looking forward to the resolution.",
            "I appreciate your attention to this matter. Please keep me updated.",
            "When can I expect this issue to be resolved?",
            "This problem is still persisting. Any update on the resolution?",
            "The issue seems to have worsened. Please prioritize this.",
            "Thank you for your help. I hope this gets fixed soon.",
            "I'm still facing the same problem. Can someone please check?",
            "Is there any progress on fixing this issue?",
            "The maintenance team hasn't contacted me yet. Please follow up.",
            "Thank you for your assistance. I'll wait for the resolution."
        ];

        for ($j = 1; $j <= $messageCount; $j++) {
            // First message is usually from the user (who created the complain)
            $isFromUser = ($j == 1) ? true : $faker->boolean(60); // 60% chance of user messages after first

            $message = '';
            if ($j == 1) {
                // First message - initial complain details
                $message = "I have submitted a complain regarding: " . $complain->title . ". " . 
                          $faker->randomElement([
                              "Please look into this matter urgently.",
                              "This needs immediate attention.",
                              "I hope this can be resolved quickly.",
                              "Please assign someone to handle this issue.",
                              "This is affecting my daily routine significantly."
                          ]);
            } elseif ($isFromUser) {
                $message = $faker->randomElement($userFollowUps);
            } else {
                $message = $faker->randomElement($adminResponses);
            }

            // Create message timestamp (after complain creation)
            $messageTime = $faker->dateTimeBetween($complain->created_at, 'now');

            $chatData = [
                'complain_id' => $complain->id,
                'message' => $message,
                'is_edited' => $faker->boolean(10), // 10% chance of being edited
                'is_read' => $faker->boolean(70),   // 70% chance of being read
                'read_at' => $faker->boolean(70) ? $faker->dateTimeBetween($messageTime, 'now') : null,
                'created_at' => $messageTime,
                'updated_at' => $messageTime,
            ];

            Chat::create($chatData);
        }
    }

    /**
     * Update complain statistics based on chat messages
     */
    private function updateComplainStatistics()
    {
        $this->command->info("Updating complain statistics...");
        
        $complains = Complain::all();
        
        foreach ($complains as $complain) {
            $complain->updateChatStatistics();
        }
        
        $this->command->info("Complain statistics updated successfully!");
    }
}
