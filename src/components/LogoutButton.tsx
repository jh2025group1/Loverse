// Logout button - Client component for handling logout interaction
'use client';

import { useState } from 'react';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) {
      return;
    }

    // 设置登出状态，禁用按钮
    setIsLoggingOut(true);

    try {
      // 调用后端 API 清理 session 和 cookie（必须等待，因为 cookie 是 HttpOnly）
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // 即使出错也继续刷新，因为可能是网络问题
    }

    // 清除浏览器的 Digest 认证缓存
    // 使用 XMLHttpRequest 发送错误凭据来清除浏览器缓存
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/login', true, 'logout', 'logout'); // 使用错误的用户名密码
      xhr.send();
      // 不等待响应，立即继续
    } catch {
      // 忽略错误
    }

    // 刷新页面到首页（此时 cookie 已被后端清除，浏览器认证缓存也被清除）
    window.location.replace('/');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoggingOut ? '退出中...' : '退出'}
    </button>
  );
}
