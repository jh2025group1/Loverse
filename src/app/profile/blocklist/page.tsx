// Blocklist Management Page
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ApiResponse } from '@/types/api';

interface BlockedUser {
  id: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
}

export default function BlocklistPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unblockingUserId, setUnblockingUserId] = useState<number | null>(null);

  useEffect(() => {
    loadBlocklist();
  }, []);

  const loadBlocklist = async () => {
    try {
      const response = await fetch('/api/blocklist', {
        credentials: 'include',
      });

      const data: ApiResponse<{ blockedUsers: BlockedUser[] }> = await response.json();

      if (response.ok && data.code === 0) {
        setBlockedUsers(data.data!.blockedUsers);
      } else if (response.status === 401) {
        setError('请先登录');
      } else {
        setError(data.message || '加载失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: number) => {
    if (!confirm('确定要取消拉黑此用户吗？')) {
      return;
    }

    setUnblockingUserId(userId);
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.code === 0) {
        // Remove from list
        setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
        alert('已取消拉黑');
      } else {
        alert(data.message || '操作失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setUnblockingUserId(null);
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

  if (error && blockedUsers.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">黑名单管理</h1>
            <Link
              href="/profile"
              className="text-blue-600 hover:text-blue-700"
            >
              返回个人资料
            </Link>
          </div>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>暂无拉黑的用户</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Link href={`/user/${user.id}`}>
                      {user.avatarKey ? (
                        <Image
                          src={`/api/images?key=${user.avatarKey}`}
                          alt={user.nickname}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-lg font-medium">
                            {user.nickname.charAt(0)}
                          </span>
                        </div>
                      )}
                    </Link>

                    <div>
                      <Link
                        href={`/user/${user.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {user.nickname}
                      </Link>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(user.id)}
                    disabled={unblockingUserId === user.id}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unblockingUserId === user.id ? '处理中...' : '取消拉黑'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
