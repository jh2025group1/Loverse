// Database utility functions
import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface User {
  id: number;
  username: string;
  ha1_hash: string;
  nickname: string;
  avatar_key: string | null;
  created_at: number;
  updated_at: number;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  is_anonymous: number;
  is_public: number;
  created_at: number;
  updated_at: number;
}

export interface PostImage {
  id: number;
  post_id: number;
  image_key: string;
  image_order: number;
  created_at: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_comment_id: number | null;
  content: string;
  created_at: number;
  updated_at: number;
}

export interface BlocklistEntry {
  id: number;
  blocker_user_id: number;
  blocked_user_id: number;
  created_at: number;
}

export async function getDb() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

// User operations
export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username).first<User>();

  return result;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(id).first<User>();

  return result;
}

export async function createUser(
  username: string,
  ha1Hash: string,
  nickname: string
): Promise<number> {
  const db = await getDb();
  const result = await db.prepare(
    'INSERT INTO users (username, ha1_hash, nickname) VALUES (?, ?, ?)'
  ).bind(username, ha1Hash, nickname).run();

  if (!result.success) {
    throw new Error('Failed to create user');
  }

  // Get the inserted user's ID
  const user = await getUserByUsername(username);
  return user!.id;
}

export async function updateUser(
  userId: number,
  updates: { nickname?: string; avatar_key?: string }
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.nickname !== undefined) {
    fields.push('nickname = ?');
    values.push(updates.nickname);
  }

  if (updates.avatar_key !== undefined) {
    fields.push('avatar_key = ?');
    values.push(updates.avatar_key);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = unixepoch()');
  values.push(userId);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  await db.prepare(sql).bind(...values).run();
}

// Post operations
export async function createPost(
  userId: number,
  content: string,
  isAnonymous: boolean,
  isPublic: boolean
): Promise<number> {
  const db = await getDb();
  const result = await db.prepare(
    'INSERT INTO posts (user_id, content, is_anonymous, is_public) VALUES (?, ?, ?, ?)'
  ).bind(userId, content, isAnonymous ? 1 : 0, isPublic ? 1 : 0).run();

  if (!result.success) {
    throw new Error('Failed to create post');
  }

  // Get last insert id
  const post = await db.prepare(
    'SELECT id FROM posts WHERE user_id = ? ORDER BY id DESC LIMIT 1'
  ).bind(userId).first<{ id: number }>();

  return post!.id;
}

export async function getPostById(postId: number): Promise<Post | null> {
  const db = await getDb();
  return db.prepare('SELECT * FROM posts WHERE id = ?').bind(postId).first<Post>();
}

export async function getPosts(
  limit: number = 20,
  offset: number = 0,
  userId?: number
): Promise<Post[]> {
  const db = await getDb();
  let query = 'SELECT * FROM posts WHERE is_public = 1';
  const params: (string | number)[] = [];

  if (userId) {
    query += ' OR user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await db.prepare(query).bind(...params).all<Post>();
  return result.results || [];
}

export async function getUserPosts(userId: number): Promise<Post[]> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all<Post>();

  return result.results || [];
}

export async function updatePost(
  postId: number,
  updates: { content?: string; is_anonymous?: boolean; is_public?: boolean }
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }

  if (updates.is_anonymous !== undefined) {
    fields.push('is_anonymous = ?');
    values.push(updates.is_anonymous ? 1 : 0);
  }

  if (updates.is_public !== undefined) {
    fields.push('is_public = ?');
    values.push(updates.is_public ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = unixepoch()');
  values.push(postId);

  const sql = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;
  await db.prepare(sql).bind(...values).run();
}

export async function deletePost(postId: number): Promise<void> {
  const db = await getDb();
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
}

// Post images operations
export async function addPostImage(
  postId: number,
  imageKey: string,
  order: number
): Promise<void> {
  const db = await getDb();
  await db.prepare(
    'INSERT INTO post_images (post_id, image_key, image_order) VALUES (?, ?, ?)'
  ).bind(postId, imageKey, order).run();
}

export async function getPostImages(postId: number): Promise<PostImage[]> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT * FROM post_images WHERE post_id = ? ORDER BY image_order'
  ).bind(postId).all<PostImage>();

  return result.results || [];
}

// Batch get post images for multiple posts
export async function getPostsImages(postIds: number[]): Promise<Map<number, PostImage[]>> {
  if (postIds.length === 0) {
    return new Map();
  }

  const db = await getDb();
  const placeholders = postIds.map(() => '?').join(',');
  const result = await db.prepare(
    `SELECT * FROM post_images WHERE post_id IN (${placeholders}) ORDER BY post_id, image_order`
  ).bind(...postIds).all<PostImage>();

  // Group images by post_id
  const imagesMap = new Map<number, PostImage[]>();
  for (const image of result.results || []) {
    if (!imagesMap.has(image.post_id)) {
      imagesMap.set(image.post_id, []);
    }
    imagesMap.get(image.post_id)!.push(image);
  }

  return imagesMap;
}

export async function deletePostImages(postId: number): Promise<void> {
  const db = await getDb();
  await db.prepare('DELETE FROM post_images WHERE post_id = ?').bind(postId).run();
}

// Comment operations
export async function createComment(
  postId: number,
  userId: number,
  content: string,
  parentCommentId?: number
): Promise<number> {
  const db = await getDb();
  const result = await db.prepare(
    'INSERT INTO comments (post_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)'
  ).bind(postId, userId, content, parentCommentId || null).run();

  if (!result.success) {
    throw new Error('Failed to create comment');
  }

  // Get last insert id
  const comment = await db.prepare(
    'SELECT id FROM comments WHERE post_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1'
  ).bind(postId, userId).first<{ id: number }>();

  return comment!.id;
}

export async function getPostComments(postId: number): Promise<Comment[]> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
  ).bind(postId).all<Comment>();

  return result.results || [];
}

export async function deleteComment(commentId: number): Promise<void> {
  const db = await getDb();
  await db.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();
}

export async function getCommentById(commentId: number): Promise<Comment | null> {
  const db = await getDb();
  return db.prepare('SELECT * FROM comments WHERE id = ?').bind(commentId).first<Comment>();
}

// Blocklist operations
export async function blockUser(blockerUserId: number, blockedUserId: number): Promise<void> {
  const db = await getDb();
  await db.prepare(
    'INSERT OR IGNORE INTO blocklist (blocker_user_id, blocked_user_id) VALUES (?, ?)'
  ).bind(blockerUserId, blockedUserId).run();
}

export async function unblockUser(blockerUserId: number, blockedUserId: number): Promise<void> {
  const db = await getDb();
  await db.prepare(
    'DELETE FROM blocklist WHERE blocker_user_id = ? AND blocked_user_id = ?'
  ).bind(blockerUserId, blockedUserId).run();
}

export async function isUserBlocked(blockerUserId: number, blockedUserId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT 1 FROM blocklist WHERE blocker_user_id = ? AND blocked_user_id = ?'
  ).bind(blockerUserId, blockedUserId).first();

  return result !== null;
}

export async function getBlockedUsers(userId: number): Promise<number[]> {
  const db = await getDb();
  const result = await db.prepare(
    'SELECT blocked_user_id FROM blocklist WHERE blocker_user_id = ?'
  ).bind(userId).all<{ blocked_user_id: number }>();

  return result.results?.map(r => r.blocked_user_id) || [];
}

// Get posts excluding blocked users
export async function getPostsExcludingBlocked(
  userId: number | null,
  limit: number = 20,
  offset: number = 0
): Promise<Post[]> {
  const db = await getDb();

  if (!userId) {
    // Not logged in, show all public posts
    const result = await db.prepare(
      'SELECT * FROM posts WHERE is_public = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset).all<Post>();
    return result.results || [];
  }

  // Logged in, exclude blocked users
  const result = await db.prepare(`
    SELECT p.* FROM posts p
    WHERE (p.is_public = 1 OR p.user_id = ?)
    AND p.user_id NOT IN (
      SELECT blocked_user_id FROM blocklist WHERE blocker_user_id = ?
    )
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(userId, userId, limit, offset).all<Post>();

  return result.results || [];
}

// Image reference checking
// Check if an image is still referenced by any user avatar or post
export async function isImageReferenced(imageKey: string): Promise<boolean> {
  const db = await getDb();
  
  // Check if used as avatar
  const avatarRef = await db.prepare(
    'SELECT 1 FROM users WHERE avatar_key = ? LIMIT 1'
  ).bind(imageKey).first();
  
  if (avatarRef) {
    return true;
  }
  
  // Check if used in post_images
  const postImageRef = await db.prepare(
    'SELECT 1 FROM post_images WHERE image_key = ? LIMIT 1'
  ).bind(imageKey).first();
  
  return postImageRef !== null;
}

// Get all image keys that are no longer referenced
export async function getUnreferencedImages(imageKeys: string[]): Promise<string[]> {
  if (imageKeys.length === 0) {
    return [];
  }
  
  const unreferenced: string[] = [];
  
  for (const key of imageKeys) {
    const isReferenced = await isImageReferenced(key);
    if (!isReferenced) {
      unreferenced.push(key);
    }
  }
  
  return unreferenced;
}
