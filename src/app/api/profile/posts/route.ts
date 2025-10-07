// Profile Posts API - Get current user's posts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getUserPosts,
  getPostsImages,
  getUserById,
} from '@/lib/db';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get current user's posts
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    // Get user's posts (both public and private)
    const posts = await getUserPosts(user.userId);

    // Batch fetch images for all posts
    const postIds = posts.map(p => p.id);
    const imagesMap = await getPostsImages(postIds);

    // Enrich posts with user info and images
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const images = imagesMap.get(post.id) || [];
        let author = null;

        // Show author info if not anonymous
        if (post.is_anonymous === 0) {
          const userInfo = await getUserById(post.user_id);
          if (userInfo) {
            author = {
              id: userInfo.id,
              username: userInfo.username,
              nickname: userInfo.nickname,
              avatarKey: userInfo.avatar_key,
            };
          }
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
          isOwner: true, // All posts belong to current user
        };
      })
    );

    return Response.json({
      code: 0,
      data: {
        posts: enrichedPosts,
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
