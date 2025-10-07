-- Loverse Database Schema
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    ha1_hash TEXT NOT NULL, -- MD5(username:realm:password) for Digest Auth
    nickname TEXT NOT NULL,
    avatar_key TEXT, -- R2 key for avatar image
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_users_username ON users(username);

-- Posts (Confessions) table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_anonymous INTEGER NOT NULL DEFAULT 0, -- 0: show name, 1: anonymous
    is_public INTEGER NOT NULL DEFAULT 1, -- 0: private (only self), 1: public
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_public ON posts(is_public, created_at DESC);

-- Post images table (up to 9 images per post)
CREATE TABLE IF NOT EXISTS post_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    image_key TEXT NOT NULL, -- R2 key
    image_order INTEGER NOT NULL DEFAULT 0, -- 0-8 for ordering
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id, image_order);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_comment_id INTEGER, -- NULL for top-level comments, otherwise reply to comment
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_id ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Blocklist table
CREATE TABLE IF NOT EXISTS blocklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_user_id INTEGER NOT NULL, -- User who blocks
    blocked_user_id INTEGER NOT NULL, -- User being blocked
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (blocker_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(blocker_user_id, blocked_user_id)
);

CREATE INDEX idx_blocklist_blocker ON blocklist(blocker_user_id);
