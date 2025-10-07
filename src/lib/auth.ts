// Authentication utilities using Digest Auth and JWT
import { SignJWT, jwtVerify } from 'jose';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const REALM = 'Loverse';
const JWT_EXPIRY = 60 * 60; // 1 hour in seconds

export interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

// Generate MD5 hash for HA1
async function md5(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('MD5', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate HA1 hash: MD5(username:realm:password)
export async function generateHA1(username: string, password: string): Promise<string> {
  return md5(`${username}:${REALM}:${password}`);
}

// Parse Digest Authorization header
export function parseDigestAuth(authHeader: string): Record<string, string> | null {
  if (!authHeader.startsWith('Digest ')) {
    return null;
  }

  const parts = authHeader.substring(7).split(',');
  const params: Record<string, string> = {};

  for (const part of parts) {
    const [key, ...valueParts] = part.trim().split('=');
    let value = valueParts.join('=');
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (key) {
      params[key] = value;
    }
  }

  return params;
}

// Verify Digest Auth response
export async function verifyDigestAuth(
  method: string,
  authHeader: string,
  ha1: string
): Promise<boolean> {
  const params = parseDigestAuth(authHeader);
  if (!params) return false;

  const { realm, nonce, uri, response, qop, nc, cnonce } = params;

  if (realm !== REALM) return false;

  // Calculate HA2: MD5(method:uri)
  const ha2 = await md5(`${method}:${uri}`);

  // Calculate expected response
  let expectedResponse: string;
  if (qop === 'auth') {
    // With qop: MD5(HA1:nonce:nc:cnonce:qop:HA2)
    expectedResponse = await md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  } else {
    // Without qop: MD5(HA1:nonce:HA2)
    expectedResponse = await md5(`${ha1}:${nonce}:${ha2}`);
  }

  return response === expectedResponse;
}

// Generate Digest Auth challenge (WWW-Authenticate header)
export function generateDigestChallenge(): string {
  const nonce = crypto.randomUUID();
  const opaque = crypto.randomUUID();

  return `Digest realm="${REALM}", qop="auth", nonce="${nonce}", opaque="${opaque}"`;
}

// Create JWT token
export async function createJWT(userId: number, username: string): Promise<string> {
  const { env } = await getCloudflareContext();
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  const jwt = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY}s`)
    .sign(secret);

  return jwt;
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { env } = await getCloudflareContext();
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Get current user from request
export async function getCurrentUser(request: Request): Promise<JWTPayload | null> {
  // First, try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyJWT(token);
  }

  // If no Authorization header, try to get token from cookie
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token' && value) {
        return verifyJWT(value);
      }
    }
  }

  return null;
}

// Update session expiry in KV
export async function updateSessionExpiry(userId: number, token: string): Promise<void> {
  const { env } = await getCloudflareContext();
  const key = `session:${userId}`;

  await env.SESSIONS.put(key, token, {
    expirationTtl: JWT_EXPIRY,
  });
}

// Check if session is valid
export async function checkSession(userId: number): Promise<string | null> {
  const { env } = await getCloudflareContext();
  const key = `session:${userId}`;

  return env.SESSIONS.get(key);
}

// Delete session
export async function deleteSession(userId: number): Promise<void> {
  const { env } = await getCloudflareContext();
  const key = `session:${userId}`;

  await env.SESSIONS.delete(key);
}
