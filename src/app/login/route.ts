// Login route - Proxy to Java backend
import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  try {
    // For login, backend expects body with user_account and password
    // We need to get this from the Authorization header or request
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { code: 401, message: 'Missing credentials' },
        { status: 401 }
      );
    }

    // Parse Digest auth to extract username
    const usernameMatch = authHeader.match(/username="([^"]+)"/);
    const passwordMatch = authHeader.match(/response="([^"]+)"/);
    
    if (!usernameMatch) {
      return NextResponse.json(
        { code: 401, message: 'Invalid credentials format' },
        { status: 401 }
      );
    }

    const username = usernameMatch[1];
    
    // For backend login, we need plain password
    // Since we're using Digest auth, we'll need to handle this differently
    // For now, forward to backend with available info
    
    // Backend expects: { user_account, password }
    // We'll need frontend to send these in body for initial login
    const body = {
      user_account: parseInt(username) || username,
      password: passwordMatch ? passwordMatch[1] : '', // This is the response hash, not plain password
    };

    const response = await proxyToBackend({
      method: 'GET',
      path: '/apifox/user/login',
      request,
      body,
    });

    // If successful, set cookie
    if (response.ok) {
      const data = await response.json() as { user_data?: string };
      const cookieResponse = NextResponse.json(data);
      
      // Set auth cookie if backend provides token
      if (data.user_data) {
        cookieResponse.cookies.set('auth_token', data.user_data, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60, // 1 hour
          path: '/',
        });
      }
      
      return cookieResponse;
    }

    return response;
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { code: -1, message: 'Login failed' },
      { status: 500 }
    );
  }
}
