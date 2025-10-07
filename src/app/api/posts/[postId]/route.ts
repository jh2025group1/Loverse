// Individual Post API - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Get specific post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const params = await context.params;
    const postId = params.postId;
    const userAccount = await getUserAccount(request);

    // Backend expects: post_id, user_account (optional)
    const body: Record<string, string> = {
      post_id: postId,
    };

    if (userAccount) {
      body.user_account = userAccount;
    }

    return await proxyToBackend({
      method: 'GET',
      path: '/apifox/post/get_post_and_comments',
      request,
      body,
    });
  } catch (error) {
    console.error('Get post proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get post' },
      { status: 500 }
    );
  }
}

// Update post
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
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
    const postId = params.postId;

    const formData = await request.formData();
    const content = formData.get('content') as string | null;
    const isAnonymous = formData.get('isAnonymous') as string | null;
    const isPublic = formData.get('isPublic') as string | null;

    // Backend expects: post_id, title, content, is_public, is_anonymous
    const backendBody: Record<string, string | number> = {
      post_id: parseInt(postId),
    };

    if (content) {
      backendBody.title = content.substring(0, 50);
      backendBody.content = content;
    }

    if (isPublic !== null) {
      backendBody.is_public = isPublic === 'true' ? '1' : '0';
    }

    if (isAnonymous !== null) {
      backendBody.is_anonymous = isAnonymous === 'true' ? 1 : 0;
    }

    return await proxyToBackend({
      method: 'PUT',
      path: '/apifox/post/rewrite_post',
      request,
      body: backendBody,
    });
  } catch (error) {
    console.error('Update post proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// Delete post
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
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
    const postId = params.postId;

    // Backend expects: post_id
    const backendBody = {
      post_id: parseInt(postId),
    };

    return await proxyToBackend({
      method: 'DELETE',
      path: '/apifox/post/delete_post',
      request,
      body: backendBody,
    });
  } catch (error) {
    console.error('Delete post proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
