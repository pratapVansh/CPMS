import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
}

export type DocumentType = 'resume' | 'marksheet';

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param userId - User ID for folder organization
 * @param docType - Type of document (resume or marksheet)
 * @returns Upload result with public_id and secure_url
 */
export async function uploadDocument(
  buffer: Buffer,
  userId: string,
  docType: DocumentType
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const folder = `cpms/${docType}s`;
    const publicId = `${folder}/${userId}_${docType}_${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: publicId,
        folder: undefined, // We include folder in public_id
        allowed_formats: ['pdf'],
        type: 'private', // Make uploads private/secure
        access_mode: 'authenticated',
        overwrite: true,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(AppError.internal('Failed to upload file to cloud storage', 'UPLOAD_FAILED'));
          return;
        }

        if (!result) {
          reject(AppError.internal('No result from cloud storage', 'UPLOAD_NO_RESULT'));
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public_id
 * @param publicId - The public_id of the file to delete
 */
export async function deleteDocument(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
      type: 'private',
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      console.warn('Cloudinary delete warning:', result);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw - we don't want to fail the whole operation if delete fails
    // The orphan file can be cleaned up later
  }
}

/**
 * Generate a signed URL for private document access
 * @param publicId - The public_id of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export function generateSignedUrl(publicId: string, expiresIn: number = 3600): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'private',
    sign_url: true,
    expires_at: timestamp,
    secure: true,
  });
}

/**
 * Validate that a file is a valid PDF
 * @param buffer - File buffer
 * @returns true if valid PDF
 */
export function isValidPdf(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-
  return buffer.slice(0, 5).equals(pdfSignature);
}

export { cloudinary };
