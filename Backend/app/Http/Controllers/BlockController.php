<?php

namespace App\Http\Controllers;

use App\Models\Block;
use Illuminate\Http\Request;
use App\Services\ImageService;
use App\Services\DateService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BlockController extends Controller
{
    protected $imageService;
    protected $dateService;

    public function __construct(ImageService $imageService, DateService $dateService)
    {
        $this->imageService = $imageService;
        $this->dateService = $dateService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            if ($request->has('all') && $request->all == 'true') {
                // Return all blocks without pagination when 'all=true'
                $blocks = Block::all();
            } else {
                // Otherwise, return paginated blocks
                $blocks = Block::paginate(10);
            }
            return response()->json($blocks);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch blocks: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'block_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'manager_name' => 'required|string|max:255',
            'manager_contact' => 'required|string|max:255',
            'remarks' => 'nullable|string|max:1000',
            'block_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $blockData = $request->except('block_attachment');
            $blockData['created_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle file upload if present
            if ($request->hasFile('block_attachment')) {
                $file = $request->file('block_attachment');
                // Use synchronous processing instead of async
                $path = $this->imageService->processImage($file, 'blocks', null);
                
                if (!$path) {
                    throw new \Exception("The block attachment failed to upload.");
                }
                
                $blockData['block_attachment'] = $path;
            }
            
            $block = Block::create($blockData);
            return response()->json($block, 201);
            
        } catch (\Exception $e) {
            // Delete the uploaded file if block creation fails
            if (isset($blockData['block_attachment'])) {
                Storage::disk('public')->delete($blockData['block_attachment']);
            }
            return response()->json(['message' => 'Failed to create block: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $block = Block::findOrFail($id);
            return response()->json($block);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Block not found'], 404);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Not needed for API
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'block_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'manager_name' => 'required|string|max:255',
            'manager_contact' => 'required|string|max:255',
            'remarks' => 'nullable|string|max:1000',
            'block_attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        try {
            $block = Block::findOrFail($id);
            $blockData = $request->except('block_attachment');
            $blockData['updated_at'] = $this->dateService->getCurrentDateTime();
            
            // Handle file upload if present
            if ($request->hasFile('block_attachment')) {
                $file = $request->file('block_attachment');
                // Use synchronous processing instead of async
                $path = $this->imageService->processImage($file, 'blocks', $block->block_attachment);
                
                if (!$path) {
                    throw new \Exception("The block attachment failed to upload.");
                }
                
                $blockData['block_attachment'] = $path;
            }
            
            $block->update($blockData);
            return response()->json($block);
            
        } catch (\Exception $e) {
            // Clean up if update fails
            if (isset($blockData['block_attachment']) && $request->hasFile('block_attachment')) {
                Storage::disk('public')->delete($blockData['block_attachment']);
            }
            return response()->json(['message' => 'Failed to update block: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $block = Block::findOrFail($id);
            if ($block->block_attachment) {
                Storage::disk('public')->delete($block->block_attachment);
            }
            $block->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete block: ' . $e->getMessage()], 500);
        }
    }
}
