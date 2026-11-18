const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase || 'image'}-${uniqueSuffix}${ext}`);
  },
});

// Allowed file types: JPG, JPEG, PNG, WEBP
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format (${ext || file.mimetype}). Only JPG, JPEG, PNG, and WEBP image files are allowed.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Wrapped single upload middleware for clean error handling
const handleSingleUpload = (fieldName = 'image') => {
  const multerSingle = upload.single(fieldName);
  return (req, res, next) => {
    multerSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size exceeds 10MB limit. Please choose a smaller image.',
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Failed to process uploaded file',
        });
      }
      next();
    });
  };
};

// Wrapped multiple upload middleware for clean error handling
const handleMultipleUpload = (fieldName = 'images', maxCount = 10) => {
  const multerArray = upload.array(fieldName, maxCount);
  return (req, res, next) => {
    multerArray(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'One or more files exceed the 10MB limit.',
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: `Too many files. Maximum allowed is ${maxCount} images at once.`,
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Failed to process uploaded files',
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadDir,
  handleSingleUpload,
  handleMultipleUpload,
};
