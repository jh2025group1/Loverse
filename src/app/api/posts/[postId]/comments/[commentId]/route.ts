// Individual Comment API - Delete comment - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Delete comment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string; commentId: string }> }
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
    const commentId = params.commentId;

    // Backend expects: comment_id
    const backendBody = {
      comment_id: commentId,
    };

    return await proxyToBackend({
      method: 'DELETE',
      path: '/apifox/comment/delete',
      request,
      body: backendBody,
    });
  } catch (error) {
    console.error('Delete comment proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
