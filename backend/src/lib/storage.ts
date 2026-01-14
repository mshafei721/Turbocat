/**
 * Cloud Storage Abstraction Layer
 *
 * Provides a unified interface for cloud storage operations.
 * Supports S3-compatible services (AWS S3, Cloudflare R2, MinIO, etc.).
 *
 * Environment Variables:
 * - ENABLE_CLOUD_STORAGE: Set to 'true' to enable cloud storage
 * - STORAGE_PROVIDER: 's3' | 'r2' (default: 's3')
 * - S3_BUCKET: Bucket name for sandbox files
 * - S3_REGION: AWS region (default: 'us-east-1')
 * - S3_ACCESS_KEY_ID: Access key (optional if using IAM roles)
 * - S3_SECRET_ACCESS_KEY: Secret key (optional if using IAM roles)
 * - S3_ENDPOINT: Custom endpoint for R2/MinIO (optional)
 *
 * @module lib/storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import path from 'path';
import { logger } from './logger';

// =============================================================================
// Types
// =============================================================================

export interface StorageConfig {
  enabled: boolean;
  provider: 's3' | 'r2';
  bucket: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

export interface UploadOptions {
  compress?: boolean;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  decompress?: boolean;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Get storage configuration from environment
 */
export function getStorageConfig(): StorageConfig {
  return {
    enabled: process.env.ENABLE_CLOUD_STORAGE === 'true',
    provider: (process.env.STORAGE_PROVIDER as 's3' | 'r2') || 's3',
    bucket: process.env.S3_BUCKET || '',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
  };
}

/**
 * Check if cloud storage is configured and enabled
 */
export function isStorageConfigured(): boolean {
  const config = getStorageConfig();
  return config.enabled && !!config.bucket;
}

// =============================================================================
// S3 Client Singleton
// =============================================================================

let s3Client: S3Client | null = null;

/**
 * Get or create the S3 client singleton
 */
export function getS3Client(): S3Client | null {
  if (s3Client) return s3Client;

  const config = getStorageConfig();
  if (!config.enabled || !config.bucket) {
    logger.debug('[Storage] Cloud storage not enabled or configured');
    return null;
  }

  const clientConfig: S3ClientConfig = {
    region: config.region,
  };

  // Add credentials if provided
  if (config.accessKeyId && config.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    };
  }

  // Add custom endpoint for R2/MinIO
  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true; // Required for R2/MinIO
  }

  s3Client = new S3Client(clientConfig);
  logger.info('[Storage] S3 client initialized', {
    provider: config.provider,
    bucket: config.bucket,
    region: config.region,
    hasEndpoint: !!config.endpoint,
  });

  return s3Client;
}

// =============================================================================
// Storage Operations
// =============================================================================

/**
 * Upload a file to cloud storage
 *
 * @param key - Object key (path in bucket)
 * @param filePath - Local file path to upload
 * @param options - Upload options
 * @returns True if upload successful
 */
export async function uploadFile(
  key: string,
  filePath: string,
  options: UploadOptions = {},
): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const config = getStorageConfig();
  const { compress = true, contentType, metadata } = options;

  try {
    let body: Readable;
    let finalContentType = contentType;

    if (compress) {
      // Create compressed stream
      body = createReadStream(filePath).pipe(createGzip());
      finalContentType = finalContentType || 'application/gzip';
    } else {
      body = createReadStream(filePath);
      finalContentType = finalContentType || 'application/octet-stream';
    }

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: finalContentType,
      Metadata: metadata,
    });

    await client.send(command);
    logger.debug('[Storage] File uploaded', { key, compressed: compress });
    return true;
  } catch (error) {
    logger.error('[Storage] Upload failed', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Upload data buffer to cloud storage
 *
 * @param key - Object key (path in bucket)
 * @param data - Data buffer or string
 * @param options - Upload options
 * @returns True if upload successful
 */
export async function uploadData(
  key: string,
  data: Buffer | string,
  options: UploadOptions = {},
): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const config = getStorageConfig();
  const { contentType = 'application/octet-stream', metadata } = options;

  try {
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: typeof data === 'string' ? Buffer.from(data) : data,
      ContentType: contentType,
      Metadata: metadata,
    });

    await client.send(command);
    logger.debug('[Storage] Data uploaded', { key, size: data.length });
    return true;
  } catch (error) {
    logger.error('[Storage] Upload failed', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Download a file from cloud storage
 *
 * @param key - Object key (path in bucket)
 * @param filePath - Local file path to save to
 * @param options - Download options
 * @returns True if download successful
 */
export async function downloadFile(
  key: string,
  filePath: string,
  options: DownloadOptions = {},
): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const config = getStorageConfig();
  const { decompress = true } = options;

  try {
    // Ensure directory exists
    await mkdir(path.dirname(filePath), { recursive: true });

    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error('Empty response body');
    }

    // Stream to file
    const writeStream = createWriteStream(filePath);
    const readStream = response.Body as Readable;

    if (decompress && (response.ContentType === 'application/gzip' || key.endsWith('.gz'))) {
      await pipeline(readStream, createGunzip(), writeStream);
    } else {
      await pipeline(readStream, writeStream);
    }

    logger.debug('[Storage] File downloaded', { key, filePath, decompressed: decompress });
    return true;
  } catch (error) {
    logger.error('[Storage] Download failed', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Download data from cloud storage
 *
 * @param key - Object key (path in bucket)
 * @returns Data buffer or null if failed
 */
export async function downloadData(key: string): Promise<Buffer | null> {
  const client = getS3Client();
  if (!client) return null;

  const config = getStorageConfig();

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error('Empty response body');
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    const stream = response.Body as Readable;
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    logger.error('[Storage] Download failed', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Delete an object from cloud storage
 *
 * @param key - Object key (path in bucket)
 * @returns True if delete successful
 */
export async function deleteObject(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const config = getStorageConfig();

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
    logger.debug('[Storage] Object deleted', { key });
    return true;
  } catch (error) {
    logger.error('[Storage] Delete failed', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Delete all objects with a given prefix
 *
 * @param prefix - Key prefix to delete
 * @returns Number of objects deleted
 */
export async function deletePrefix(prefix: string): Promise<number> {
  const client = getS3Client();
  if (!client) return 0;

  try {
    const objects = await listObjects(prefix);
    let deleted = 0;

    for (const obj of objects) {
      if (await deleteObject(obj.key)) {
        deleted++;
      }
    }

    logger.debug('[Storage] Prefix deleted', { prefix, deleted });
    return deleted;
  } catch (error) {
    logger.error('[Storage] Delete prefix failed', {
      prefix,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * List objects with a given prefix
 *
 * @param prefix - Key prefix to list
 * @param maxKeys - Maximum number of keys to return
 * @returns Array of storage objects
 */
export async function listObjects(prefix: string, maxKeys = 1000): Promise<StorageObject[]> {
  const client = getS3Client();
  if (!client) return [];

  const config = getStorageConfig();
  const objects: StorageObject[] = [];

  try {
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        MaxKeys: Math.min(maxKeys - objects.length, 1000),
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key) {
            objects.push({
              key: item.Key,
              size: item.Size || 0,
              lastModified: item.LastModified || new Date(),
              etag: item.ETag,
            });
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken && objects.length < maxKeys);

    return objects;
  } catch (error) {
    logger.error('[Storage] List objects failed', {
      prefix,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Check if an object exists
 *
 * @param key - Object key to check
 * @returns True if object exists
 */
export async function objectExists(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  const config = getStorageConfig();

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Directory Operations (for sandbox backup/restore)
// =============================================================================

/**
 * Upload a directory to cloud storage
 *
 * @param localDir - Local directory path
 * @param keyPrefix - Key prefix in bucket
 * @param options - Upload options
 * @returns Number of files uploaded
 */
export async function uploadDirectory(
  localDir: string,
  keyPrefix: string,
  options: UploadOptions = {},
): Promise<number> {
  const client = getS3Client();
  if (!client) return 0;

  const { promises: fs } = await import('fs');
  let uploaded = 0;

  async function uploadRecursive(dir: string, prefix: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const localPath = path.join(dir, entry.name);
      const key = `${prefix}/${entry.name}`;

      if (entry.isDirectory()) {
        await uploadRecursive(localPath, key);
      } else if (entry.isFile()) {
        if (await uploadFile(key, localPath, options)) {
          uploaded++;
        }
      }
    }
  }

  try {
    await uploadRecursive(localDir, keyPrefix);
    logger.info('[Storage] Directory uploaded', { localDir, keyPrefix, files: uploaded });
    return uploaded;
  } catch (error) {
    logger.error('[Storage] Directory upload failed', {
      localDir,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return uploaded;
  }
}

/**
 * Download a directory from cloud storage
 *
 * @param keyPrefix - Key prefix in bucket
 * @param localDir - Local directory path
 * @param options - Download options
 * @returns Number of files downloaded
 */
export async function downloadDirectory(
  keyPrefix: string,
  localDir: string,
  options: DownloadOptions = {},
): Promise<number> {
  const client = getS3Client();
  if (!client) return 0;

  try {
    // Ensure local directory exists
    await mkdir(localDir, { recursive: true });

    const objects = await listObjects(keyPrefix);
    let downloaded = 0;

    for (const obj of objects) {
      // Calculate relative path
      const relativePath = obj.key.slice(keyPrefix.length).replace(/^\//, '');
      if (!relativePath) continue;

      const localPath = path.join(localDir, relativePath);

      if (await downloadFile(obj.key, localPath, options)) {
        downloaded++;
      }
    }

    logger.info('[Storage] Directory downloaded', { keyPrefix, localDir, files: downloaded });
    return downloaded;
  } catch (error) {
    logger.error('[Storage] Directory download failed', {
      keyPrefix,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

export default {
  getStorageConfig,
  isStorageConfigured,
  getS3Client,
  uploadFile,
  uploadData,
  downloadFile,
  downloadData,
  deleteObject,
  deletePrefix,
  listObjects,
  objectExists,
  uploadDirectory,
  downloadDirectory,
};
