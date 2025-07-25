@echo off
echo ============================================
echo HMS Laravel Sanctum Authentication Setup
echo ============================================
echo.

echo Step 1: Starting XAMPP MySQL Service...
echo Please manually start XAMPP Control Panel and start MySQL service
echo Path: C:\xampp\xampp-control.exe
echo.
pause

echo Step 2: Creating Database...
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS hms_db;"
if %ERRORLEVEL% == 0 (
    echo Database 'hms_db' created successfully!
) else (
    echo Failed to create database. Please ensure MySQL is running.
    pause
    exit /b 1
)

echo.
echo Step 3: Installing Composer Dependencies...
composer install
if %ERRORLEVEL% == 0 (
    echo Composer dependencies installed successfully!
) else (
    echo Failed to install composer dependencies.
    pause
    exit /b 1
)

echo.
echo Step 4: Running Database Migrations...
php artisan migrate --force
if %ERRORLEVEL% == 0 (
    echo Database migrations completed successfully!
) else (
    echo Failed to run migrations.
    pause
    exit /b 1
)

echo.
echo Step 5: Publishing Sanctum Migration...
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
if %ERRORLEVEL% == 0 (
    echo Sanctum configuration published successfully!
) else (
    echo Failed to publish Sanctum configuration.
)

echo.
echo Step 6: Running Sanctum Migrations...
php artisan migrate --force
if %ERRORLEVEL% == 0 (
    echo Sanctum migrations completed successfully!
) else (
    echo Failed to run Sanctum migrations.
)

echo.
echo Step 7: Clearing Cache...
php artisan config:clear
php artisan cache:clear
php artisan route:clear
echo Cache cleared successfully!

echo.
echo Step 8: Running Seeders (Optional)...
set /p runSeeders="Do you want to run database seeders? (y/N): "
if /i "%runSeeders%"=="y" (
    php artisan db:seed
    echo Seeders completed!
) else (
    echo Skipping seeders.
)

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Your Laravel API with Sanctum authentication is now ready!
echo.
echo API Base URL: http://localhost:8000/api
echo.
echo Test the authentication endpoints:
echo - POST /api/auth/login
echo - POST /api/auth/register
echo - GET /api/auth/me
echo - POST /api/auth/logout
echo.
echo To start the development server, run:
echo php artisan serve
echo.
pause
