// Profile page - View and edit user profile
'use client';

import { useEffect, useState, useCallback } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import type { ApiResponse } from '@/types/api';
import { PostCard } from '@/components/PostCard';

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      const data: ApiResponse<UserProfile> = await response.json();

      if (response.ok && data.code === 0) {
        setProfile(data.data!);
        setNickname(data.data!.nickname);
        // Load user posts
        loadUserPosts();
      } else if (response.status === 401) {
        // Not logged in, show error instead of redirecting
        setError('请先登录');
      } else {
        setError(data.message || '加载失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch('/api/profile/posts', {
        credentials: 'include',
      });

      const data: ApiResponse<{ posts: Post[] }> = await response.json();

      if (response.ok && data.code === 0) {
        setPosts(data.data!.posts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();

      if (nickname !== profile?.nickname) {
        formData.append('nickname', nickname);
      }

      if (avatar) {
        formData.append('avatar', avatar);
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      const data: ApiResponse<UserProfile> = await response.json();

      if (response.ok && data.code === 0) {
        setProfile(data.data!);
        setEditing(false);
        setAvatar(null);
        alert('保存成功');
      } else {
        setError(data.message || '保存失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-red-600">{error}</p>
            {error === '请先登录' && (
              <div className="mt-4 space-x-4">
                <a
                  href="/login"
                  className="inline-block text-blue-600 hover:text-blue-700"
                >
                  去登录
                </a>
                <a
                  href="/register"
                  className="inline-block text-blue-600 hover:text-blue-700"
                >
                  去注册
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
            {!editing && (
              <div className="flex space-x-3">
                <Link
                  href="/profile/blocklist"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  黑名单管理
                </Link>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  编辑资料
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  头像
                </label>
                <div className="flex items-center space-x-4">
                  {profile?.avatarKey ? (
                    <Image
                      src={avatar ? URL.createObjectURL(avatar) : `/api/images?key=${profile.avatarKey}`}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : avatar ? (
                    <Image
                      src={URL.createObjectURL(avatar)}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-2xl font-medium">
                        {nickname.charAt(0)}
                      </span>
                    </div>
                  )}

                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                      选择图片
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Nickname */}
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                  昵称
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Username (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setNickname(profile?.nickname || '');
                    setAvatar(null);
                    setError('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  头像
                </label>
                {profile?.avatarKey ? (
                  <Image
                    src={`/api/images?key=${profile.avatarKey}`}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-2xl font-medium">
                      {profile?.nickname.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  昵称
                </label>
                <p className="text-gray-900">{profile?.nickname}</p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <p className="text-gray-900">{profile?.username}</p>
              </div>

              {/* Created at */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  注册时间
                </label>
                <p className="text-gray-900">
                  {profile && new Date(profile.createdAt * 1000).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* My posts */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">我的表白</h2>
            <Link
              href="/post/new"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              发表新表白
            </Link>
          </div>

          {loadingPosts ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>还没有发表过表白</p>
              <Link
                href="/post/new"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700"
              >
                去发表第一条表白
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
