# HMS Laravel Sanctum Authentication Setup Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HMS Laravel Sanctum Authentication Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if XAMPP MySQL is running
Write-Host "Step 1: Checking MySQL Connection..." -ForegroundColor Yellow
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"

if (Test-Path $mysqlPath) {
    Write-Host "XAMPP MySQL found!" -ForegroundColor Green
    
    # Test MySQL connection
    $testConnection = & $mysqlPath -u root -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MySQL is running!" -ForegroundColor Green
    } else {
        Write-Host "MySQL is not running. Please start XAMPP MySQL service." -ForegroundColor Red
        Write-Host "1. Open XAMPP Control Panel: C:\xampp\xampp-control.exe" -ForegroundColor Yellow
        Write-Host "2. Start the MySQL service" -ForegroundColor Yellow
        $response = Read-Host "Press Enter after starting MySQL service..."
    }
} else {
    Write-Host "XAMPP MySQL not found. Please install XAMPP." -ForegroundColor Red
    exit 1
}

# Step 2: Create Database
Write-Host ""
Write-Host "Step 2: Creating Database..." -ForegroundColor Yellow
try {
    & $mysqlPath -u root -e "CREATE DATABASE IF NOT EXISTS hms_db;"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database 'hms_db' created successfully!" -ForegroundColor Green
    } else {
        throw "Failed to create database"
    }
} catch {
    Write-Host "Failed to create database. Error: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Install Composer Dependencies
Write-Host ""
Write-Host "Step 3: Installing Composer Dependencies..." -ForegroundColor Yellow
try {
    composer install --no-interaction
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Composer dependencies installed successfully!" -ForegroundColor Green
    } else {
        throw "Failed to install composer dependencies"
    }
} catch {
    Write-Host "Failed to install composer dependencies. Error: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Generate Application Key (if not exists)
Write-Host ""
Write-Host "Step 4: Generating Application Key..." -ForegroundColor Yellow
try {
    php artisan key:generate --force
    Write-Host "Application key generated!" -ForegroundColor Green
} catch {
    Write-Host "Failed to generate application key. Error: $_" -ForegroundColor Red
}

# Step 5: Publish Sanctum Configuration
Write-Host ""
Write-Host "Step 5: Publishing Sanctum Configuration..." -ForegroundColor Yellow
try {
    php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force
    Write-Host "Sanctum configuration published!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Failed to publish Sanctum configuration. Error: $_" -ForegroundColor Yellow
}

# Step 6: Run Database Migrations
Write-Host ""
Write-Host "Step 6: Running Database Migrations..." -ForegroundColor Yellow
try {
    php artisan migrate --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database migrations completed successfully!" -ForegroundColor Green
    } else {
        throw "Failed to run migrations"
    }
} catch {
    Write-Host "Failed to run migrations. Error: $_" -ForegroundColor Red
    exit 1
}

# Step 7: Clear Cache
Write-Host ""
Write-Host "Step 7: Clearing Cache..." -ForegroundColor Yellow
try {
    php artisan config:clear
    php artisan cache:clear
    php artisan route:clear
    Write-Host "Cache cleared successfully!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Failed to clear some cache. Error: $_" -ForegroundColor Yellow
}

# Step 8: Optional Seeders
Write-Host ""
$runSeeders = Read-Host "Do you want to run database seeders? (y/N)"
if ($runSeeders -eq "y" -or $runSeeders -eq "Y") {
    Write-Host "Running Database Seeders..." -ForegroundColor Yellow
    try {
        php artisan db:seed
        Write-Host "Seeders completed!" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Some seeders failed. Error: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping seeders." -ForegroundColor Yellow
}

# Final Instructions
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Laravel API with Sanctum authentication is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "API Base URL: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Authentication Endpoints:" -ForegroundColor White
Write-Host "- POST /api/auth/login" -ForegroundColor Gray
Write-Host "- POST /api/auth/register" -ForegroundColor Gray
Write-Host "- GET /api/auth/me" -ForegroundColor Gray
Write-Host "- POST /api/auth/logout" -ForegroundColor Gray
Write-Host "- POST /api/auth/change-password" -ForegroundColor Gray
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor White
Write-Host "php artisan serve" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed API documentation, check:" -ForegroundColor White
Write-Host "AUTHENTICATION_API_DOCS.md" -ForegroundColor Cyan
Write-Host ""

$startServer = Read-Host "Do you want to start the development server now? (y/N)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host ""
    Write-Host "Starting Laravel development server..." -ForegroundColor Yellow
    php artisan serve
}
