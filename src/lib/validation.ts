// Validation utilities
import { AppError, ErrorCodes } from './errors';

// Username validation: 3-20 characters, alphanumeric and underscore only
export function validateUsername(username: string): void {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new AppError(ErrorCodes.USER_INVALID_USERNAME);
  }
}

// Password validation: at least 6 characters
export function validatePassword(password: string): void {
  if (password.length < 6) {
    throw new AppError(ErrorCodes.USER_INVALID_PASSWORD);
  }
}

// Nickname validation: 1-50 characters
export function validateNickname(nickname: string): void {
  if (nickname.length < 1 || nickname.length > 50) {
    throw new AppError(ErrorCodes.USER_INVALID_NICKNAME);
  }
}

// Post content validation: 1-5000 characters
export function validatePostContent(content: string): void {
  if (content.length < 1 || content.length > 5000) {
    throw new AppError(ErrorCodes.POST_INVALID_CONTENT);
  }
}

// Comment content validation: 1-1000 characters
export function validateCommentContent(content: string): void {
  if (content.length < 1 || content.length > 1000) {
    throw new AppError(ErrorCodes.COMMENT_INVALID_CONTENT);
  }
}

// Validate image count
export function validateImageCount(count: number): void {
  if (count > 9) {
    throw new AppError(ErrorCodes.POST_TOO_MANY_IMAGES);
  }
}
