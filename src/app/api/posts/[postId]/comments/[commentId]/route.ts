// Individual Comment API - Delete comment
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCommentById, deleteComment } from '@/lib/db';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Delete comment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const params = await context.params;
    const commentId = parseInt(params.commentId);
    const comment = await getCommentById(commentId);

    if (!comment) {
      return createErrorResponse(ErrorCodes.COMMENT_NOT_FOUND, 404);
    }

    if (comment.user_id !== user.userId) {
      return createErrorResponse(ErrorCodes.COMMENT_FORBIDDEN, 403);
    }

    // Delete comment (cascades to replies)
    await deleteComment(commentId);

    return Response.json({
      code: 0,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete comment error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
