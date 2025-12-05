import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AWS from 'aws-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const LOCAL_STORAGE_PATH = path.join(__dirname, '../../uploads');
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'http://localhost:3001';

let s3Client = null;
if (STORAGE_TYPE === 's3') {
  s3Client = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });
}

export async function ensureDirectories() {
  const dirs = [
    LOCAL_STORAGE_PATH,
    path.join(__dirname, '../../logs'),
    path.join(__dirname, '../../public/templates')
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Directory ensured: ${dir}`);
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
}

export async function saveToStorage(fileName, buffer) {
  if (STORAGE_TYPE === 's3') {
    return saveToS3(fileName, buffer);
  } else {
    return saveToLocal(fileName, buffer);
  }
}

async function saveToLocal(fileName, buffer) {
  const filePath = path.join(LOCAL_STORAGE_PATH, fileName);
  await fs.writeFile(filePath, buffer);
  const fileUrl = `${CDN_BASE_URL}/uploads/${fileName}`;
  console.log('File saved locally:', fileUrl);
  return fileUrl;
}

async function saveToS3(fileName, buffer) {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  const bucketName = process.env.AWS_S3_BUCKET;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET environment variable not set');
  }

  const params = {
    Bucket: bucketName,
    Key: `custom-designs/${fileName}`,
    Body: buffer,
    ContentType: fileName.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
    ACL: 'public-read'
  };

  const result = await s3Client.upload(params).promise();
  console.log('File uploaded to S3:', result.Location);
  return result.Location;
}

export async function deleteFromStorage(fileName) {
  if (STORAGE_TYPE === 's3') {
    return deleteFromS3(fileName);
  } else {
    return deleteFromLocal(fileName);
  }
}

async function deleteFromLocal(fileName) {
  const filePath = path.join(LOCAL_STORAGE_PATH, fileName);
  await fs.unlink(filePath);
  console.log('File deleted locally:', fileName);
}

async function deleteFromS3(fileName) {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `custom-designs/${fileName}`
  };

  await s3Client.deleteObject(params).promise();
  console.log('File deleted from S3:', fileName);
}
