const path = require('path');

const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.trim().replace(/\/+$/, '');
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol || 'http';
  const host = req.get('host');
  return `${protocol}://${host}`;
};

const formatFileInfo = (req, file) => {
  const baseUrl = getBaseUrl(req);
  const relativePath = `/uploads/${file.filename}`;
  const fullUrl = `${baseUrl}${relativePath}`;

  return {
    url: fullUrl,
    relativePath,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  };
};

// POST /api/upload/single
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select an image file to upload.',
      });
    }

    const fileData = formatFileInfo(req, req.file);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      ...fileData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  }
};

// POST /api/upload/multiple
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files uploaded. Please select one or more images.',
      });
    }

    const filesData = req.files.map((file) => formatFileInfo(req, file));
    const urls = filesData.map((f) => f.url);

    return res.status(200).json({
      success: true,
      message: `${filesData.length} image(s) uploaded successfully`,
      urls,
      files: filesData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Multiple images upload failed',
    });
  }
};
