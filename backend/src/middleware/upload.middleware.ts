import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { AppError } from '../utils/AppError';

// File size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only PDFs
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    cb(AppError.badRequest('Only PDF files are allowed', 'INVALID_FILE_TYPE'));
    return;
  }

  // Check file extension
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  if (fileExtension !== 'pdf') {
    cb(AppError.badRequest('Only PDF files are allowed', 'INVALID_FILE_EXTENSION'));
    return;
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2, // Maximum 2 files (resume + marksheet)
  },
});

// Middleware for single resume upload
export const uploadResume = upload.single('resume');

// Middleware for single marksheet upload
export const uploadMarksheet = upload.single('marksheet');

// Middleware for both documents
export const uploadDocuments = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
]);

// Error handling middleware for multer errors
export function handleMulterError(
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        next(AppError.badRequest('File size exceeds 5MB limit', 'FILE_TOO_LARGE'));
        break;
      case 'LIMIT_FILE_COUNT':
        next(AppError.badRequest('Too many files uploaded', 'TOO_MANY_FILES'));
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        next(AppError.badRequest('Unexpected file field', 'UNEXPECTED_FILE_FIELD'));
        break;
      default:
        next(AppError.badRequest(`Upload error: ${err.message}`, 'UPLOAD_ERROR'));
    }
  } else if (err instanceof AppError) {
    next(err);
  } else {
    next(AppError.internal('File upload failed', 'UPLOAD_FAILED'));
  }
}

// Validate file content (check PDF signature)
export function validatePdfContent(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const files: Express.Multer.File[] = [];

  // Collect files from different upload types
  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      // req.files is an object with field names as keys
      Object.values(req.files).forEach((fileArray) => {
        files.push(...fileArray);
      });
    }
  }

  // Validate each file's content
  for (const file of files) {
    console.log(`🔍 Validating PDF: ${file.originalname}`);
    console.log(`   MIME type: ${file.mimetype}`);
    console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
    
    // Check PDF magic bytes (%PDF-)
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]);
    if (!file.buffer.slice(0, 5).equals(pdfSignature)) {
      console.error(`❌ Invalid PDF signature for file: ${file.originalname}`);
      throw AppError.badRequest(
        `File "${file.originalname}" is not a valid PDF. Please ensure you're uploading a proper PDF file.`,
        'INVALID_PDF_CONTENT'
      );
    }
    console.log(`✅ PDF validation passed: ${file.originalname}`);
  }

  next();
}
