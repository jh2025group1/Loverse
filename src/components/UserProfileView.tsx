// User Profile View Component
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PostCard } from '@/components/PostCard';
import type { ApiResponse } from '@/types/api';

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

interface UserProfileViewProps {
  data: UserProfileData;
}

export function UserProfileView({ data }: UserProfileViewProps) {
  const { user, posts } = data;
  const [isBlocked, setIsBlocked] = useState(data.isBlocked);
  const [blockActionLoading, setBlockActionLoading] = useState(false);

  const handleBlockToggle = async () => {
    setBlockActionLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/block`, {
        method: isBlocked ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.code === 0) {
        setIsBlocked(!isBlocked);
        alert(result.message || (isBlocked ? '已取消拉黑' : '已拉黑'));
      } else {
        alert(result.message || '操作失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setBlockActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              {user.avatarKey ? (
                <Image
                  src={`/api/images?key=${user.avatarKey}`}
                  alt={user.nickname}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-medium">
                    {user.nickname.charAt(0)}
                  </span>
                </div>
              )}

              {/* User Details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{user.nickname}</h1>
                <p className="text-gray-600">@{user.username}</p>
                <p className="text-sm text-gray-500 mt-2">
                  加入于 {new Date(user.createdAt * 1000).toLocaleDateString('zh-CN')}
                </p>

                {isBlocked && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">你已屏蔽此用户</p>
                  </div>
                )}
              </div>
            </div>

            {/* Block/Unblock Button */}
            <button
              onClick={handleBlockToggle}
              disabled={blockActionLoading}
              className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isBlocked
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {blockActionLoading ? '处理中...' : isBlocked ? '取消拉黑' : '拉黑'}
            </button>
          </div>
        </div>

        {/* User Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {user.nickname} 的表白
          </h2>

          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>暂无公开的表白</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
