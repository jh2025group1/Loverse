// Profile API - Get and Update user profile
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/db';
import { validateNickname } from '@/lib/validation';
import { uploadImage, deleteImage } from '@/lib/storage';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const userInfo = await getUserById(user.userId);
    if (!userInfo) {
      return createErrorResponse(ErrorCodes.USER_NOT_FOUND, 404);
    }

    return Response.json({
      code: 0,
      data: {
        id: userInfo.id,
        username: userInfo.username,
        nickname: userInfo.nickname,
        avatarKey: userInfo.avatar_key,
        createdAt: userInfo.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const formData = await request.formData();
    const nickname = formData.get('nickname') as string | null;
    const avatar = formData.get('avatar') as File | null;

    const updates: { nickname?: string; avatar_key?: string } = {};

    // Update nickname if provided
    if (nickname) {
      validateNickname(nickname);
      updates.nickname = nickname;
    }

    // Update avatar if provided
    if (avatar) {
      const userInfo = await getUserById(user.userId);

      // Delete old avatar if exists
      if (userInfo?.avatar_key) {
        await deleteImage(userInfo.avatar_key);
      }

      // Upload new avatar (with automatic deduplication)
      const imageKey = await uploadImage(avatar); // Auto hash-based key
      updates.avatar_key = imageKey;
    }

    // Update user
    await updateUser(user.userId, updates);

    // Get updated user info
    const updatedUser = await getUserById(user.userId);

    return Response.json({
      code: 0,
      message: '更新成功',
      data: {
        id: updatedUser!.id,
        username: updatedUser!.username,
        nickname: updatedUser!.nickname,
        avatarKey: updatedUser!.avatar_key,
        createdAt: updatedUser!.created_at,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
