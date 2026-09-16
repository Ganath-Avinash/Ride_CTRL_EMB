import { Router } from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFileById,
  getFileByUserAndType,
  deleteFile
} from '../controllers/fileController.js';

const router = Router();

// Configure Multer for memory buffering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedMime.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid format: Only PDF documents and JPG/PNG images are accepted.'));
    }
  }
});

// Upload document (license | insurance | puc)
router.post('/upload/:uid/:fileType', upload.single('file'), uploadFile);

// Stream / preview / download file by GridFS fileId
router.get('/:fileId', getFileById);

// Stream document directly by user UID and file type (e.g. /api/files/user/123/license)
router.get('/user/:uid/:fileType', getFileByUserAndType);

// Delete file
router.delete('/:fileId', deleteFile);

export default router;
