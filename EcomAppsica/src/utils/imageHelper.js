/**
 * Resolves an image URL to work across local dev, Vite proxy, and deployed production environments.
 * Handles:
 * - External absolute URLs (Unsplash, Cloudinary, AWS S3, etc.)
 * - Backend relative upload paths (/uploads/...)
 * - Local blobs and data URLs
 */
export const getPublicImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Local object URLs or Base64 data previews
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If already absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If stored URL points to localhost but the client is in production (or vice versa),
    // normalize the upload route if needed
    if (trimmed.includes('/uploads/')) {
      const backendOrigin = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '')
        .trim()
        .replace(/\/api\/?$/, '')
        .replace(/\/+$/, '');

      // In production with a custom backend origin, update localhost origin to remote origin
      if (backendOrigin && (trimmed.includes('localhost:') || trimmed.includes('127.0.0.1:'))) {
        const uploadPath = trimmed.substring(trimmed.indexOf('/uploads/'));
        return `${backendOrigin}${uploadPath}`;
      }
    }
    return trimmed;
  }

  // Relative upload paths like '/uploads/file.png' or 'uploads/file.png'
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const backendOrigin = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '')
      .trim()
      .replace(/\/api\/?$/, '')
      .replace(/\/+$/, '');

    if (backendOrigin) {
      return `${backendOrigin}${cleanPath}`;
    }
    return cleanPath;
  }

  return trimmed;
};

/**
 * Validates file format and file size
 * Allowed: JPG, JPEG, PNG, WEBP
 * Max default: 10MB
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  const validExts = ['jpg', 'jpeg', 'png', 'webp'];

  if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file format (${file.type || ext}). Only JPG, JPEG, PNG, and WEBP formats are supported.`,
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeInMB}MB). Maximum allowed size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
};
