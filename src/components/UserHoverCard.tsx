// UserHoverCard component - Display user info on hover with block/unblock functionality
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ApiResponse } from '@/types/api';

interface UserHoverCardProps {
  userId: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
  children: React.ReactNode;
}

interface UserDetail {
  id: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
  createdAt: number;
  isBlocked: boolean;
}

export function UserHoverCard({
  userId,
  username,
  nickname,
  avatarKey,
  children,
}: UserHoverCardProps) {
  const [showCard, setShowCard] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Set a timeout to show the card
    if (!showTimeoutRef.current) {
      showTimeoutRef.current = setTimeout(() => {
        setShowCard(true);
        if (!userDetail && !loading) {
          loadUserDetail();
        }
        showTimeoutRef.current = null;
      }, 500); // 500ms delay before showing
    }
  };

  const handleMouseLeave = () => {
    // Clear any pending show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    // Set a timeout to hide the card
    if (!hideTimeoutRef.current) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowCard(false);
        hideTimeoutRef.current = null;
      }, 200); // 200ms delay before hiding
    }
  };

  const loadUserDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      });

      const result: ApiResponse<{
        user: {
          id: number;
          username: string;
          nickname: string;
          avatarKey: string | null;
          createdAt: number;
        };
        isBlocked: boolean;
      }> = await response.json();

      if (response.ok && result.code === 0) {
        setUserDetail({
          ...result.data!.user,
          isBlocked: result.data!.isBlocked,
        });
      }
    } catch {
      console.error('Failed to load user detail');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userDetail) return;

    setBlockActionLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: userDetail.isBlocked ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.code === 0) {
        setUserDetail({
          ...userDetail,
          isBlocked: !userDetail.isBlocked,
        });
      } else {
        alert(result.message || '操作失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setBlockActionLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Hover Card with bridge area */}
      {showCard && (
        <>
          {/* Invisible bridge area to prevent card from hiding */}
          <div 
            className="absolute left-0 right-0 h-2 z-40"
            style={{ top: '100%' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
          
          <div
            className="absolute z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 left-0"
            style={{ top: 'calc(100% + 8px)' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : userDetail ? (
              <>
                <div className="flex items-start space-x-3">
                  <Link href={`/user/${userId}`}>
                    {avatarKey ? (
                      <Image
                        src={`/api/images?key=${avatarKey}`}
                        alt={nickname}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-lg font-medium">
                          {nickname.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/user/${userId}`}
                      className="block font-bold text-gray-900 hover:text-blue-600 truncate"
                    >
                      {nickname}
                    </Link>
                    <p className="text-sm text-gray-600 truncate">@{username}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      加入于 {new Date(userDetail.createdAt * 1000).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <Link
                    href={`/user/${userId}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    查看主页
                  </Link>
                  <button
                    onClick={handleBlockToggle}
                    disabled={blockActionLoading}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      userDetail.isBlocked
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {blockActionLoading ? '...' : userDetail.isBlocked ? '取消拉黑' : '拉黑'}
                  </button>
                </div>

                {userDetail.isBlocked && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    你已屏蔽此用户
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">加载失败</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
