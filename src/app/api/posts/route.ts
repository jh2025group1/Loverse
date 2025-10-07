// Posts API - Create, Read, Update, Delete posts
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  createPost,
  getPostsExcludingBlocked,
  getPostById,
  addPostImage,
  getPostImages,
  getUserById,
} from '@/lib/db';
import { validatePostContent, validateImageCount } from '@/lib/validation';
import { uploadImage } from '@/lib/storage';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get posts (community feed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user (may be null if not logged in)
    const currentUser = await getCurrentUser(request);

    // Get posts excluding blocked users
    const posts = await getPostsExcludingBlocked(
      currentUser?.userId || null,
      limit,
      offset
    );

    // Enrich posts with user info and images
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const images = await getPostImages(post.id);
        let author = null;

        // Show author info if not anonymous
        if (post.is_anonymous === 0) {
          const user = await getUserById(post.user_id);
          if (user) {
            author = {
              id: user.id,
              username: user.username,
              nickname: user.nickname,
              avatarKey: user.avatar_key,
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
          // Only show ownership to the author
          isOwner: currentUser?.userId === post.user_id,
        };
      })
    );

    return Response.json({
      code: 0,
      data: {
        posts: enrichedPosts,
        hasMore: enrichedPosts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(ErrorCodes.AUTH_REQUIRED, 401);
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const isAnonymous = formData.get('isAnonymous') === 'true';
    const isPublic = formData.get('isPublic') !== 'false'; // Default to public

    // Validate content
    validatePostContent(content);

    // Get images (up to 9)
    const images: File[] = [];
    for (let i = 0; i < 9; i++) {
      const image = formData.get(`image${i}`) as File | null;
      if (image) {
        images.push(image);
      }
    }

    validateImageCount(images.length);

    // Create post
    const postId = await createPost(user.userId, content, isAnonymous, isPublic);

    // Upload images (with automatic deduplication)
    for (let i = 0; i < images.length; i++) {
      const imageKey = await uploadImage(images[i]); // Auto hash-based key
      await addPostImage(postId, imageKey, i);
    }

    // Get created post
    const post = await getPostById(postId);
    const postImages = await getPostImages(postId);

    return Response.json({
      code: 0,
      message: '发布成功',
      data: {
        postId: postId,
        content: post!.content,
        isAnonymous: post!.is_anonymous === 1,
        isPublic: post!.is_public === 1,
        images: postImages.map((img) => ({
          key: img.image_key,
          order: img.image_order,
        })),
        createdAt: post!.created_at,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
