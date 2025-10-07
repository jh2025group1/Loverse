// Profile API - Proxy to Java backend
import { NextRequest } from 'next/server';
import { proxyToBackend, getUserAccount } from '@/lib/proxy';

// Get current user profile
export async function GET(request: NextRequest) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Backend might have a user info endpoint - for now return basic info
    // You may need to add a specific backend endpoint for user profile
    return Response.json({
      code: 0,
      data: {
        username: userAccount,
        message: 'Profile endpoint needs backend implementation',
      },
    });
  } catch (error) {
    console.error('Get profile proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    const userAccount = await getUserAccount(request);
    if (!userAccount) {
      return Response.json(
        { code: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const nickname = formData.get('nickname') as string | null;
    const avatar = formData.get('avatar') as File | null;

    // If updating avatar
    if (avatar) {
      const backendFormData = new FormData();
      backendFormData.append('file', avatar);
      backendFormData.append('account', userAccount);

      return await proxyToBackend({
        method: 'PUT',
        path: '/apifox/image/updateHead',
        request,
        body: backendFormData,
        useFormData: true,
      });
    }

    // If updating other profile info
    if (nickname) {
      // Backend expects: prev_account, new_account (and possibly other fields)
      const backendBody = {
        prev_account: parseInt(userAccount) || userAccount,
        new_account: parseInt(userAccount) || userAccount,
        // Note: nickname update might need a different backend endpoint
      };

      return await proxyToBackend({
        method: 'PUT',
        path: '/apifox/user/update',
        request,
        body: backendBody,
      });
    }

    return Response.json({
      code: 0,
      message: 'No updates provided',
    });
  } catch (error) {
    console.error('Update profile proxy error:', error);
    return Response.json(
      { code: -1, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
