// CommentSection component - Display and create comments
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ApiResponse } from '@/types/api';
import { UserHoverCard } from './UserHoverCard';

interface Author {
  id: number;
  username: string;
  nickname: string;
  avatarKey: string | null;
}

interface Comment {
  id: number;
  content: string;
  parentCommentId: number | null;
  author: Author | null;
  createdAt: number;
  updatedAt: number;
  isOwner: boolean;
}

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: 'include',
      });

      const data: ApiResponse<{ comments: Comment[] }> = await response.json();

      if (response.ok && data.code === 0) {
        setComments(data.data!.comments);
      }
    } catch {
      console.error('Load comments error');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment,
          parentCommentId: replyTo,
        }),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.code === 0) {
        setNewComment('');
        setReplyTo(null);
        loadComments();
      } else {
        alert(data.message || '评论失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.code === 0) {
        loadComments();
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  // Organize comments into tree structure
  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const getRepliesToComment = (commentId: number) =>
    comments.filter((c) => c.parentCommentId === commentId);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        评论 ({comments.length})
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-6">
        {replyTo && (
          <div className="mb-2 text-sm text-gray-600">
            回复评论 #{replyTo}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-2 text-blue-600 hover:text-blue-700"
            >
              取消
            </button>
          </div>
        )}

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyTo ? '写下你的回复...' : '写下你的评论...'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />

        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '发送中...' : '发表评论'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-600">还没有评论，来抢沙发吧！</div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
              {/* Comment */}
              <div className="flex items-start">
                {comment.author ? (
                  <UserHoverCard
                    userId={comment.author.id}
                    username={comment.author.username}
                    nickname={comment.author.nickname}
                    avatarKey={comment.author.avatarKey}
                  >
                    <Link href={`/user/${comment.author.id}`} className="block flex-shrink-0 hover:opacity-80 transition-opacity">
                      {comment.author.avatarKey ? (
                        <Image
                          src={`/api/images?key=${comment.author.avatarKey}`}
                          alt={comment.author.nickname}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">
                            {comment.author.nickname.charAt(0)}
                          </span>
                        </div>
                      )}
                    </Link>
                  </UserHoverCard>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                )}

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center">
                    {comment.author ? (
                      <UserHoverCard
                        userId={comment.author.id}
                        username={comment.author.username}
                        nickname={comment.author.nickname}
                        avatarKey={comment.author.avatarKey}
                      >
                        <Link href={`/user/${comment.author.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {comment.author.nickname}
                        </Link>
                      </UserHoverCard>
                    ) : (
                      <span className="font-medium text-gray-900">已删除用户</span>
                    )}
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>

                  <div className="mt-2 flex space-x-4 text-sm">
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      回复
                    </button>

                    {comment.isOwner && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </button>
                    )}
                  </div>

                  {/* Replies */}
                  {getRepliesToComment(comment.id).length > 0 && (
                    <div className="mt-4 space-y-3">
                      {getRepliesToComment(comment.id).map((reply) => (
                        <div key={reply.id} className="flex items-start">
                          {reply.author ? (
                            <UserHoverCard
                              userId={reply.author.id}
                              username={reply.author.username}
                              nickname={reply.author.nickname}
                              avatarKey={reply.author.avatarKey}
                            >
                              <Link href={`/user/${reply.author.id}`} className="block flex-shrink-0 hover:opacity-80 transition-opacity">
                                {reply.author.avatarKey ? (
                                  <Image
                                    src={`/api/images?key=${reply.author.avatarKey}`}
                                    alt={reply.author.nickname}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs">
                                      {reply.author.nickname.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </Link>
                            </UserHoverCard>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0"></div>
                          )}

                          <div className="ml-2 flex-1 min-w-0">
                            <div className="flex items-center">
                              {reply.author ? (
                                <UserHoverCard
                                  userId={reply.author.id}
                                  username={reply.author.username}
                                  nickname={reply.author.nickname}
                                  avatarKey={reply.author.avatarKey}
                                >
                                  <Link href={`/user/${reply.author.id}`} className="font-medium text-sm text-gray-900 hover:text-blue-600">
                                    {reply.author.nickname}
                                  </Link>
                                </UserHoverCard>
                              ) : (
                                <span className="font-medium text-sm text-gray-900">已删除用户</span>
                              )}
                              <span className="ml-2 text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {reply.content}
                            </p>

                            <div className="mt-1 flex space-x-4 text-xs">
                              <button
                                onClick={() => setReplyTo(comment.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                回复
                              </button>

                              {reply.isOwner && (
                                <button
                                  onClick={() => handleDelete(reply.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  删除
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
