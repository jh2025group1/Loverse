// Image storage utilities using Cloudflare R2
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { AppError, ErrorCodes } from './errors';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function getR2Bucket() {
  const { env } = await getCloudflareContext();
  return env.IMAGES;
}

// Validate image file
export function validateImage(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new AppError(ErrorCodes.IMAGE_INVALID_FORMAT);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new AppError(ErrorCodes.IMAGE_TOO_LARGE);
  }
}

// Calculate SHA-256 hash of file content
async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return extensions[mimeType] || 'jpg';
}

// Generate image key based on hash (for deduplication)
export function generateImageKeyFromHash(hash: string, mimeType: string): string {
  const ext = getExtensionFromMimeType(mimeType);
  // Store by hash: images/hash[0:2]/hash[2:4]/fullhash.ext
  // This creates a directory structure to avoid too many files in one directory
  return `images/${hash.substring(0, 2)}/${hash.substring(2, 4)}/${hash}.${ext}`;
}

// Legacy function for compatibility (now uses hash-based approach)
export function generateImageKey(userId: number, type: 'avatar' | 'post'): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  return `${type}/${userId}/${timestamp}-${random}`;
}

// Upload image to R2 with deduplication
// Returns the image key (existing or new)
export async function uploadImage(
  file: File,
  key?: string // Optional: if provided, use this key instead of hash-based
): Promise<string> {
  try {
    validateImage(file);

    const bucket = await getR2Bucket();
    
    // If no key provided, use hash-based key for deduplication
    if (!key) {
      const hash = await calculateFileHash(file);
      const hashKey = generateImageKeyFromHash(hash, file.type);
      
      // Check if image already exists
      const existing = await bucket.head(hashKey);
      if (existing) {
        // Image already exists, return existing key
        return hashKey;
      }
      
      // Upload new image with hash-based key
      await bucket.put(hashKey, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          hash: hash,
          originalSize: file.size.toString(),
        },
      });
      
      return hashKey;
    }
    
    // Use provided key (for backwards compatibility or special cases)
    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return key;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(ErrorCodes.IMAGE_UPLOAD_FAILED);
  }
}

// Get image from R2
export async function getImage(key: string): Promise<Response> {
  const bucket = await getR2Bucket();
  const object = await bucket.get(key);

  if (!object) {
    throw new AppError(ErrorCodes.IMAGE_NOT_FOUND, undefined, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.httpEtag,
    },
  });
}

// Delete image from R2 (with reference checking)
export async function deleteImage(key: string): Promise<void> {
  // Import here to avoid circular dependency
  const { isImageReferenced } = await import('./db');
  
  // Check if image is still referenced
  const isReferenced = await isImageReferenced(key);
  
  if (isReferenced) {
    // Image is still being used, don't delete
    console.log(`Image ${key} is still referenced, skipping deletion`);
    return;
  }
  
  // No references, safe to delete
  const bucket = await getR2Bucket();
  await bucket.delete(key);
  console.log(`Image ${key} deleted from R2`);
}

// Delete multiple images from R2 (with reference checking)
export async function deleteImages(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  
  // Import here to avoid circular dependency
  const { getUnreferencedImages } = await import('./db');
  
  // Get only unreferenced images
  const unreferencedKeys = await getUnreferencedImages(keys);
  
  if (unreferencedKeys.length === 0) {
    console.log('All images are still referenced, skipping deletion');
    return;
  }
  
  console.log(`Deleting ${unreferencedKeys.length} of ${keys.length} unreferenced images`);
  
  // Delete only unreferenced images
  const bucket = await getR2Bucket();
  await Promise.all(unreferencedKeys.map(key => bucket.delete(key)));
}
