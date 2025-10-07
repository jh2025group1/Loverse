// Posts API - Create, Read, Update, Delete posts - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Get posts (community feed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    // Backend expects different query params, so we forward as-is
    return await proxyToBackend({
      method: 'GET',
      path: '/apifox/post/get_post',
      request,
      queryParams: { limit, offset },
    });
  } catch (error) {
    console.error('Get posts proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get posts' },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const isPublic = formData.get('isPublic') !== 'false';

    // Check if there are images
    const hasImages = formData.get('image0') !== null;

    if (hasImages) {
      // Use post_with_images endpoint
      // Backend expects: user_account, title, content, is_public, files
      const backendFormData = new FormData();
      backendFormData.append('user_account', userAccount);
      backendFormData.append('title', content.substring(0, 50)); // Use first 50 chars as title
      backendFormData.append('content', content);
      backendFormData.append('is_public', isPublic ? '1' : '0');
      backendFormData.append('is_anonymous', isAnonymous ? '1' : '0');

      // Add all images
      for (let i = 0; i < 9; i++) {
        const image = formData.get(`image${i}`);
        if (image) {
          backendFormData.append('files', image);
        }
      }

      return await proxyToBackend({
        method: 'POST',
        path: '/apifox/post/post_with_images',
        request,
        body: backendFormData,
        useFormData: true,
      });
    } else {
      // Use regular post endpoint
      // Backend expects: title, content, is_public, is_anonymous
      const backendBody = {
        title: content.substring(0, 50),
        content,
        is_public: isPublic ? '1' : '0',
        is_anonymous: isAnonymous ? 1 : 0,
      };

      return await proxyToBackend({
        method: 'POST',
        path: '/apifox/post/post',
        request,
        body: backendBody,
      });
    }
  } catch (error) {
    console.error('Create post proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to create post' },
      { status: 500 }
    );
  }
}
