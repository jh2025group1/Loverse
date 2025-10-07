// Header component (Server Component)
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { LogoutButton } from './LogoutButton';
import { LoginButton } from './LoginButton';

export async function Header() {
  // Get auth token from cookies (server-side)
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  let isLoggedIn = false;
  let userInfo: { nickname: string; userId: number } | null = null;

  // Verify token and get user info on server-side
  if (authToken?.value) {
    try {
      const payload = await verifyJWT(authToken.value);
      if (payload) {
        const user = await getUserById(payload.userId);
        if (user) {
          isLoggedIn = true;
          userInfo = {
            nickname: user.nickname,
            userId: user.id,
          };
        }
      }
    } catch {
      // Token invalid or expired
    }
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Loverse
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              首页
            </Link>

            {isLoggedIn && userInfo ? (
              <>
                <Link
                  href="/post/new"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  发表白
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {userInfo.nickname}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <LoginButton />
                <Link
                  href="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
