// Blocklist API - Get user's blocklist
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBlockedUsers, getUserById } from '@/lib/db';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get current user's blocklist
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    // Get blocked user IDs
    const blockedUserIds = await getBlockedUsers(user.userId);

    // Get user details for each blocked user
    const blockedUsers = await Promise.all(
      blockedUserIds.map(async (userId) => {
        const userInfo = await getUserById(userId);
        if (!userInfo) return null;

        return {
          id: userInfo.id,
          username: userInfo.username,
          nickname: userInfo.nickname,
          avatarKey: userInfo.avatar_key,
        };
      })
    );

    // Filter out null values (deleted users)
    const validBlockedUsers = blockedUsers.filter(u => u !== null);

    return Response.json({
      code: 0,
      data: {
        blockedUsers: validBlockedUsers,
      },
    });
  } catch (error) {
    console.error('Get blocklist error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
