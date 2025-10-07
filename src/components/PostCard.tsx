// PostCard component - Display individual post
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { UserHoverCard } from './UserHoverCard';

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

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Author info */}
      <div className="flex items-center mb-4">
        {post.isAnonymous ? (
          <>
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600">?</span>
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">匿名用户</p>
              <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </>
        ) : post.author ? (
          <>
            <UserHoverCard
              userId={post.author.id}
              username={post.author.username}
              nickname={post.author.nickname}
              avatarKey={post.author.avatarKey}
            >
              <Link href={`/user/${post.author.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                {post.author.avatarKey ? (
                  <Image
                    src={`/api/images?key=${post.author.avatarKey}`}
                    alt={post.author.nickname}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {post.author.nickname.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{post.author.nickname}</p>
                  <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </Link>
            </UserHoverCard>
          </>
        ) : null}

        {!post.isPublic && post.isOwner && (
          <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            仅自己可见
          </span>
        )}
      </div>

      {/* Post content */}
      <div className="mb-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className={`grid gap-2 mb-4 ${
          post.images.length === 1 ? 'grid-cols-1' :
          post.images.length === 2 ? 'grid-cols-2' :
          post.images.length === 3 ? 'grid-cols-3' :
          post.images.length === 4 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {post.images.map((image) => (
            <div key={image.key} className="relative aspect-square">
              <Image
                src={`/api/images?key=${image.key}`}
                alt="Post image"
                fill
                className="object-cover rounded-lg"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-4 text-sm">
        <Link
          href={`/post/${post.id}`}
          className="text-blue-600 hover:text-blue-700"
        >
          查看详情
        </Link>

        {post.isOwner && (
          <>
            <Link
              href={`/post/${post.id}/edit`}
              className="text-gray-600 hover:text-gray-700"
            >
              编辑
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
