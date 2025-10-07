// UserHoverCard component - Display user info on hover with block/unblock functionality
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const SHOW_DELAY = 500;
const HIDE_DELAY = 200;

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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const loadUserDetail = useCallback(async () => {
    if (loading || userDetail) return;
    
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
  }, [userId, loading, userDetail]);

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (!showTimeoutRef.current) {
      showTimeoutRef.current = setTimeout(() => {
        setShowCard(true);
        loadUserDetail();
        showTimeoutRef.current = null;
      }, SHOW_DELAY);
    }
  }, [loadUserDetail]);

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (!hideTimeoutRef.current) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowCard(false);
        hideTimeoutRef.current = null;
      }, HIDE_DELAY);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isTouchDevice && !showCard) {
      e.preventDefault();
      e.stopPropagation();
      setShowCard(true);
      loadUserDetail();
    }
  }, [isTouchDevice, showCard, loadUserDetail]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    // In capture phase, prevent navigation on touch devices if card is not shown
    if (isTouchDevice && !showCard) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isTouchDevice, showCard]);

  const handleClickOutside = useCallback(() => {
    setShowCard(false);
  }, []);

  useEffect(() => {
    if (!showCard) return;

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCard, handleClickOutside]);

  const handleBlockToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userDetail || blockActionLoading) return;

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
  }, [userDetail, userId, blockActionLoading]);

  useEffect(() => {
    return clearTimeouts;
  }, [clearTimeouts]);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClickCapture={handleClickCapture}
      onClick={handleClick}
    >
      {children}

      {showCard && <HoverCardContent 
        userId={userId}
        username={username}
        nickname={nickname}
        avatarKey={avatarKey}
        userDetail={userDetail}
        loading={loading}
        blockActionLoading={blockActionLoading}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onBlockToggle={handleBlockToggle}
      />}
    </div>
  );
}

interface HoverCardContentProps {
  userId: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
  userDetail: UserDetail | null;
  loading: boolean;
  blockActionLoading: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onBlockToggle: (e: React.MouseEvent) => void;
}

function HoverCardContent({
  userId,
  username,
  nickname,
  avatarKey,
  userDetail,
  loading,
  blockActionLoading,
  onMouseEnter,
  onMouseLeave,
  onBlockToggle,
}: HoverCardContentProps) {
  return (
    <>
      <div 
        className="absolute left-0 right-0 h-2 z-40"
        style={{ top: '100%' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      <div
        className="absolute z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 left-0"
        style={{ top: 'calc(100% + 8px)' }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <LoadingSpinner />
        ) : userDetail ? (
          <UserCardDetails 
            userId={userId}
            username={username}
            nickname={nickname}
            avatarKey={avatarKey}
            userDetail={userDetail}
            blockActionLoading={blockActionLoading}
            onBlockToggle={onBlockToggle}
          />
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">加载失败</div>
        )}
      </div>
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="text-center py-4">
      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  );
}

interface UserCardDetailsProps {
  userId: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
  userDetail: UserDetail;
  blockActionLoading: boolean;
  onBlockToggle: (e: React.MouseEvent) => void;
}

function UserCardDetails({
  userId,
  username,
  nickname,
  avatarKey,
  userDetail,
  blockActionLoading,
  onBlockToggle,
}: UserCardDetailsProps) {
  const joinDate = useMemo(
    () => new Date(userDetail.createdAt * 1000).toLocaleDateString('zh-CN'),
    [userDetail.createdAt]
  );

  return (
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
            加入于 {joinDate}
          </p>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          href={`/user/${userId}`}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          查看主页
        </Link>
        <button
          onClick={onBlockToggle}
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
  );
}
