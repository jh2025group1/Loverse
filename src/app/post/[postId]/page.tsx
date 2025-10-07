// Post detail page with comments
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { CommentSection } from '@/components/CommentSection';
import Link from 'next/link';
import Image from 'next/image';

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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const loadPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        credentials: 'include',
      });

      const data = await response.json() as { code: number; data?: Post; message?: string };

      if (response.ok && data.code === 0) {
        setPost(data.data!);
      } else {
        setError(data.message || '加载失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleDelete = async () => {
    if (!confirm('确定要删除这条表白吗？')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json() as { code: number; message?: string };

      if (response.ok && data.code === 0) {
        alert('删除成功');
        router.push('/');
      } else {
        alert(data.message || '删除失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setDeleting(false);
    }
  };

  const handleBlock = async () => {
    if (!post?.author) {
      return;
    }

    if (!confirm(`确定要拉黑用户 ${post.author.nickname} 吗？拉黑后将不再看到该用户的表白。`)) {
      return;
    }

    setBlocking(true);

    try {
      const response = await fetch(`/api/users/${post.author.id}/block`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json() as { code: number; message?: string };

      if (response.ok && data.code === 0) {
        alert('拉黑成功');
        router.push('/');
      } else {
        alert(data.message || '拉黑失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setBlocking(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN');
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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-red-600">{error || '表白不存在'}</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Author info */}
          <div className="flex items-center mb-4">
            {post.isAnonymous ? (
              <>
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-xl">?</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">匿名用户</p>
                  <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </>
            ) : post.author ? (
              <>
                {post.author.avatarKey ? (
                  <Image
                    src={`/api/images?key=${post.author.avatarKey}`}
                    alt={post.author.nickname}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-xl">
                      {post.author.nickname.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{post.author.nickname}</p>
                  <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </>
            ) : null}

            <div className="ml-auto flex space-x-2">
              {post.isOwner ? (
                <>
                  <a
                    href={`/post/${post.id}/edit`}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    编辑
                  </a>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? '删除中...' : '删除'}
                  </button>
                </>
              ) : !post.isAnonymous && post.author ? (
                <button
                  onClick={handleBlock}
                  disabled={blocking}
                  className="px-4 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {blocking ? '拉黑中...' : '拉黑用户'}
                </button>
              ) : null}
            </div>
          </div>

          {/* Post content */}
          <div className="mb-4">
            <p className="text-gray-900 text-lg whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Images */}
          {post.images.length > 0 && (
            <div className={`grid gap-4 ${
              post.images.length === 1 ? 'grid-cols-1' :
              post.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {post.images.map((image) => (
                <div key={image.key} className="relative">
                  <Image
                    src={`/api/images?key=${image.key}`}
                    alt="Post image"
                    width={400}
                    height={400}
                    className="w-full rounded-lg"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments section */}
        <CommentSection postId={parseInt(postId)} />
      </div>
    </div>
  );
}
