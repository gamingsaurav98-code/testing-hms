#!/bin/bash
# =============================================================================
# HMS Docker Authentication Setup Script
# =============================================================================

echo "============================================"
echo "HMS Laravel Sanctum Authentication Setup (Docker)"
echo "============================================"

# Check if Docker is running
if ! docker --version >/dev/null 2>&1; then
    echo "❌ Docker is not installed or not running"
    echo "Please install Docker and try again"
    exit 1
fi

echo "✅ Docker is available"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "✅ Docker Compose configuration found"

# Start Docker services
echo ""
echo "Step 1: Starting Docker services..."
echo "This may take a few minutes on first run..."
docker-compose up -d

# Wait for database to be ready
echo ""
echo "Step 2: Waiting for database to be ready..."
sleep 10

# Check if backend container is running
if ! docker ps | grep -q "hms_backend"; then
    echo "❌ Backend container is not running"
    echo "Please check Docker logs: docker-compose logs backend"
    exit 1
fi

echo "✅ Backend container is running"

# Check if database container is running
if ! docker ps | grep -q "hms_database"; then
    echo "❌ Database container is not running"
    echo "Please check Docker logs: docker-compose logs database"
    exit 1
fi

echo "✅ Database container is running"

# Install Laravel dependencies
echo ""
echo "Step 3: Installing PHP dependencies..."
docker-compose exec backend composer install --no-interaction

# Generate application key
echo ""
echo "Step 4: Generating application key..."
docker-compose exec backend php artisan key:generate

# Run database migrations
echo ""
echo "Step 5: Running database migrations..."
docker-compose exec backend php artisan migrate --force

# Publish Sanctum configuration (if not already published)
echo ""
echo "Step 6: Publishing Sanctum configuration..."
docker-compose exec backend php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force

# Clear application cache
echo ""
echo "Step 7: Clearing application cache..."
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan route:clear

# Create a test admin user
echo ""
echo "Step 8: Creating test admin user..."
docker-compose exec backend php artisan tinker --execute="
\$user = \App\Models\User::firstOrCreate(
    ['email' => 'admin@hms.com'],
    [
        'name' => 'Admin User',
        'password' => bcrypt('password123'),
        'role' => 'admin',
        'is_active' => true
    ]
);
echo 'Admin user created: ' . \$user->email;
"

echo ""
echo "============================================"
echo "🎉 Setup Complete!"
echo "============================================"
echo ""
echo "Your HMS application is now running:"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "🗄️  phpMyAdmin: http://localhost:8080"
echo ""
echo "Test Admin Credentials:"
echo "📧 Email: admin@hms.com"
echo "🔑 Password: password123"
echo ""
echo "API Documentation: /Backend/AUTHENTICATION_API_DOCS.md"
echo ""
echo "Useful Docker commands:"
echo "• View logs: docker-compose logs -f"
echo "• Stop services: docker-compose down"
echo "• Restart services: docker-compose restart"
echo "• Access backend shell: docker-compose exec backend bash"
echo ""
