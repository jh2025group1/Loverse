// Block/Unblock User API - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Block a user
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const targetUserId = params.userId;

    // Backend expects: target_account
    const backendBody = {
      target_account: targetUserId,
    };

    return await proxyToBackend({
      method: 'POST',
      path: '/apifox/user/pull_black',
      request,
      body: backendBody,
    });
  } catch (error) {
    console.error('Block user proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to block user' },
      { status: 500 }
    );
  }
}

// Unblock a user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const targetUserId = params.userId;

    // Backend expects: target_account
    const backendBody = {
      target_account: targetUserId,
    };

    return await proxyToBackend({
      method: 'POST',
      path: '/apifox/user/pull_white',
      request,
      body: backendBody,
    });
  } catch (error) {
    console.error('Unblock user proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}
