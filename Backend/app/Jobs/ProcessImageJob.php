<?php

namespace App\Jobs;

use App\Services\ImageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProcessImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $tempPath;
    protected $directory;
    protected $oldPath;
    protected $modelClass;
    protected $modelId;
    protected $fieldName;

    /**
     * Create a new job instance.
     *
     * @param string $tempPath Path to the temporary stored image
     * @param string $directory Target directory for the processed image
     * @param string|null $oldPath Path to old image to delete (if replacing)
     * @param string|null $modelClass Class name of the model to update
     * @param int|null $modelId ID of the model to update
     * @param string $fieldName Field name in the model to update
     */
    public function __construct(
        string $tempPath,
        string $directory,
        ?string $oldPath = null,
        ?string $modelClass = null,
        ?int $modelId = null,
        string $fieldName = 'image'
    ) {
        $this->tempPath = $tempPath;
        $this->directory = $directory;
        $this->oldPath = $oldPath;
        $this->modelClass = $modelClass;
        $this->modelId = $modelId;
        $this->fieldName = $fieldName;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Get the full path to the temporary file
            $tempFullPath = storage_path('app/public/' . $this->tempPath);
            
            // Generate a unique filename with webp extension
            $filename = time() . '_' . substr(md5(uniqid()), 0, 10) . '.webp';
            $targetPath = storage_path('app/public/' . $this->directory . '/' . $filename);
            $relativePath = $this->directory . '/' . $filename;
            
            // Make sure the target directory exists
            if (!Storage::disk('public')->exists($this->directory)) {
                Storage::disk('public')->makeDirectory($this->directory);
            }
            
            // Create a new ImageManager instance with the GD driver
            $manager = new ImageManager(new Driver());
            
            // Open the image file
            $image = $manager->read($tempFullPath);
            
            // Resize if too large (keeping aspect ratio)
            $maxDimension = 1920; // Max width or height
            
            if ($image->width() > $maxDimension || $image->height() > $maxDimension) {
                $image->scaleDown(width: $maxDimension, height: $maxDimension);
            }
            
            // Make sure the target directory exists
            $targetDir = dirname($targetPath);
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }
            
            // Save as WebP with 85% quality
            $image->toWebp(85)->save($targetPath);
            
            // Delete the temporary file
            Storage::disk('public')->delete($this->tempPath);
            
            // Delete old file if it exists
            if ($this->oldPath) {
                Storage::disk('public')->delete($this->oldPath);
            }
            
            // Update the database record with the new path if model info is provided
            if ($this->modelClass && $this->modelId) {
                $model = $this->modelClass::find($this->modelId);
                if ($model) {
                    $model->{$this->fieldName} = $relativePath;
                    $model->save();
                }
            }
            
            Log::info("Image processed successfully: {$relativePath}");
        } catch (\Exception $e) {
            Log::error("Image processing failed: " . $e->getMessage());
        }
    }
}