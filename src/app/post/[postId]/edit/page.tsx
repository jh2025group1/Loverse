// Edit post page - Update an existing confession
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { ApiResponse } from '@/types/api';

interface Post {
  id: number;
  content: string;
  isAnonymous: boolean;
  isPublic: boolean;
  images: { key: string; order: number }[];
  isOwner: boolean;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [existingImages, setExistingImages] = useState<{ key: string; order: number }[]>([]);
  const [keptImageKeys, setKeptImageKeys] = useState<string[]>([]); // 保留的旧图片keys
  const [newImages, setNewImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPost = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        credentials: 'include',
      });

      const data: ApiResponse<Post> = await response.json();

      if (response.ok && data.code === 0 && data.data) {
        const post = data.data;

        if (!post.isOwner) {
          setError('您没有权限编辑这条表白');
          return;
        }

        setContent(post.content);
        setIsAnonymous(post.isAnonymous);
        setIsPublic(post.isPublic);
        setExistingImages(post.images || []);
        setKeptImageKeys((post.images || []).map(img => img.key)); // 初始时保留所有旧图
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        setError(data.message || '加载失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = keptImageKeys.length + newImages.length + files.length;
    if (totalImages > 9) {
      alert(`最多只能上传9张图片，当前已有${keptImageKeys.length + newImages.length}张`);
      return;
    }
    setNewImages([...newImages, ...files]);
  };

  const removeExistingImage = (key: string) => {
    setKeptImageKeys(keptImageKeys.filter(k => k !== key));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('isAnonymous', String(isAnonymous));
      formData.append('isPublic', String(isPublic));

      // 如果图片有变化（删除了旧图或添加了新图），则需要更新图片
      const imagesChanged = keptImageKeys.length !== existingImages.length || newImages.length > 0;
      formData.append('updateImages', String(imagesChanged));

      if (imagesChanged) {
        // 发送保留的旧图片keys
        keptImageKeys.forEach((key, index) => {
          formData.append(`keepImage${index}`, key);
        });

        // 发送新图片
        newImages.forEach((image, index) => {
          formData.append(`image${index}`, image);
        });
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.code === 0) {
        router.push(`/post/${postId}`);
      } else {
        setError(data.message || '更新失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setSubmitting(false);
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

  if (error && !content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑表白</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                内容 *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="写下你的表白..."
                required
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片（最多9张，当前 {keptImageKeys.length + newImages.length}/9）
              </label>

              <div className="space-y-4">
                {/* 现有图片 */}
                {existingImages.filter(img => keptImageKeys.includes(img.key)).length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">当前图片：</p>
                    <div className="grid grid-cols-3 gap-4">
                      {existingImages
                        .filter(img => keptImageKeys.includes(img.key))
                        .map((img) => (
                          <div key={img.key} className="relative">
                            <Image
                              src={`/api/images?key=${img.key}`}
                              alt="Current image"
                              width={128}
                              height={128}
                              className="w-full h-32 object-cover rounded-lg"
                              unoptimized
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(img.key)}
                              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 新图片预览 */}
                {newImages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">新添加的图片：</p>
                    <div className="grid grid-cols-3 gap-4">
                      {newImages.map((image, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={URL.createObjectURL(image)}
                            alt={`New image ${index + 1}`}
                            width={128}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 上传新图片按钮 */}
                {keptImageKeys.length + newImages.length < 9 && (
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="mt-2 block text-sm text-gray-600">
                          {existingImages.length > 0 || newImages.length > 0 ? '继续添加图片' : '点击上传图片'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                  匿名发布
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  公开（取消勾选则仅自己可见）
                </label>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '更新中...' : '更新'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
