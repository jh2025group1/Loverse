// Registration API route
import { NextRequest } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/db';
import { generateHA1 } from '@/lib/auth';
import { validateUsername, validatePassword, validateNickname } from '@/lib/validation';
import { ErrorCodes, createErrorResponse } from '@/lib/errors';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username: string; password: string; nickname: string };
    const { username, password, nickname } = body;

    // Validate inputs
    if (!username || !password || !nickname) {
      return createErrorResponse(ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    validateUsername(username);
    validatePassword(password);
    validateNickname(nickname);

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return createErrorResponse(ErrorCodes.USER_ALREADY_EXISTS);
    }

    // Generate HA1 hash for Digest Auth
    const ha1Hash = await generateHA1(username, password);

    // Create user
    const userId = await createUser(username, ha1Hash, nickname);

    return Response.json({
      code: 0,
      message: '注册成功',
      data: {
        userId,
        username,
        nickname,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      return createErrorResponse(error.code as number, (error as { httpStatus?: number }).httpStatus || 400);
    }

    return createErrorResponse(ErrorCodes.INTERNAL_ERROR, 500);
  }
}
