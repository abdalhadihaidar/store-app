// imageUpload.controller.ts
import { Request, Response } from 'express';

export class ImageUploadController {
  /**
   * Validates image paths sent from frontend
   * This endpoint now only validates paths, doesn't handle file uploads
   */
  static async validateImagePaths(req: Request, res: Response): Promise<void> {
    try {
      const { imagePaths } = req.body;

      if (!imagePaths || !Array.isArray(imagePaths)) {
        res.status(400).json({
          message: 'Image paths array is required'
        });
        return;
      }

      if (imagePaths.length > 4) {
        res.status(400).json({
          message: 'Maximum 4 images allowed'
        });
        return;
      }

      // Validate that all paths are valid URLs or relative paths
      const validPaths = imagePaths.filter(path => {
        return typeof path === 'string' && 
               (path.startsWith('http') || path.startsWith('/') || path.startsWith('./'));
      });

      if (validPaths.length !== imagePaths.length) {
        res.status(400).json({
          message: 'Invalid image path format'
        });
        return;
      }

      res.json({ 
        success: true,
        message: 'Image paths validated successfully',
        imagePaths: validPaths
      });

    } catch (error) {
      res.status(500).json({ 
        message: 'Image path validation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Legacy endpoint for backward compatibility
   * Now returns a message directing to use frontend upload
   */
  static async uploadImages(req: Request, res: Response): Promise<void> {
    res.status(410).json({
      message: 'File upload endpoint deprecated. Please use frontend upload service.',
      instructions: 'Upload files directly from frontend to your hosting service, then send image paths to this API.'
    });
  }
}