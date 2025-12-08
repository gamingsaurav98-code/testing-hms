#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until php artisan db:monitor 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 1  # Reduced from 2 seconds to 1 second for faster startup
done

echo "Database is ready!"

# Run Laravel setup commands
cd /var/www/html

# Clear any cached configurations
php artisan config:clear || true

# Clear cache (only if cache table exists)
php artisan cache:clear || echo "Cache table doesn't exist yet, skipping cache clear"

# Create storage link
php artisan storage:link || echo "Storage link already exists"

# Run migrations
php artisan migrate --force || echo "Migration failed, continuing..."

# Start the server
echo "Starting Laravel development server..."
php artisan serve --host=0.0.0.0 --port=8000
