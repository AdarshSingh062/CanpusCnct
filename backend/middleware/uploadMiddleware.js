const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...IMAGE_TYPES,
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Builds a Cloudinary-backed multer uploader.
 * @param {string} folder - Cloudinary folder, e.g. 'campusconnect/posts'
 * @param {'image'|'document'} kind
 * @param {number} maxCount
 */
function makeUploader(folder, kind = 'image', maxCount = 5) {
  const allowed = kind === 'document' ? DOC_TYPES : IMAGE_TYPES;
  const maxSize = kind === 'document' ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `campusconnect/${folder}`,
      resource_type: 'auto',
      allowed_formats: kind === 'document'
        ? ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'jpg', 'jpeg', 'png']
        : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxSize, files: maxCount },
    fileFilter: (req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
      }
      cb(null, true);
    },
  });

  return upload;
}

module.exports = { makeUploader };
