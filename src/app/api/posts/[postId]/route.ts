// Individual Post API - Get, Update, Delete specific post
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getPostById,
  updatePost,
  deletePost,
  getPostImages,
  deletePostImages,
  addPostImage,
  getUserById,
} from '@/lib/db';
import { validatePostContent, validateImageCount } from '@/lib/validation';
import { uploadImage, deleteImages } from '@/lib/storage';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


// Get specific post
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

    // Get images
    const images = await getPostImages(postId);

    // Get author info if not anonymous
    let author = null;
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

    return Response.json({
      code: 0,
      data: {
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
        isOwner: currentUser?.userId === post.user_id,
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}

// Update post
export async function PUT(
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

    if (post.user_id !== user.userId) {
      return createErrorResponse(ErrorCodes.POST_FORBIDDEN, 403);
    }

    const formData = await request.formData();
    const content = formData.get('content') as string | null;
    const isAnonymous = formData.get('isAnonymous') as string | null;
    const isPublic = formData.get('isPublic') as string | null;
    const updateImages = formData.get('updateImages') === 'true';

    const updates: { content?: string; is_anonymous?: boolean; is_public?: boolean } = {};

    if (content) {
      validatePostContent(content);
      updates.content = content;
    }

    if (isAnonymous !== null) {
      updates.is_anonymous = isAnonymous === 'true';
    }

    if (isPublic !== null) {
      updates.is_public = isPublic === 'true';
    }

    // Update post
    await updatePost(postId, updates);

    // Handle image updates if requested
    if (updateImages) {
      // Get old images
      const oldImages = await getPostImages(postId);
      
      // Collect keys to keep
      const keepKeys: string[] = [];
      for (let i = 0; i < 100; i++) {
        const keepKey = formData.get(`keepImage${i}`) as string | null;
        if (keepKey) {
          keepKeys.push(keepKey);
        } else {
          break;
        }
      }
      
      // Delete images that are not being kept
      const imagesToDelete = oldImages.filter(img => !keepKeys.includes(img.image_key));
      if (imagesToDelete.length > 0) {
        await deleteImages(imagesToDelete.map(img => img.image_key));
      }
      
      // Delete all post_images records
      await deletePostImages(postId);
      
      // Re-add kept images with new order
      for (let i = 0; i < keepKeys.length; i++) {
        await addPostImage(postId, keepKeys[i], i);
      }
      
      // Upload and add new images
      const newImages: File[] = [];
      for (let i = 0; i < 9; i++) {
        const image = formData.get(`image${i}`) as File | null;
        if (image) {
          newImages.push(image);
        }
      }

      validateImageCount(keepKeys.length + newImages.length);

      // Upload new images (with automatic deduplication)
      for (let i = 0; i < newImages.length; i++) {
        const imageKey = await uploadImage(newImages[i]); // Auto hash-based key
        await addPostImage(postId, imageKey, keepKeys.length + i);
      }
    }

    // Get updated post
    const updatedPost = await getPostById(postId);
    const postImages = await getPostImages(postId);

    return Response.json({
      code: 0,
      message: '更新成功',
      data: {
        id: updatedPost!.id,
        content: updatedPost!.content,
        isAnonymous: updatedPost!.is_anonymous === 1,
        isPublic: updatedPost!.is_public === 1,
        images: postImages.map((img) => ({
          key: img.image_key,
          order: img.image_order,
        })),
        updatedAt: updatedPost!.updated_at,
      },
    });
  } catch (error) {
    console.error('Update post error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}

// Delete post
export async function DELETE(
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

    if (post.user_id !== user.userId) {
      return createErrorResponse(ErrorCodes.POST_FORBIDDEN, 403);
    }

    // Delete images from R2
    const images = await getPostImages(postId);
    if (images.length > 0) {
      await deleteImages(images.map((img) => img.image_key));
    }

    // Delete post (cascades to comments and images in DB)
    await deletePost(postId);

    return Response.json({
      code: 0,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete post error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
