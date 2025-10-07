// User Profile API - Get public user information
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getUserById,
  getUserPosts,
  getPostsImages,
  isUserBlocked,
} from '@/lib/db';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get user profile by userId
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return createErrorResponse(ErrorCodes.INVALID_INPUT, 400);
    }

    // Get user info
    const userInfo = await getUserById(userId);
    if (!userInfo) {
      return createErrorResponse(ErrorCodes.USER_NOT_FOUND, 404);
    }

    // Get current user (if logged in)
    const currentUser = await getCurrentUser(request);
    const currentUserId = currentUser?.userId;

    // Check if current user has blocked this user
    let isBlocked = false;
    if (currentUserId && currentUserId !== userId) {
      isBlocked = await isUserBlocked(currentUserId, userId);
    }

    // Get user's public posts (exclude private posts unless viewing own profile)
    const allPosts = await getUserPosts(userId);
    const posts = currentUserId === userId 
      ? allPosts 
      : allPosts.filter(post => post.is_public === 1);

    // Batch fetch images for all posts
    const postIds = posts.map(p => p.id);
    const imagesMap = await getPostsImages(postIds);

    // Enrich posts with images and author info
    const enrichedPosts = posts.map((post) => {
      const images = imagesMap.get(post.id) || [];
      let author = null;

      // Show author info if not anonymous
      if (post.is_anonymous === 0) {
        author = {
          id: userInfo.id,
          username: userInfo.username,
          nickname: userInfo.nickname,
          avatarKey: userInfo.avatar_key,
        };
      }

      return {
        id: post.id,
        content: post.content,
        isAnonymous: post.is_anonymous === 1,
        isPublic: post.is_public === 1,
        images: images.map((img) => ({
          key: img.image_key,
          order: img.image_order,
        })),
        author,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        isOwner: currentUserId === userId,
      };
    });

    return Response.json({
      code: 0,
      data: {
        user: {
          id: userInfo.id,
          username: userInfo.username,
          nickname: userInfo.nickname,
          avatarKey: userInfo.avatar_key,
          createdAt: userInfo.created_at,
        },
        posts: enrichedPosts,
        isOwnProfile: currentUserId === userId,
        isBlocked,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
