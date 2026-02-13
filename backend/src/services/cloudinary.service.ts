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

// Validate Cloudinary configuration on startup
if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  console.error('❌ CLOUDINARY CONFIGURATION ERROR: Missing credentials');
  console.error('   Please check your .env file for:');
  console.error('   - CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET');
} else {
  console.log('✅ Cloudinary configured successfully');
  console.log(`   Cloud Name: ${env.CLOUDINARY_CLOUD_NAME}`);
}

export interface UploadResult {
  publicId: string;
  secureUrl: string;
}

export type DocumentType = 'resume' | 'marksheet';

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer
 * @param rollNo - Student roll number for filename
 * @param docType - Type of document (resume or marksheet)
 * @returns Upload result with public_id and secure_url
 */
export async function uploadDocument(
  buffer: Buffer,
  rollNo: string,
  docType: DocumentType
): Promise<UploadResult> {
  // Validate inputs
  if (!buffer || buffer.length === 0) {
    console.error('❌ Upload Error: Empty buffer provided');
    throw AppError.badRequest('File buffer is empty', 'EMPTY_BUFFER');
  }

  if (!rollNo || rollNo.trim() === '') {
    console.error('❌ Upload Error: Roll number is required');
    throw AppError.badRequest('Roll number is required for file upload', 'MISSING_ROLL_NO');
  }

  if (!['resume', 'marksheet'].includes(docType)) {
    console.error('❌ Upload Error: Invalid document type:', docType);
    throw AppError.badRequest('Invalid document type', 'INVALID_DOC_TYPE');
  }

  // Check Cloudinary configuration
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary credentials not configured');
    throw AppError.internal('Cloud storage not configured. Please contact administrator.', 'CLOUDINARY_NOT_CONFIGURED');
  }

  return new Promise((resolve, reject) => {
    // Clean filename format: rollno_resume or rollno_marksheet
    const publicId = `cpms/${rollNo}_${docType}`;

    console.log(`📤 Uploading ${docType} for roll number: ${rollNo}`);
    console.log(`   File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Public ID: ${publicId}`);

      const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: 'image',
      public_id: publicId,
      allowed_formats: ['pdf'],
      unique_filename: false,
      overwrite: true,
    },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name,
          });
          reject(AppError.internal(
            `Failed to upload ${docType}: ${error.message || 'Unknown error'}`,
            'CLOUDINARY_UPLOAD_FAILED'
          ));
          return;
        }

        if (!result) {
          console.error('❌ No result from Cloudinary');
          reject(AppError.internal('No result from cloud storage', 'UPLOAD_NO_RESULT'));
          return;
        }

        console.log(`✅ Successfully uploaded ${docType}`);
        console.log(`   Public ID: ${result.public_id}`);
        console.log(`   Secure URL: ${result.secure_url}`);

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
 * Generate URL for document viewing (inline preview)
 * @param publicId - The public_id of the file
 * @returns URL for inline preview
 */
export function generatePreviewUrl(publicId: string): string {
  // For raw files, generate the base URL and add fl_attachment query parameter
  const baseUrl = cloudinary.url(publicId, {
    resource_type: 'image',
    secure: true,
    type: 'upload',
  });
  
  // Add fl_attachment=false to display inline in browser
  const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}fl_attachment=false`;
  
  console.log(`🔗 Generated preview URL for ${publicId}`);
  console.log(`   URL: ${url}`);
  return url;
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
