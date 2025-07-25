# =============================================================================
# HMS Docker Authentication Setup Script (PowerShell)
# =============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HMS Laravel Sanctum Authentication Setup (Docker)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker and try again" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker Compose configuration found" -ForegroundColor Green

# Start Docker services
Write-Host ""
Write-Host "Step 1: Starting Docker services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
docker-compose up -d

# Wait for database to be ready
Write-Host ""
Write-Host "Step 2: Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if containers are running
$backendRunning = docker ps --format "table {{.Names}}" | Select-String "hms_backend"
$databaseRunning = docker ps --format "table {{.Names}}" | Select-String "hms_database"

if (!$backendRunning) {
    Write-Host "❌ Backend container is not running" -ForegroundColor Red
    Write-Host "Please check Docker logs: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Backend container is running" -ForegroundColor Green

if (!$databaseRunning) {
    Write-Host "❌ Database container is not running" -ForegroundColor Red
    Write-Host "Please check Docker logs: docker-compose logs database" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Database container is running" -ForegroundColor Green

# Install Laravel dependencies
Write-Host ""
Write-Host "Step 3: Installing PHP dependencies..." -ForegroundColor Yellow
docker-compose exec backend composer install --no-interaction

# Generate application key
Write-Host ""
Write-Host "Step 4: Generating application key..." -ForegroundColor Yellow
docker-compose exec backend php artisan key:generate

# Run database migrations
Write-Host ""
Write-Host "Step 5: Running database migrations..." -ForegroundColor Yellow
docker-compose exec backend php artisan migrate --force

# Publish Sanctum configuration
Write-Host ""
Write-Host "Step 6: Publishing Sanctum configuration..." -ForegroundColor Yellow
docker-compose exec backend php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force

# Clear application cache
Write-Host ""
Write-Host "Step 7: Clearing application cache..." -ForegroundColor Yellow
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan route:clear

# Create test admin user
Write-Host ""
Write-Host "Step 8: Creating test admin user..." -ForegroundColor Yellow
$createUserScript = @"
`$user = \App\Models\User::firstOrCreate(
    ['email' => 'admin@hms.com'],
    [
        'name' => 'Admin User',
        'password' => bcrypt('password123'),
        'role' => 'admin',
        'is_active' => true
    ]
);
echo 'Admin user created: ' . `$user->email;
"@

docker-compose exec backend php artisan tinker --execute="$createUserScript"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your HMS application is now running:" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "phpMyAdmin: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Admin Credentials:" -ForegroundColor White
Write-Host "Email: admin@hms.com" -ForegroundColor Yellow
Write-Host "Password: password123" -ForegroundColor Yellow
Write-Host ""
Write-Host "API Documentation: /Backend/AUTHENTICATION_API_DOCS.md" -ForegroundColor White
Write-Host ""
Write-Host "Useful Docker commands:" -ForegroundColor White
Write-Host "- View logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "- Stop services: docker-compose down" -ForegroundColor Gray
Write-Host "- Restart services: docker-compose restart" -ForegroundColor Gray
Write-Host "- Access backend shell: docker-compose exec backend bash" -ForegroundColor Gray
Write-Host ""
