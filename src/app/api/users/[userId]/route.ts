// User Profile API - Get public user information - Proxy to Java backend
import { NextRequest } from 'next/server';
import { getUserAccount } from '@/lib/proxy';

// Get user profile by userId
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.userId;
    const currentUserAccount = await getUserAccount(request);

    // Backend doesn't have a specific user profile endpoint in docs
    // Return basic info for now
    return Response.json({
      code: 0,
      data: {
        user: {
          id: userId,
          username: userId,
          message: 'User profile endpoint needs backend implementation',
        },
        posts: [],
        isOwnProfile: currentUserAccount === userId,
        isBlocked: false,
      },
    });
  } catch (error) {
    console.error('Get user profile proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}
