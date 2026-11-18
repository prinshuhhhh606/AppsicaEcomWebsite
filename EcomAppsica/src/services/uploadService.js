import api from './api';

export const uploadService = {
  /**
   * Upload a single image file from device
   * @param {File} file
   * @param {Function} [onProgress] - Callback with upload percent 0-100
   * @returns {Promise<{success: boolean, url: string, relativePath: string, filename: string}>}
   */
  uploadSingle: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },

  /**
   * Upload multiple image files from device
   * @param {File[] | FileList} files
   * @param {Function} [onProgress] - Callback with upload percent 0-100
   * @returns {Promise<{success: boolean, urls: string[], files: Array}>}
   */
  uploadMultiple: async (files, onProgress) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    const res = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },
};

export default uploadService;
