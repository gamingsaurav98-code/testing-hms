<?php

namespace App\Services;

use App\Jobs\ProcessImageJob;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    /**
     * Process an uploaded image - optimize, convert to WebP, and store it
     *
     * @param UploadedFile $file The uploaded file
     * @param string $directory The directory to store the file in (relative to storage/app/public)
     * @param string|null $oldPath Path to old file to delete (if replacing)
     * @return string|null The path to the stored file or null if processing failed
     */
    public function processImage(UploadedFile $file, string $directory, ?string $oldPath = null): ?string
    {
        try {
            // Delete old file if it exists
            if ($oldPath) {
                Storage::disk('public')->delete($oldPath);
            }

            // Generate a unique filename with webp extension
            $filename = time() . '_' . Str::random(10) . '.webp';
            $tempPath = $file->getPathname();
            $targetPath = storage_path('app/public/' . $directory . '/' . $filename);
            
            // Make sure the target directory exists
            if (!Storage::disk('public')->exists($directory)) {
                Storage::disk('public')->makeDirectory($directory);
            }
            
            // Optimize the image based on its type
            $this->optimizeImage($tempPath);
            
            // Convert to WebP
            $this->convertToWebP($tempPath, $targetPath);
            
            return $directory . '/' . $filename;
        } catch (\Exception $e) {
            Log::error('Image processing failed: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Process an image asynchronously
     *
     * @param UploadedFile $file The uploaded file
     * @param string $directory The directory to store the file in
     * @param string|null $oldPath Path to old file to delete (if replacing)
     * @param string|null $modelClass Class name of the model to update
     * @param int|null $modelId ID of the model to update
     * @param string $fieldName Field name in the model to update
     * @return string The temporary path where the original file is stored
     */
    public function processImageAsync(
        UploadedFile $file, 
        string $directory, 
        ?string $oldPath = null,
        ?string $modelClass = null,
        ?int $modelId = null,
        string $fieldName = 'image'
    ): string {
        // Store the original file temporarily
        $originalFilename = time() . '_original_' . $file->getClientOriginalName();
        $path = $file->storeAs($directory . '/temp', $originalFilename, 'public');
        
        // Dispatch a job to process the image
        ProcessImageJob::dispatch(
            $path,
            $directory,
            $oldPath,
            $modelClass,
            $modelId,
            $fieldName
        );
        
        // Return the temporary path for immediate use
        return $path;
    }
    
    /**
     * Optimize an image using Intervention/Image
     *
     * @param string $path Path to the image file
     * @return void
     */
    public function optimizeImage(string $path): void
    {
        try {
            // Create a new ImageManager instance with the GD driver
            $manager = new ImageManager(new Driver());
            
            // Open the image file
            $image = $manager->read($path);
            
            // Resize if too large (keeping aspect ratio)
            $maxDimension = 1920; // Max width or height
            
            if ($image->width() > $maxDimension || $image->height() > $maxDimension) {
                $image->scaleDown(width: $maxDimension, height: $maxDimension);
            }
            
            // Optimize by reducing quality
            $image->save($path, quality: 85);
            
            Log::info("Image optimized: {$path}");
        } catch (\Exception $e) {
            Log::error("Failed to optimize image: {$e->getMessage()}");
        }
    }
    
    /**
     * Convert an image to WebP format using Intervention/Image
     *
     * @param string $sourcePath Path to the source image
     * @param string $targetPath Path where the WebP image should be saved
     * @return void
     */
    public function convertToWebP(string $sourcePath, string $targetPath): void
    {
        try {
            // Create a new ImageManager instance with the GD driver
            $manager = new ImageManager(new Driver());
            
            // Open the image file
            $image = $manager->read($sourcePath);
            
            // Make sure the directory exists
            $targetDir = dirname($targetPath);
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }
            
            // Save as WebP with 85% quality
            $image->toWebp(85)->save($targetPath);
            
            Log::info("Image converted to WebP: {$targetPath}");
        } catch (\Exception $e) {
            Log::error("Failed to convert image to WebP: {$e->getMessage()}");
            throw $e; // Re-throw to be handled by the caller
        }
    }
}