<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Staff;
use App\Models\StaffAmenities;
use Faker\Factory as Faker;
use Carbon\Carbon;

class CompleteStaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder creates comprehensive staff data with amenities.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Define common data arrays for realistic seeding
        $bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        $foodPreferences = ['vegetarian', 'non-vegetarian', 'egg-only'];
        $levelOfStudy = [
            'High School', 'Higher Secondary', 'Diploma', 'Bachelors', 'Masters', 'PhD',
            'Certificate', 'Associate Degree', 'Professional Course'
        ];
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
        
        // Staff-specific data
        $positions = [
            'Manager', 'Assistant Manager', 'Supervisor', 'Security Guard', 'Accountant',
            'Maintenance Staff', 'Cleaner', 'Cook', 'Receptionist', 'Warden', 'Assistant Warden',
            'IT Support', 'Librarian', 'Nurse', 'Counselor', 'Admin Assistant', 'Driver'
        ];
        $departments = [
            'Administration', 'Security', 'Maintenance', 'Food Services', 'IT',
            'Finance', 'Student Affairs', 'Health Services', 'Housekeeping', 'Transportation'
        ];
        $employmentTypes = ['full-time', 'part-time', 'contract', 'intern'];
        
        // Sample diseases/health conditions
        $healthConditions = [
            null, null, null, // Many staff will have no health issues
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

        // Sample amenities that staff might have
        $commonAmenities = [
            ['name' => 'Staff WiFi', 'description' => 'High-speed internet access for staff'],
            ['name' => 'Uniform', 'description' => 'Provided work uniform'],
            ['name' => 'Meals', 'description' => 'Daily meals during work hours'],
            ['name' => 'Locker', 'description' => 'Personal storage locker'],
            ['name' => 'Staff Room', 'description' => 'Access to staff common room'],
            ['name' => 'Parking', 'description' => 'Staff parking space'],
            ['name' => 'Medical Insurance', 'description' => 'Health insurance coverage'],
            ['name' => 'Training', 'description' => 'Regular training and development'],
            ['name' => 'Transportation', 'description' => 'Transportation allowance or service'],
            ['name' => 'Accommodation', 'description' => 'Staff accommodation facility'],
        ];

        // Create 20 sample staff members
        for ($i = 1; $i <= 20; $i++) {
            // Generate realistic Nepali names
            $maleFirstNames = ['Anil', 'Sunil', 'Rajesh', 'Ramesh', 'Krishna', 'Hari', 'Shyam', 'Gopal', 'Mohan', 'Rohan', 'Arjun', 'Bikash', 'Deepak', 'Santosh', 'Prakash'];
            $femaleFirstNames = ['Sita', 'Gita', 'Rita', 'Sunita', 'Anita', 'Puja', 'Priya', 'Sarita', 'Kamala', 'Shanti', 'Laxmi', 'Maya', 'Devi', 'Kumari', 'Sushma'];
            $lastNames = ['Sharma', 'Shrestha', 'Tamang', 'Gurung', 'Magar', 'Rai', 'Limbu', 'Thapa', 'Poudel', 'Adhikari', 'Khadka', 'Basnet', 'Karki', 'Regmi', 'Koirala'];
            
            $isGender = $faker->randomElement(['male', 'female']);
            $firstName = $isGender === 'male' ? $faker->randomElement($maleFirstNames) : $faker->randomElement($femaleFirstNames);
            $lastName = $faker->randomElement($lastNames);
            $fullName = $firstName . ' ' . $lastName;

            // Assign random room from available rooms
            $position = $faker->randomElement($positions);
            $department = $faker->randomElement($departments);
            
            // Create more realistic email
            $emailPrefix = strtolower(str_replace(' ', '.', $fullName));
            $emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            $email = $emailPrefix . '@' . $faker->randomElement($emailDomains);

            $staff = Staff::create([
                'staff_name' => $fullName,
                'staff_id' => 'STF' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'email' => $email,
                'contact_number' => $faker->phoneNumber,
                'date_of_birth' => $faker->dateTimeBetween('-60 years', '-20 years')->format('Y-m-d'),
                'position' => $position,
                'department' => $department,
                'joining_date' => $faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
                'salary_amount' => $faker->numberBetween(15000, 80000),
                'employment_type' => $faker->randomElement($employmentTypes),
                
                // Address information
                'district' => $faker->randomElement($districts),
                'city_name' => $faker->city,
                'ward_no' => $faker->numberBetween(1, 35),
                'street_name' => $faker->streetName,
                
                // Citizenship information
                'citizenship_no' => $faker->numerify('##-##-##-#####'),
                'date_of_issue' => $faker->dateTimeBetween('-20 years', '-1 year')->format('Y-m-d'),
                'citizenship_issued_district' => $faker->randomElement($districts),
                
                // Education information
                'educational_institution' => $faker->randomElement($institutions),
                'level_of_study' => $faker->randomElement($levelOfStudy),
                
                // Health information
                'blood_group' => $faker->randomElement($bloodGroups),
                'food' => $faker->randomElement($foodPreferences),
                'disease' => $faker->randomElement($healthConditions),
                
                // Family information
                'father_name' => $faker->name('male'),
                'father_contact' => $faker->phoneNumber,
                'father_occupation' => $faker->randomElement($occupations),
                'mother_name' => $faker->name('female'),
                'mother_contact' => $faker->phoneNumber,
                'mother_occupation' => $faker->randomElement($occupations),
                
                // Spouse information (random chance)
                'spouse_name' => $faker->boolean(60) ? $faker->name($isGender === 'male' ? 'female' : 'male') : null,
                'spouse_contact' => $faker->boolean(60) ? $faker->phoneNumber : null,
                'spouse_occupation' => $faker->boolean(60) ? $faker->randomElement($occupations) : null,
                
                // Local guardian information
                'local_guardian_name' => $faker->name,
                'local_guardian_contact' => $faker->phoneNumber,
                'local_guardian_occupation' => $faker->randomElement($occupations),
                'local_guardian_relation' => $faker->randomElement($guardianRelations),
                'local_guardian_address' => $faker->address,
                
                // Verification information
                'verified_by' => $faker->name,
                'verified_on' => $faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
                
                // Status fields
                'is_active' => $faker->boolean(90), // 90% active
                'declaration_agreed' => true,
                'contract_agreed' => true,
            ]);

            // Add random amenities for each staff member (2-5 amenities)
            $numAmenities = $faker->numberBetween(2, 5);
            $selectedAmenities = $faker->randomElements($commonAmenities, $numAmenities);
            
            foreach ($selectedAmenities as $amenity) {
                $staff->amenities()->create([
                    'name' => $amenity['name'],
                    'description' => $amenity['description'],
                ]);
            }

            $this->command->info("Created staff: {$staff->staff_name} (ID: {$staff->staff_id}) - Position: {$staff->position}");
        }

        $this->command->info('Complete staff seeder finished! Created 20 staff members with amenities.');
    }
}
