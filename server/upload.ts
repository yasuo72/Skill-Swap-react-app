import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PROFILE_IMAGES_DIR = path.join(UPLOAD_DIR, 'profile-images');

async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(PROFILE_IMAGES_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

// Initialize directories
ensureDirectoriesExist();

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export class FileUploadService {
  /**
   * Process and save profile image
   */
  static async processProfileImage(
    file: Express.Multer.File,
    userId: number
  ): Promise<string> {
    try {
      const fileExtension = 'webp'; // Convert all images to WebP for consistency
      const fileName = `profile-${userId}-${uuidv4()}.${fileExtension}`;
      const filePath = path.join(PROFILE_IMAGES_DIR, fileName);

      // Process image with Sharp
      await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(filePath);

      // Return the public URL path
      return `/uploads/profile-images/${fileName}`;
    } catch (error) {
      console.error('Error processing profile image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Delete old profile image
   */
  static async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
        return;
      }

      const filePath = path.join(process.cwd(), imageUrl);
      await fs.unlink(filePath);
    } catch (error) {
      // Don't throw error if file doesn't exist
      console.warn('Could not delete old profile image:', error);
    }
  }

  /**
   * Generate thumbnail for images
   */
  static async generateThumbnail(
    file: Express.Multer.File,
    size: number = 150
  ): Promise<Buffer> {
    return await sharp(file.buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer();
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: Express.Multer.File): boolean {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    return allowedMimeTypes.includes(file.mimetype);
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean up old files (run as background job)
   */
  static async cleanupOldFiles(olderThanDays: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(PROFILE_IMAGES_DIR);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      for (const file of files) {
        const filePath = path.join(PROFILE_IMAGES_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  }
}

// Middleware for handling upload errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      message: 'Only image files are allowed.'
    });
  }

  return res.status(500).json({
    message: 'File upload failed.'
  });
};
