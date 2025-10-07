// Logout route - Delete session and clear cookie
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, deleteSession } from '@/lib/auth';
import { successResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Get current user (may be null if already logged out)
    const user = await getCurrentUser(request);

    // Always clear the cookie, even if user is not found
    const response = NextResponse.json(successResponse(null));
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    // Delete session from KV (async, don't wait for it)
    if (user) {
      deleteSession(user.userId).catch((error) => {
        console.error('Failed to delete session from KV:', error);
        // Ignore error, cookie is already cleared
      });
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear the cookie
    const response = NextResponse.json(successResponse(null));
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}
