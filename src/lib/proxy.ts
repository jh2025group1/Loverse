// Proxy utility for forwarding requests to Java backend
import { NextRequest } from 'next/server';
import { getCurrentUser } from './auth';

const BACKEND_URL = process.env.BACKEND_URL || 'https://gtp4free.onrender.com';

interface ProxyOptions {
  method?: string;
  path: string;
  request: NextRequest;
  body?: unknown;
  useFormData?: boolean;
  queryParams?: Record<string, string>;
}

/**
 * Forward request to Java backend
 */
export async function proxyToBackend(options: ProxyOptions): Promise<Response> {
  const { method, path, request, body, useFormData = false, queryParams } = options;
  
  try {
    const headers: Record<string, string> = {};
    
    // Forward Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // Forward token header (for JWT refresh)
    const tokenHeader = request.headers.get('token');
    if (tokenHeader) {
      headers['token'] = tokenHeader;
    }
    
    // Build fetch options
    const fetchOptions: RequestInit = {
      method: method || request.method,
      headers,
    };
    
    // Add body if provided
    if (body !== undefined) {
      if (useFormData) {
        fetchOptions.body = body as BodyInit;
      } else {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
      }
    }
    
    // Build URL with query params
    let url = `${BACKEND_URL}${path}`;
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }
    
    // Make request to backend
    const response = await fetch(url, fetchOptions);
    
    // Parse response
    const data = await response.json();
    
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return Response.json(
      { code: -1, message: 'Backend proxy error' },
      { status: 500 }
    );
  }
}

/**
 * Get user account from current session
 */
export async function getUserAccount(request: NextRequest): Promise<string | null> {
  try {
    const user = await getCurrentUser(request);
    return user ? user.username : null;
  } catch {
    return null;
  }
}
