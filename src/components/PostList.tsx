// PostList component - Display list of posts
'use client';

import { useEffect, useState } from 'react';
import { PostCard } from './PostCard';
import Link from 'next/link';
import type { ApiResponse } from '@/types/api';

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

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadPosts = async (currentOffset: number = 0) => {
    try {
      const response = await fetch(
        `/api/posts?limit=20&offset=${currentOffset}`,
        {
          credentials: 'include',
        }
      );

      const data: ApiResponse<{ posts: Post[]; hasMore: boolean }> = await response.json();

      if (response.ok && data.code === 0) {
        if (currentOffset === 0) {
          setPosts(data.data!.posts);
        } else {
          setPosts((prev) => [...prev, ...data.data!.posts]);
        }
        setHasMore(data.data!.hasMore);
        setOffset(currentOffset + 20);
      } else {
        setError(data.message || '加载失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(0);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-600">还没有表白，来发第一条吧！</p>
        <Link
          href="/post/new"
          className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          发表白
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={() => loadPosts(offset)}
            className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-md hover:bg-blue-50"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
