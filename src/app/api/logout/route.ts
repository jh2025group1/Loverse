// Logout route - Clear cookie and session
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Clear the auth cookie
    const response = NextResponse.json({
      code: 0,
      message: '登出成功',
    });
    
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear the cookie
    const response = NextResponse.json({
      code: 0,
      message: '登出成功',
    });
    
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
