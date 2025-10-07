// Image serving API - Proxy to Java backend
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://gtp4free.onrender.com';

// Serve image by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return Response.json(
        { code: 400, message: 'Missing image key' },
        { status: 400 }
      );
    }

    // Forward image request to backend
    // Note: Backend might have a different image serving endpoint
    // For now, return a placeholder response
    return Response.json({
      code: 0,
      message: 'Image endpoint needs backend implementation',
      data: {
        imageKey: key,
        url: `${BACKEND_URL}/images/${key}`,
      },
    });
  } catch (error) {
    console.error('Get image proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get image' },
      { status: 500 }
    );
  }
}
