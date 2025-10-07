// Login Button Component (Client Component)
'use client';

import type { ApiResponse } from '@/types/api';

export function LoginButton() {
  const handleLogin = async () => {
    try {
      // Clear cached HTTP Auth credentials by making a request with invalid auth
      // This forces the browser to forget the old credentials
      try {
        await fetch('/login', {
          method: 'GET',
          credentials: 'include',
          headers: {
            // Send invalid basic auth to clear the Digest auth cache
            'Authorization': 'Basic clear',
          },
        });
      } catch {
        // Ignore error from clearing
      }

      // Small delay to ensure cache is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now make the real login request
      const response = await fetch('/login', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        // Login successful, parse response
        const data: ApiResponse = await response.json();
        if (data.code === 0) {
          // Success, refresh page to update UI
          window.location.reload();
        } else {
          // Failed with error code
          alert(data.message || '登录失败');
        }
      } else if (response.status === 401) {
        // Check if it's a JSON error response (credentials were wrong)
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const data: ApiResponse = await response.json();
            alert(data.message || '用户名或密码错误');
          } catch {
            alert('用户名或密码错误');
          }
        }
        // If it's WWW-Authenticate challenge, browser handles it automatically
      } else {
        // Other errors
        try {
          const data: ApiResponse = await response.json();
          alert(data.message || '登录失败，请稍后重试');
        } catch {
          alert('登录失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // User may have cancelled the auth dialog
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
    >
      登录
    </button>
  );
}
