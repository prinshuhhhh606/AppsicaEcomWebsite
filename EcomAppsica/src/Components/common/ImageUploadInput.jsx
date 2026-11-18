import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  X,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { getPublicImageUrl, validateImageFile } from '../../utils/imageHelper';
import './ImageUploadInput.css';

/**
 * Universal Image Upload & URL input component
 * Supports both Single image and Multiple image galleries
 */
export default function ImageUploadInput({
  label,
  value,
  onChange,
  multiple = false,
  isCommaSeparated = false,
  placeholder = 'Paste image URL (e.g. https://...)...',
  maxFiles = 10,
  maxSizeMB = 10,
  required = false,
  helpText,
  samplePresets = [],
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState(null);

  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Normalize image list for internal representation
  const imagesList = React.useMemo(() => {
    if (!multiple) {
      return value ? [value] : [];
    }
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [value, multiple]);

  // Propagate changes to parent
  const emitChange = (newList) => {
    if (!multiple) {
      onChange(newList[0] || '');
      return;
    }
    if (isCommaSeparated) {
      onChange(newList.join(', '));
    } else {
      onChange(newList);
    }
  };

  const showNotification = (type, message) => {
    if (type === 'error') {
      setErrorMessage(message);
      setSuccessMessage('');
    } else {
      setSuccessMessage(message);
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3500);
    }
  };

  // Add URL handler
  const handleAddUrl = (e) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/uploads/')) {
      showNotification('error', 'Please provide a valid image URL starting with http://, https://, or /uploads/');
      return;
    }

    if (!multiple) {
      emitChange([trimmed]);
      setUrlInput('');
      showNotification('success', 'Image URL applied!');
    } else {
      if (imagesList.length >= maxFiles) {
        showNotification('error', `Maximum limit of ${maxFiles} images reached.`);
        return;
      }
      emitChange([...imagesList, trimmed]);
      setUrlInput('');
      showNotification('success', 'Image URL added to gallery!');
    }
  };

  // Process and upload file list from input or dropzone
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate each file
    for (const file of fileArray) {
      const validation = validateImageFile(file, maxSizeMB);
      if (!validation.valid) {
        showNotification('error', validation.error);
        return;
      }
    }

    // Check count for multiple mode
    if (multiple && imagesList.length + fileArray.length > maxFiles) {
      showNotification('error', `You can only have up to ${maxFiles} images. (Currently have ${imagesList.length})`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!multiple || fileArray.length === 1) {
        const file = fileArray[0];
        const res = await uploadService.uploadSingle(file, (percent) => {
          setUploadProgress(percent);
        });

        if (res && res.url) {
          if (replacingIndex !== null && multiple) {
            const updated = [...imagesList];
            updated[replacingIndex] = res.url;
            emitChange(updated);
            setReplacingIndex(null);
            showNotification('success', 'Image replaced successfully!');
          } else if (!multiple) {
            emitChange([res.url]);
            showNotification('success', 'Image uploaded successfully!');
          } else {
            emitChange([...imagesList, res.url]);
            showNotification('success', 'Image uploaded to gallery!');
          }
        } else {
          throw new Error(res?.message || 'Failed to get image URL from upload response');
        }
      } else {
        // Multiple files batch upload
        const res = await uploadService.uploadMultiple(fileArray, (percent) => {
          setUploadProgress(percent);
        });

        if (res && Array.isArray(res.urls)) {
          emitChange([...imagesList, ...res.urls]);
          showNotification('success', `${res.urls.length} images uploaded to gallery!`);
        } else {
          throw new Error(res?.message || 'Failed to upload images batch');
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed. Please check network connection.';
      showNotification('error', msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Remove single image or specific index
  const handleRemove = (indexToRemove = 0) => {
    if (!multiple) {
      emitChange([]);
    } else {
      const filtered = imagesList.filter((_, i) => i !== indexToRemove);
      emitChange(filtered);
    }
    showNotification('success', 'Image removed.');
  };

  // Set image as cover (index 0)
  const handleSetCover = (idx) => {
    if (idx === 0) return;
    const item = imagesList[idx];
    const withoutItem = imagesList.filter((_, i) => i !== idx);
    emitChange([item, ...withoutItem]);
    showNotification('success', 'Set as primary cover image.');
  };

  // Trigger file dialog to replace image
  const triggerReplace = (index = 0) => {
    setReplacingIndex(index);
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  return (
    <div className="image-input-container">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple={false}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Header / Label */}
      <div className="image-input-header">
        <label className="image-input-label">
          <ImageIcon size={16} />
          {label || (multiple ? 'Image Gallery & Photos' : 'Image')}
          {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {multiple && (
          <span className="image-input-counter">
            {imagesList.length} / {maxFiles} images
          </span>
        )}
      </div>

      {/* URL Input and Action Buttons Row */}
      <div className="image-input-bar">
        <div className="image-input-url-wrapper">
          <LinkIcon size={14} className="image-input-url-icon" />
          <input
            type="text"
            className="image-input-text"
            placeholder={placeholder}
            value={!multiple && imagesList.length > 0 && !urlInput ? imagesList[0] : urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (!multiple) {
                emitChange([e.target.value]);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
        </div>

        {multiple ? (
          <button
            type="button"
            className="image-input-btn image-input-btn-secondary"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
          >
            Add URL
          </button>
        ) : null}

        <button
          type="button"
          className="image-input-btn image-input-btn-upload"
          onClick={() => {
            setReplacingIndex(null);
            fileInputRef.current?.click();
          }}
          disabled={isUploading || (multiple && imagesList.length >= maxFiles)}
          title="Upload image from your device or mobile gallery"
        >
          <Upload size={14} />
          Upload Image
        </button>
      </div>

      {/* Drag & Drop Zone */}
      {(!multiple && imagesList.length === 0) || (multiple && imagesList.length < maxFiles) ? (
        <div
          className={`image-dropzone ${isDragOver ? 'active-drag' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            setReplacingIndex(null);
            fileInputRef.current?.click();
          }}
        >
          <Upload size={22} className="image-dropzone-icon" />
          <div className="image-dropzone-title">
            Drag & drop image{multiple ? 's' : ''} here, or <span>browse from device</span>
          </div>
          <div className="image-dropzone-sub">Supports JPG, JPEG, PNG, WEBP up to {maxSizeMB}MB</div>
        </div>
      ) : null}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="image-upload-status loading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <RefreshCw size={14} className="spin-icon" /> Uploading image to server...
            </span>
            <span style={{ fontWeight: 700 }}>{uploadProgress}%</span>
          </div>
          <div className="image-progress-bar-wrap">
            <div className="image-progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="image-upload-status success">
          <CheckCircle size={15} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="image-upload-status error">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quick sample presets if provided */}
      {samplePresets && samplePresets.length > 0 && imagesList.length < maxFiles && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} /> Quick samples:
          </span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (multiple) {
                  emitChange([...imagesList, preset.url]);
                } else {
                  emitChange([preset.url]);
                }
              }}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#cbd5e1',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              + {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Single Image Preview Card */}
      {!multiple && imagesList.length > 0 && (
        <div className="image-single-preview-card">
          <img
            src={getPublicImageUrl(imagesList[0])}
            alt="Preview"
            className="image-single-preview-thumb"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/120x120/1e293b/94a3b8?text=Image+Error';
            }}
          />
          <div className="image-single-preview-info">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>Current Image Preview</span>
            <span className="image-single-preview-url" title={imagesList[0]}>
              {imagesList[0]}
            </span>
            <div className="image-single-preview-actions">
              <button
                type="button"
                className="image-input-btn image-input-btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => triggerReplace(0)}
                disabled={isUploading}
              >
                <RefreshCw size={12} /> Replace
              </button>
              <button
                type="button"
                className="image-input-btn image-input-btn-secondary"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
                onClick={() => handleRemove(0)}
                disabled={isUploading}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Images Gallery Grid */}
      {multiple && imagesList.length > 0 && (
        <div className="image-gallery-grid">
          {imagesList.map((imgUrl, idx) => (
            <div key={idx} className="image-gallery-card">
              {idx === 0 && <span className="image-cover-badge">Cover</span>}
              <img
                src={getPublicImageUrl(imgUrl)}
                alt={`Photo ${idx + 1}`}
                className="image-gallery-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/120x120/1e293b/94a3b8?text=Broken+URL';
                }}
              />
              <div className="image-card-overlay">
                {idx > 0 && (
                  <button
                    type="button"
                    className="image-card-btn"
                    onClick={() => handleSetCover(idx)}
                    title="Make this primary cover photo"
                  >
                    ★ Cover
                  </button>
                )}
                <button
                  type="button"
                  className="image-card-btn"
                  onClick={() => triggerReplace(idx)}
                  disabled={isUploading}
                  title="Replace this image"
                >
                  <RefreshCw size={11} /> Replace
                </button>
                <button
                  type="button"
                  className="image-card-btn danger"
                  onClick={() => handleRemove(idx)}
                  disabled={isUploading}
                  title="Remove image from gallery"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {helpText && <div className="image-input-help">{helpText}</div>}
    </div>
  );
}
