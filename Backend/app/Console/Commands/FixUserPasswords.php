<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class FixUserPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fix:passwords';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix user passwords for testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Fixing user passwords...');
        
        // Update admin password
        $admin = \App\Models\User::where('email', 'admin@hms.com')->first();
        if ($admin) {
            $admin->password = bcrypt('password');
            $admin->save();
            $this->info('Admin password updated');
        }
        
        // Update student password
        $student = \App\Models\User::where('email', 'student@hms.com')->first();
        if ($student) {
            $student->password = bcrypt('password');
            $student->save();
            $this->info('Student password updated');
        }
        
        // Update staff password
        $staff = \App\Models\User::where('email', 'staff@hms.com')->first();
        if ($staff) {
            $staff->password = bcrypt('password');
            $staff->save();
            $this->info('Staff password updated');
        }
        
        $this->info('All passwords fixed!');
        return 0;
    }
}
