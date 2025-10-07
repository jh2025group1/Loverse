// Comments API - Create and Get comments for a post
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getPostById,
  createComment,
  getPostComments,
  getUserById,
  getCommentById,
} from '@/lib/db';
import { validateCommentContent } from '@/lib/validation';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get comments for a post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const params = await context.params;
    const postId = parseInt(params.postId);
    const currentUser = await getCurrentUser(request);

    const post = await getPostById(postId);
    if (!post) {
      return createErrorResponse(ErrorCodes.POST_NOT_FOUND, 404);
    }

    // Check if user can view this post
    if (post.is_public === 0 && (!currentUser || currentUser.userId !== post.user_id)) {
      return createErrorResponse(ErrorCodes.POST_FORBIDDEN, 403);
    }

    // Get comments
    const comments = await getPostComments(postId);

    // Enrich comments with user info
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const user = await getUserById(comment.user_id);

        return {
          id: comment.id,
          content: comment.content,
          parentCommentId: comment.parent_comment_id,
          author: user
            ? {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                avatarKey: user.avatar_key,
              }
            : null,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          isOwner: currentUser?.userId === comment.user_id,
        };
      })
    );

    return Response.json({
      code: 0,
      data: {
        comments: enrichedComments,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}

// Create a comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const params = await context.params;
    const postId = parseInt(params.postId);
    const post = await getPostById(postId);

    if (!post) {
      return createErrorResponse(ErrorCodes.POST_NOT_FOUND, 404);
    }

    // Check if user can comment on this post
    if (post.is_public === 0 && user.userId !== post.user_id) {
      return createErrorResponse(ErrorCodes.POST_FORBIDDEN, 403);
    }

    const body = await request.json() as { content: string; parentCommentId?: number };
    const { content, parentCommentId } = body;

    // Validate content
    validateCommentContent(content);

    // If replying to a comment, verify it exists
    if (parentCommentId) {
      const parentComment = await getCommentById(parentCommentId);
      if (!parentComment || parentComment.post_id !== postId) {
        return createErrorResponse(ErrorCodes.COMMENT_NOT_FOUND, 404);
      }
    }

    // Create comment
    const commentId = await createComment(postId, user.userId, content, parentCommentId);

    // Get created comment with user info
    const comment = await getCommentById(commentId);
    const author = await getUserById(user.userId);

    return Response.json({
      code: 0,
      message: '评论成功',
      data: {
        id: commentId,
        content: comment!.content,
        parentCommentId: comment!.parent_comment_id,
        author: author
          ? {
              id: author.id,
              username: author.username,
              nickname: author.nickname,
              avatarKey: author.avatar_key,
            }
          : null,
        createdAt: comment!.created_at,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
