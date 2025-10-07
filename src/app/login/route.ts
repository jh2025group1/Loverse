// Login route using Digest Authentication
import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/db';
import { verifyDigestAuth, generateDigestChallenge, createJWT, updateSessionExpiry } from '@/lib/auth';
import { ErrorCodes, ErrorMessages } from '@/lib/errors';


export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  // No auth header, send challenge (first request)
  if (!authHeader) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': generateDigestChallenge(),
      },
    });
  }

  // Parse username from auth header
  const usernameMatch = authHeader.match(/username="([^"]+)"/);
  if (!usernameMatch) {
    // Auth header malformed, return JSON error without WWW-Authenticate
    return NextResponse.json(
      {
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: ErrorMessages[ErrorCodes.AUTH_INVALID_CREDENTIALS]
      },
      { status: 401 }
    );
  }

  const username = usernameMatch[1];

  try {
    // Get user from database
    const user = await getUserByUsername(username);
    if (!user) {
      // User not found, return JSON error without WWW-Authenticate
      return NextResponse.json(
        {
          code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
          message: ErrorMessages[ErrorCodes.AUTH_INVALID_CREDENTIALS]
        },
        { status: 401 }
      );
    }

    // Verify digest auth
    const isValid = await verifyDigestAuth(request.method, authHeader, user.ha1_hash);
    if (!isValid) {
      // Invalid credentials, return JSON error without WWW-Authenticate
      return NextResponse.json(
        {
          code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
          message: ErrorMessages[ErrorCodes.AUTH_INVALID_CREDENTIALS]
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createJWT(user.id, user.username);

    // Store session with 1 hour expiry
    await updateSessionExpiry(user.id, token);

    // Return JSON response with token in cookie
    const response = NextResponse.json({
      code: 0,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.username,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        code: ErrorCodes.INTERNAL_ERROR,
        message: ErrorMessages[ErrorCodes.INTERNAL_ERROR]
      },
      { status: 500 }
    );
  }
}
