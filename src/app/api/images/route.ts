// Image serving API
import { NextRequest } from 'next/server';
import { getImage } from '@/lib/storage';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Serve image by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return createErrorResponse(ErrorCodes.MISSING_REQUIRED_FIELD, 400);
    }

    // Get and return image
    return await getImage(key);
  } catch (error) {
    console.error('Get image error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 404);
    }

    return createErrorResponse(ErrorCodes.IMAGE_NOT_FOUND, 404);
  }
}
