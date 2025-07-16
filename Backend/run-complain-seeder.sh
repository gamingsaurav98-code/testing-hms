#!/bin/bash

# Run Complain Seeder
# This script runs only the complain seeder to populate complain and chat data

echo "🔄 Running Complain Seeder..."

# Run the specific seeder
php artisan db:seed --class=ComplainSeeder

echo "✅ Complain Seeder completed!"
echo ""
echo "📊 Database now contains:"
echo "   - Realistic complain records"
echo "   - Associated chat messages"
echo "   - Student and staff complains"
echo "   - Various status types (pending, in_progress, resolved, rejected)"
echo "   - Proper timestamps and statistics"
