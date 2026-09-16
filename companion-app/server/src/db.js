import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let gridFSBucket = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    console.warn('\n⚠️  [MongoDB] MONGODB_URI is not set in server/.env');
    console.warn('👉  Follow the guide to add your Atlas connection string to server/.env');
    console.warn('ℹ️   Server is operating in standby mode.\n');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB] Successfully connected to Atlas: ${conn.connection.host}`);

    gridFSBucket = new GridFSBucket(conn.connection.db, {
      bucketName: 'documents'
    });
    console.log('✅ [MongoDB] GridFS bucket "documents" ready for PDF & document storage');
    return conn;
  } catch (error) {
    console.error('❌ [MongoDB] Connection failure:', error.message);
    console.error('👉  Check that your IP address is whitelisted in MongoDB Atlas (0.0.0.0/0)');
    return null;
  }
}

export function getGridFSBucket() {
  return gridFSBucket;
}

export function isConnected() {
  return mongoose.connection.readyState === 1;
}
