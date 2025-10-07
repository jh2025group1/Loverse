// Profile Posts API - Get current user's posts - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Get current user's posts
export async function GET(request: NextRequest) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use get_post endpoint with user filter
    // Backend might need a specific endpoint for user's own posts
    return await proxyToBackend({
      method: 'GET',
      path: '/apifox/post/get_post',
      request,
      queryParams: {
        user_account: userAccount,
      },
    });
  } catch (error) {
    console.error('Get user posts proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get user posts' },
      { status: 500 }
    );
  }
}
