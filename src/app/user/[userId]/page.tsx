// User Profile Page - View user profile and public posts
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import {
  getUserById,
  getUserPosts,
  getPostsImages,
  isUserBlocked,
} from '@/lib/db';
import { UserProfileView } from '@/components/UserProfileView';

interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
  createdAt: number;
}

interface Author {
  id: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
}

interface PostImage {
  key: string;
  order: number;
}

interface Post {
  id: number;
  content: string;
  isAnonymous: boolean;
  isPublic: boolean;
  images: PostImage[];
  author: Author | null;
  createdAt: number;
  updatedAt: number;
  isOwner: boolean;
}

interface UserProfileData {
  user: UserProfile;
  posts: Post[];
  isOwnProfile: boolean;
  isBlocked: boolean;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: userIdParam } = await params;
  const userId = parseInt(userIdParam);

  if (isNaN(userId)) {
    redirect('/');
  }

  // Get current user
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  let currentUser = null;
  if (authToken) {
    currentUser = await verifyJWT(authToken);
  }

  // If viewing own profile, redirect to /profile
  if (currentUser && currentUser.userId === userId) {
    redirect('/profile');
  }

  // Get user info
  const userInfo = await getUserById(userId);
  if (!userInfo) {
    redirect('/');
  }

  // Check if current user has blocked this user
  let isBlocked = false;
  if (currentUser) {
    isBlocked = await isUserBlocked(currentUser.userId, userId);
  }

  // Get user's public posts
  const allPosts = await getUserPosts(userId);
  const posts = allPosts.filter(post => post.is_public === 1);

  // Batch fetch images for all posts
  const postIds = posts.map(p => p.id);
  const imagesMap = await getPostsImages(postIds);

  // Enrich posts with images and author info
  const enrichedPosts: Post[] = posts.map((post) => {
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
      isOwner: false,
    };
  });

  const data: UserProfileData = {
    user: {
      id: userInfo.id,
      username: userInfo.username,
      nickname: userInfo.nickname,
      avatarKey: userInfo.avatar_key,
      createdAt: userInfo.created_at,
    },
    posts: enrichedPosts,
    isOwnProfile: false,
    isBlocked,
  };

  return <UserProfileView data={data} />;
}

