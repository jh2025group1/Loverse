// Header component (Server Component)
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { LogoutButton } from './LogoutButton';
import { LoginButton } from './LoginButton';
import { MobileMenu } from './MobileMenu';

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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600 flex-shrink-0">
            Loverse
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            >
              首页
            </Link>

            {isLoggedIn && userInfo ? (
              <>
                <Link
                  href="/post/new"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                >
                  发表白
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
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
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                >
                  注册
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu */}
          <MobileMenu isLoggedIn={isLoggedIn} userInfo={userInfo} />
        </div>
      </div>
    </header>
  );
}
