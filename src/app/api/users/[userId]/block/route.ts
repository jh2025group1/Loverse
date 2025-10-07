// Block/Unblock User API
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { blockUser, unblockUser, isUserBlocked, getUserById } from '@/lib/db';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Block a user
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const params = await context.params;
    const targetUserId = parseInt(params.userId);

    // Can't block yourself
    if (user.userId === targetUserId) {
      return createErrorResponse(ErrorCodes.BLOCK_SELF_NOT_ALLOWED, 400);
    }

    // Check if target user exists
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return createErrorResponse(ErrorCodes.USER_NOT_FOUND, 404);
    }

    // Check if already blocked
    const alreadyBlocked = await isUserBlocked(user.userId, targetUserId);
    if (alreadyBlocked) {
      return createErrorResponse(ErrorCodes.BLOCK_ALREADY_EXISTS, 400);
    }

    // Block user
    await blockUser(user.userId, targetUserId);

    return Response.json({
      code: 0,
      message: '拉黑成功',
    });
  } catch (error) {
    console.error('Block user error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}

// Unblock a user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const params = await context.params;
    const targetUserId = parseInt(params.userId);

    // Check if user is blocked
    const blocked = await isUserBlocked(user.userId, targetUserId);
    if (!blocked) {
      return createErrorResponse(ErrorCodes.BLOCK_NOT_FOUND, 404);
    }

    // Unblock user
    await unblockUser(user.userId, targetUserId);

    return Response.json({
      code: 0,
      message: '取消拉黑成功',
    });
  } catch (error) {
    console.error('Unblock user error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
