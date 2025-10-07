// Comments API - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Get comments for a post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const params = await context.params;
    const postId = params.postId;
    const userAccount = await getUserAccount(request);

    // Backend combines post and comments in get_post_and_comments
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
    console.error('Get comments proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get comments' },
      { status: 500 }
    );
  }
}

// Create a comment
export async function POST(
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

    const body = await request.json() as { content: string; parentCommentId?: number };
    const { content, parentCommentId } = body;

    if (parentCommentId) {
      // Reply to a comment - use post_follow_comment
      const backendBody = {
        user_account: userAccount,
        post_id: postId,
        content,
        following_id: parentCommentId.toString(),
      };

      return await proxyToBackend({
        method: 'POST',
        path: '/apifox/comment/post_follow_comment',
        request,
        body: backendBody,
      });
    } else {
      // Top-level comment - use post_parent_comment
      const backendBody = {
        user_account: userAccount,
        post_id: postId,
        content,
      };

      return await proxyToBackend({
        method: 'POST',
        path: '/apifox/comment/post_parent_comment',
        request,
        body: backendBody,
      });
    }
  } catch (error) {
    console.error('Create comment proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
