<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\StudentAmenities;
use App\Models\StudentFinancial;
use App\Models\Room;
use App\Models\User;
use Faker\Factory as Faker;
use Carbon\Carbon;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        
        // Get available rooms with their capacities
        $rooms = Room::all();
        
        if ($rooms->isEmpty()) {
            $this->command->warn('No rooms found! Please run RoomSeeder first.');
            return;
        }

        // Create a room capacity tracker
        $roomCapacities = [];
        foreach ($rooms as $room) {
            $roomCapacities[$room->id] = [
                'room' => $room,
                'capacity' => $room->capacity,
                'occupied' => 0 // Track how many students we've assigned
            ];
        }

        // Calculate total available beds
        $totalBeds = $rooms->sum('capacity');
        $studentsToCreate = min(50, $totalBeds); // Don't create more students than available beds

        $this->command->info("Creating {$studentsToCreate} students for {$totalBeds} available beds...");

        // Define common data arrays for realistic seeding
        $bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        $foodPreferences = ['vegetarian', 'non-vegetarian', 'egg-only'];
        $levelOfStudy = [
            'High School', 'Higher Secondary', 'Diploma', 'Bachelors', 'Masters', 'PhD',
            'Certificate', 'Associate Degree', 'Professional Course'
        ];
        $classTimings = ['Morning', 'Day', 'Evening', 'Night', '6:00 AM - 10:00 AM', '10:00 AM - 4:00 PM', '4:00 PM - 8:00 PM'];
        $expectedStayDuration = ['6 months', '1 year', '2 years', '3 years', '4 years', '5 years'];
        $districts = [
            'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Pokhara', 'Butwal', 'Birgunj',
            'Dharan', 'Hetauda', 'Janakpur', 'Nepalgunj', 'Gorkha', 'Syangja', 'Kaski',
            'Rupandehi', 'Parsa', 'Bara', 'Rautahat', 'Sarlahi', 'Mahottari'
        ];
        $occupations = [
            'Farmer', 'Teacher', 'Driver', 'Business Person', 'Government Employee', 'Doctor',
            'Engineer', 'Shopkeeper', 'Laborer', 'Housewife', 'Retired', 'Student', 'Nurse',
            'Police Officer', 'Accountant', 'Mechanic', 'Tailor', 'Cook'
        ];
        $institutions = [
            'Tribhuvan University', 'Kathmandu University', 'Pokhara University', 'Purbanchal University',
            'Nepal Open University', 'Agriculture and Forestry University', 'Mid-Western University',
            'Far-Western University', 'Lumbini Buddhist University', 'B.P. Koirala Institute of Health Sciences',
            'National College', 'Amrit Campus', 'Padma Kanya Campus', 'Ratna Rajya Campus',
            'Mahendra Multiple Campus', 'Birendra Multiple Campus', 'Prithvi Narayan Campus'
        ];
        $guardianRelations = ['Uncle', 'Aunt', 'Elder Brother', 'Elder Sister', 'Cousin', 'Family Friend', 'Relative'];
        
        // Sample diseases/health conditions
        $healthConditions = [
            null, // Many students will have no health issues
            'Asthma', 
            'Diabetes', 
            'High Blood Pressure', 
            'Allergy to nuts', 
            'Migraine', 
            'Back pain',
            'Skin allergy',
            'Gastritis',
            'None'
        ];

        // Sample amenities that students might have
        $commonAmenities = [
            ['name' => 'WiFi', 'description' => 'High-speed internet access'],
            ['name' => 'Laundry', 'description' => 'Weekly laundry service'],
            ['name' => 'Meals', 'description' => '3 times daily meals'],
            ['name' => 'Study Table', 'description' => 'Personal study table and chair'],
            ['name' => 'Wardrobe', 'description' => 'Personal storage space'],
            ['name' => 'Air Conditioning', 'description' => 'Climate control'],
            ['name' => 'Hot Water', 'description' => '24/7 hot water supply'],
            ['name' => 'Security', 'description' => '24/7 security service'],
            ['name' => 'Parking', 'description' => 'Bike/scooter parking space'],
            ['name' => 'Common Room', 'description' => 'Access to common recreational area'],
        ];

        // Create students with proper room assignment
        for ($i = 1; $i <= $studentsToCreate; $i++) {
            // Generate realistic Nepali names
            $maleFirstNames = ['Anil', 'Sunil', 'Rajesh', 'Ramesh', 'Krishna', 'Hari', 'Shyam', 'Gopal', 'Mohan', 'Rohan', 'Arjun', 'Bikash', 'Deepak', 'Santosh', 'Prakash'];
            $femaleFirstNames = ['Sita', 'Gita', 'Rita', 'Sunita', 'Anita', 'Puja', 'Priya', 'Sarita', 'Kamala', 'Shanti', 'Laxmi', 'Maya', 'Devi', 'Kumari', 'Sushma'];
            $lastNames = ['Sharma', 'Shrestha', 'Tamang', 'Gurung', 'Magar', 'Rai', 'Limbu', 'Thapa', 'Poudel', 'Adhikari', 'Khadka', 'Basnet', 'Karki', 'Regmi', 'Koirala'];
            
            $isGender = $faker->randomElement(['male', 'female']);
            $firstName = $isGender === 'male' ? $faker->randomElement($maleFirstNames) : $faker->randomElement($femaleFirstNames);
            $lastName = $faker->randomElement($lastNames);
            
            // For the first student, use demo student user data
            if ($i === 1) {
                $demoStudentUser = User::where('email', 'student@hms.com')->first();
                $fullName = $demoStudentUser ? $demoStudentUser->name : 'Demo Student';
                $email = $demoStudentUser ? $demoStudentUser->email : 'demo.student@hms.com';
                $userId = $demoStudentUser ? $demoStudentUser->id : null;
            } else {
                $fullName = $firstName . ' ' . $lastName;
                $email = strtolower(str_replace(' ', '.', $firstName . '.' . $lastName)) . $i . '@example.com';
                $userId = null;
            }
            
            // Find an available room with capacity
            $availableRoom = null;
            foreach ($roomCapacities as $roomId => &$roomData) {
                if ($roomData['occupied'] < $roomData['capacity']) {
                    $availableRoom = $roomData['room'];
                    $roomData['occupied']++; // Increment occupied count
                    break;
                }
            }
            
            if (!$availableRoom) {
                $this->command->warn("No available rooms with capacity for student {$i}. Stopping here.");
                break;
            }
            
            // Create student data
            $studentData = [
                'student_name' => $fullName,
                'user_id' => $userId, // Link to demo user for first student
                'date_of_birth' => $faker->dateTimeBetween('-30 years', '-18 years')->format('Y-m-d'),
                'contact_number' => '98' . $faker->numberBetween(10000000, 99999999), // Nepali mobile format
                'email' => $email,
                'district' => $faker->randomElement($districts),
                'city_name' => $faker->city,
                'ward_no' => $faker->numberBetween(1, 32),
                'street_name' => $faker->streetName,
                'citizenship_no' => $faker->numberBetween(100000000, 999999999),
                'date_of_issue' => $faker->dateTimeBetween('-10 years', '-1 year')->format('Y-m-d'),
                'citizenship_issued_district' => $faker->randomElement($districts),
                'educational_institution' => $faker->randomElement($institutions),
                'class_time' => $faker->randomElement($classTimings),
                'level_of_study' => $faker->randomElement($levelOfStudy),
                'expected_stay_duration' => $faker->randomElement($expectedStayDuration),
                'blood_group' => $faker->randomElement($bloodGroups),
                'food' => $faker->randomElement($foodPreferences),
                'disease' => $faker->randomElement($healthConditions),
                'father_name' => $faker->name('male'),
                'father_contact' => '98' . $faker->numberBetween(10000000, 99999999),
                'father_occupation' => $faker->randomElement($occupations),
                'mother_name' => $faker->name('female'),
                'mother_contact' => '98' . $faker->numberBetween(10000000, 99999999),
                'mother_occupation' => $faker->randomElement($occupations),
                'spouse_name' => $faker->optional(0.2)->name(), // Only 20% have spouse
                'spouse_contact' => $faker->optional(0.2)->numerify('98########'),
                'spouse_occupation' => $faker->optional(0.2)->randomElement($occupations),
                'local_guardian_name' => $faker->name(),
                'local_guardian_address' => $faker->address,
                'local_guardian_contact' => '98' . $faker->numberBetween(10000000, 99999999),
                'local_guardian_occupation' => $faker->randomElement($occupations),
                'local_guardian_relation' => $faker->randomElement($guardianRelations),
                'verified_by' => $faker->optional(0.8)->name(), // 80% are verified
                'verified_on' => $faker->optional(0.8)->dateTimeBetween('-1 year', 'now'),
                'student_id' => 'STU' . str_pad($i, 4, '0', STR_PAD_LEFT), // STU0001, STU0002, etc.
                'room_id' => $availableRoom->id,
                'student_image' => $faker->optional(0.7)->imageUrl(300, 300, 'people'), // 70% have images
                'student_citizenship_image' => $faker->optional(0.9)->imageUrl(800, 600, 'business'), // 90% have citizenship docs
                'registration_form_image' => $faker->optional(0.8)->imageUrl(800, 600, 'business'), // 80% have registration forms
                'is_active' => $faker->boolean(90), // 90% are active
                'is_existing_student' => $faker->boolean(20), // 20% are existing students
                'declaration_agreed' => $faker->boolean(95), // 95% agreed to declaration
                'rules_agreed' => $faker->boolean(98), // 98% agreed to rules
                'created_at' => $faker->dateTimeBetween('-2 years', 'now'),
                'updated_at' => now(),
            ];

            // Create the student
            $student = Student::create($studentData);

            // Create financial record for the student
            $admissionFee = $faker->numberBetween(5000, 15000);
            $formFee = $faker->numberBetween(500, 2000);
            $securityDeposit = $faker->numberBetween(10000, 30000);
            $monthlyFee = $faker->numberBetween(8000, 25000);
            $joiningDate = $faker->dateTimeBetween('-2 years', 'now');

            // Create StudentFinancial record
            $financialData = [
                'student_id' => $student->id,
                'admission_fee' => $admissionFee,
                'form_fee' => $formFee,
                'security_deposit' => $securityDeposit,
                'monthly_fee' => $monthlyFee,
                'amount' => $admissionFee + $formFee + $securityDeposit, // Total initial amount
                'is_existing_student' => $student->is_existing_student,
                'previous_balance' => $student->is_existing_student ? $faker->numberBetween(-5000, 10000) : 0,
                'initial_balance_after_registration' => $faker->numberBetween(-3000, 5000),
                'balance_type' => $faker->randomElement(['due', 'advance']),
                'payment_date' => $joiningDate,
                'remark' => $faker->optional(0.6)->sentence(),
                'payment_type_id' => $faker->optional(0.8)->numberBetween(1, 5), // Assuming payment types exist
                'joining_date' => $joiningDate->format('Y-m-d'),
                'created_at' => $joiningDate,
                'updated_at' => now(),
            ];

            // Create the financial record
            \App\Models\StudentFinancial::create($financialData);

            // Add amenities for each student (2-5 random amenities)
            $numAmenities = $faker->numberBetween(2, 5);
            $selectedAmenities = $faker->randomElements($commonAmenities, $numAmenities);
            
            foreach ($selectedAmenities as $amenity) {
                StudentAmenities::create([
                    'student_id' => $student->id,
                    'name' => $amenity['name'],
                    'description' => $amenity['description'],
                ]);
            }

            $this->command->info("Created student: {$student->student_name} (ID: {$student->student_id})");
        }

        // Show summary
        $totalCreated = Student::count();
        $this->command->info("Student seeder completed! Created {$totalCreated} students with full information including:");
        $this->command->info("✓ Personal and contact details");
        $this->command->info("✓ Address and citizenship information");
        $this->command->info("✓ Educational details");
        $this->command->info("✓ Family information (parents and spouse)");
        $this->command->info("✓ Local guardian information");
        $this->command->info("✓ Financial records");
        $this->command->info("✓ Student amenities");
        $this->command->info("✓ Room assignments within capacity limits");
    }
}
