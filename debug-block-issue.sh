#!/bin/bash

echo "=== HMS Block Management - Debugging Block Not Found Issue ==="
echo ""

echo "1. Current blocks in database:"
curl -s -X GET http://localhost:8000/api/blocks -H "Accept: application/json" | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    blocks = data.get('data', [])
    print(f'   Total blocks: {len(blocks)}')
    for block in blocks:
        print(f'   - ID: {block[\"id\"]}, Name: {block[\"block_name\"]}, Location: {block[\"location\"]}')
    
    if blocks:
        print(f'\\n2. Testing valid URLs:')
        for block in blocks:
            print(f'   ✅ View: http://localhost:3000/admin/block/{block[\"id\"]}')
            print(f'   ✅ Edit: http://localhost:3000/admin/block/{block[\"id\"]}/edit')
except:
    print('   Error parsing JSON response')
"

echo ""
echo "3. Testing non-existent block ID (999):"
echo "   ❌ Should fail: http://localhost:3000/admin/block/999"
curl -s -X GET http://localhost:8000/api/blocks/999 -H "Accept: application/json"

echo ""
echo ""
echo "=== Debugging Information ==="
echo "If you're getting 'Block not found' error:"
echo "1. Check the URL you're trying to access"
echo "2. Make sure the block ID exists in the list above"
echo "3. Use the browser console to see detailed error logs"
echo "4. Click 'Show Available IDs' button on the error page"
echo ""
echo "=== Next Steps ==="
echo "1. Go to http://localhost:3000/admin/block to see all blocks"
echo "2. Click on a valid block to view/edit it"
echo "3. If you manually typed a URL, make sure the ID is correct"
