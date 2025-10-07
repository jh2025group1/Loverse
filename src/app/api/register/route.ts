// Registration API route - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username: string; password: string; nickname: string };
    const { username, password, nickname } = body;

    // Transform to backend format
    // Frontend: { username, password, nickname }
    // Backend: { user_account, user_name, password, user_type }
    const backendBody = {
      user_account: parseInt(username) || username, // Try to convert to number
      user_name: nickname,
      password: password,
      user_type: "1", // Default user type
    };

    return await proxyToBackend({
      method: 'POST',
      path: '/apifox/user/register',
      request,
      body: backendBody,
    });
  } catch (error) {
    console.error('Registration proxy error:', error);
    return Response.json(
      { code: -1, message: 'Registration failed' },
      { status: 500 }
    );
  }
}
