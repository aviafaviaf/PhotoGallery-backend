import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'photo-gallery',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: file.originalname.split('.')[0],
  }),
});

export const cloudinaryUpload = multer({ storage });