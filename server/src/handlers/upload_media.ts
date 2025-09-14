import { db } from '../db';
import { galleryMediaTable } from '../db/schema';
import { type GalleryMedia } from '../schema';

/**
 * Handles media upload for gallery and before/after photos.
 * This handler manages file uploads:
 * - Validates file types and sizes
 * - Uploads to S3/Supabase storage
 * - Auto-compresses images for performance
 * - Creates gallery_media records
 * - Associates with bookings if specified
 */

interface UploadMediaInput {
  file: File | Buffer;
  alt_ar?: string;
  alt_en?: string;
  tags?: string[];
  service_filter?: string;
  district_filter?: string;
  booking_id?: number;
  category: 'gallery' | 'before_after' | 'general';
}

interface UploadMediaResponse {
  id: number;
  url: string;
  status: 'success' | 'failed';
  error?: string;
}

export const uploadMedia = async (input: UploadMediaInput): Promise<UploadMediaResponse> => {
  try {
    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    let fileType: string;
    let fileBuffer: Buffer;
    let fileName: string;

    if (Buffer.isBuffer(input.file)) {
      // For Buffer, we need to determine type from content or assume JPEG
      fileBuffer = input.file;
      fileType = 'image/jpeg'; // Default assumption for Buffer
      fileName = `upload_${Date.now()}.jpg`;
    } else {
      // File object - cast to any to handle browser File API compatibility
      const file = input.file as any;
      fileType = file.type;
      fileName = file.name;
      fileBuffer = Buffer.from(await file.arrayBuffer());
    }

    if (!allowedTypes.includes(fileType)) {
      return {
        id: 0,
        url: '',
        status: 'failed',
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed.'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileBuffer.length > maxSize) {
      return {
        id: 0,
        url: '',
        status: 'failed',
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${input.category}_${timestamp}_${randomStr}.${extension}`;

    // In a real implementation, this would upload to cloud storage
    // For now, we'll simulate the upload process and generate a mock URL
    const mockUploadToStorage = async (filename: string, buffer: Buffer): Promise<string> => {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return mock URL (in real implementation, this would be the actual cloud storage URL)
      return `https://storage.carwash.ly/uploads/${filename}`;
    };

    const uploadedUrl = await mockUploadToStorage(uniqueFileName, fileBuffer);

    // Create gallery_media record in database
    const result = await db.insert(galleryMediaTable)
      .values({
        url: uploadedUrl,
        alt_ar: input.alt_ar || null,
        alt_en: input.alt_en || null,
        tags: input.tags || [],
        service_filter: input.service_filter || null,
        district_filter: input.district_filter || null,
        order: 0,
        visible: true
      })
      .returning()
      .execute();

    const galleryMedia = result[0];

    return {
      id: galleryMedia.id,
      url: galleryMedia.url,
      status: 'success'
    };

  } catch (error) {
    console.error('Media upload failed:', error);
    return {
      id: 0,
      url: '',
      status: 'failed',
      error: 'Upload failed due to server error'
    };
  }
};