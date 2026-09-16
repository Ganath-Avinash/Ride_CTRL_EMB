import { Readable } from 'stream';
import mongoose from 'mongoose';
import { getGridFSBucket, isConnected } from '../db.js';
import { User } from '../models/User.js';

export async function uploadFile(req, res, next) {
  try {
    const { uid, fileType } = req.params; // 'license' | 'insurance' | 'puc'

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file received' });
    }

    if (!isConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected' });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'GridFS storage engine is not available' });
    }

    const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageFilename = `${uid}_${fileType}_${Date.now()}_${safeOriginalName}`;

    const readableStream = Readable.from(req.file.buffer);
    const uploadStream = bucket.openUploadStream(storageFilename, {
      contentType: req.file.mimetype,
      metadata: {
        uid,
        fileType,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date()
      }
    });

    readableStream.pipe(uploadStream)
      .on('error', (err) => next(err))
      .on('finish', async () => {
        const fileId = uploadStream.id.toString();

        // Update User vehicle record with document metadata
        let updateQuery = {};
        if (fileType === 'license') {
          updateQuery = {
            'vehicle.licenseFileName': req.file.originalname,
            'vehicle.licenseFileId': fileId
          };
        } else if (fileType === 'insurance') {
          updateQuery = {
            'vehicle.insuranceFileName': req.file.originalname,
            'vehicle.insuranceFileId': fileId
          };
        } else if (fileType === 'puc') {
          updateQuery = {
            'vehicle.pucFileName': req.file.originalname,
            'vehicle.pucFileId': fileId
          };
        }

        if (Object.keys(updateQuery).length > 0) {
          await User.findOneAndUpdate({ uid }, { $set: updateQuery }, { upsert: true });
        }

        return res.status(201).json({
          success: true,
          fileId,
          filename: req.file.originalname,
          fileType,
          contentType: req.file.mimetype,
          size: req.file.size
        });
      });
  } catch (error) {
    next(error);
  }
}

export async function getFileById(req, res, next) {
  try {
    const { fileId } = req.params;
    const download = req.query.download === 'true';

    if (!isConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected' });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'GridFS storage engine is not available' });
    }

    let objId;
    try {
      objId = new mongoose.Types.ObjectId(fileId);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    const files = await bucket.find({ _id: objId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in GridFS' });
    }

    const file = files[0];
    const contentType = file.contentType || 'application/pdf';
    const filename = file.metadata?.originalName || file.filename;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader(
      'Content-Disposition',
      download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`
    );

    const downloadStream = bucket.openDownloadStream(objId);
    downloadStream.on('error', (err) => next(err));
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function getFileByUserAndType(req, res, next) {
  try {
    const { uid, fileType } = req.params;
    const download = req.query.download === 'true';

    if (!isConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected' });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({ success: false, message: 'GridFS not available' });
    }

    // Find the latest file uploaded by this user with this fileType
    const files = await bucket.find({ 
      'metadata.uid': uid, 
      'metadata.fileType': fileType 
    }).sort({ uploadDate: -1 }).limit(1).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: `No ${fileType} document found for user` });
    }

    const file = files[0];
    const contentType = file.contentType || 'application/pdf';
    const filename = file.metadata?.originalName || file.filename;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', file.length);
    res.setHeader(
      'Content-Disposition',
      download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`
    );

    const downloadStream = bucket.openDownloadStream(file._id);
    downloadStream.on('error', (err) => next(err));
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const { fileId } = req.params;

    if (!isConnected()) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected' });
    }

    const bucket = getGridFSBucket();
    let objId = new mongoose.Types.ObjectId(fileId);

    await bucket.delete(objId);
    return res.json({ success: true, message: 'File deleted from GridFS' });
  } catch (error) {
    next(error);
  }
}
