// Blocklist API - Proxy to Java backend
import { NextRequest } from 'next/server';
import { getUserAccount } from '@/lib/proxy';

// Get current user's blocklist
export async function GET(request: NextRequest) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Backend doesn't have a specific blocklist endpoint in the docs
    // Return empty list for now or implement custom logic
    return Response.json({
      code: 0,
      data: {
        blockedUsers: [],
        message: 'Blocklist endpoint needs backend implementation',
      },
    });
  } catch (error) {
    console.error('Get blocklist proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get blocklist' },
      { status: 500 }
    );
  }
}
