'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LogoutButton } from './LogoutButton';
import { LoginButton } from './LoginButton';

interface MobileMenuProps {
  isLoggedIn: boolean;
  userInfo: { nickname: string; userId: number } | null;
}

export function MobileMenu({ isLoggedIn, userInfo }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <MenuButton isOpen={isOpen} onClick={toggleMenu} />
      <MenuPanel 
        isOpen={isOpen} 
        isLoggedIn={isLoggedIn} 
        userInfo={userInfo} 
        onClose={closeMenu} 
      />
    </div>
  );
}

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

function MenuButton({ isOpen, onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
      aria-expanded={isOpen}
      aria-label={isOpen ? '关闭菜单' : '打开菜单'}
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <span 
          className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-1.5' : '-translate-y-1'
          }`}
        />
        <span 
          className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <span 
          className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-1'
          }`}
        />
      </div>
    </button>
  );
}

interface MenuPanelProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  userInfo: { nickname: string; userId: number } | null;
  onClose: () => void;
}

function MenuPanel({ isOpen, isLoggedIn, userInfo, onClose }: MenuPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed left-0 right-0 bottom-0 bg-black/20 backdrop-blur-[2px] z-40 animate-in fade-in duration-200"
        style={{ top: '4rem' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed right-2 top-[4.5rem] w-72 max-w-[calc(100vw-1rem)] bg-white shadow-2xl rounded-2xl border border-gray-200 z-50 animate-in slide-in-from-right duration-300">
        <nav className="flex flex-col py-3 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <MenuItem href="/" onClick={onClose} icon={<HomeIcon />}>
            首页
          </MenuItem>

          {isLoggedIn && userInfo ? (
            <>
              <MenuDivider />
              <MenuItem href="/post/new" onClick={onClose} icon={<PenIcon />}>
                发表白
              </MenuItem>
              <MenuItem href="/profile" onClick={onClose} icon={<UserIcon />}>
                {userInfo.nickname}
              </MenuItem>
              <MenuDivider />
              <div className="px-3 py-2">
                <LogoutButton />
              </div>
            </>
          ) : (
            <>
              <MenuDivider />
              <div className="px-3 py-2">
                <LoginButton />
              </div>
              <div className="px-3 py-2">
                <Link
                  href="/register"
                  onClick={onClose}
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-4 py-3 rounded-lg text-sm font-medium text-center shadow-md hover:shadow-lg transition-all duration-200"
                >
                  注册账号
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </>
  );
}

interface MenuItemProps {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function MenuItem({ href, onClick, icon, children }: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 px-4 py-3 text-sm font-medium transition-all duration-200 group"
    >
      <span className="text-gray-400 group-hover:text-blue-600 transition-colors duration-200">
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  );
}

function MenuDivider() {
  return <div className="my-1 border-t border-gray-100" />;
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
