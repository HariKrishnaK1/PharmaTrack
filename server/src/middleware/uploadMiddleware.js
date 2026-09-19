import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import { config } from '../config/env.js';

// Configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

// Use Cloudinary storage if credentials are set, otherwise use local disk (dev fallback)
let storage;
if (config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'pharmatrack/documents',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xlsx'],
      resource_type: 'auto',
    },
  });
} else {
  // Local disk storage for dev (files saved in server/uploads/)
  const { default: multerDisk } = await import('multer');
  storage = multerDisk.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|jpg|jpeg|png|doc|docx|xlsx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext.replace('.', ''))) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, images, Word and Excel files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export { cloudinary };
