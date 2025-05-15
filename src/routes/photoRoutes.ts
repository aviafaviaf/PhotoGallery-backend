import express from 'express';
import multer from 'multer';
import { uploadPhoto, getPhotos, getMyPhotos, deletePhoto, getPhotosByUser,
    togglePublishStatus, addFavorite, removeFavorite, getFavorites,
    getCommentsByPhoto, addComment, deleteComment, photoDetails } from '../controllers/photoController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();



const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post('/upload', authenticateToken, upload.single('photo'), uploadPhoto);
router.delete('/:id', authenticateToken, deletePhoto);
router.get('/', getPhotos);
router.get('/my', authenticateToken, getMyPhotos);
router.get('/user/:id', getPhotosByUser);
router.patch('/:id/publish', authenticateToken, togglePublishStatus);

router.post('/:photoId/favorite', authenticateToken, addFavorite);
router.delete('/:photoId/favorite', authenticateToken, removeFavorite);
router.get('/favorites', authenticateToken, getFavorites);

router.post('/:photoId/comments', authenticateToken, addComment);
router.get('/:photoId/comments', getCommentsByPhoto);
router.delete('/comments/:id', authenticateToken, deleteComment);

router.get('/:id/details', photoDetails);
export default router;
