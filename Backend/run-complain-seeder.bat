@echo off
REM Run Complain Seeder
REM This script runs only the complain seeder to populate complain and chat data

echo 🔄 Running Complain Seeder...

REM Run the specific seeder
php artisan db:seed --class=ComplainSeeder

echo ✅ Complain Seeder completed!
echo.
echo 📊 Database now contains:
echo    - Realistic complain records
echo    - Associated chat messages
echo    - Student and staff complains
echo    - Various status types (pending, in_progress, resolved, rejected)
echo    - Proper timestamps and statistics

pause
