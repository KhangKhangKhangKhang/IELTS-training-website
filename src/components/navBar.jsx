import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart3, BookMarked, Bell, Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { 
      name: 'Trang Chủ', 
      href: '/', 
      current: location.pathname === '/',
      icon: Home
    },
    { 
      name: 'Giải Đề', 
      href: '/practice', 
      current: location.pathname === '/practice',
      icon: BookOpen
    },
    { 
      name: 'Thống Kê', 
      href: '/statistics', 
      current: location.pathname === '/statistics',
      icon: BarChart3
    },
    { 
      name: 'Từ Vựng', 
      href: '/vocabulary', 
      current: location.pathname === '/vocabulary',
      icon: BookMarked
    },
  ];

  return (
    <>
    <nav className="bg-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo và menu chính */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-slate-100 text-xl font-bold flex items-center">
                <BookOpen className="h-6 w-6 mr-2" />
                IELTS AI Practice
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'border-slate-500 text-slate-100'
                        : 'border-transparent text-slate-300 hover:border-slate-300 hover:text-slate-100'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                  >
                    <IconComponent className="h-5 w-5 mr-1" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Phần bên phải */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button className="bg-slate-700 p-1 rounded-full text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white">
              <span className="sr-only">Thông báo</span>
              <Bell className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button className="bg-slate-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white">
                  <span className="sr-only">Mở menu người dùng</span>
                  <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-slate-200 font-medium">
                    <User className="h-5 w-5" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Nút menu mobile */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Mở menu chính</span>
              {!isMenuOpen ? (
                <Menu className="block h-6 w-6" />
              ) : (
                <X className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile, hiển thị/ẩn dựa trên trạng thái menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'bg-slate-900 border-slate-500 text-white'
                      : 'border-transparent text-slate-300 hover:bg-slate-700 hover:border-slate-300 hover:text-white'
                  } flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <IconComponent className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-700">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-200 font-medium">
                  <User className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">Người dùng</div>
                <div className="text-sm font-medium text-slate-400">user@example.com</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-700">Hồ sơ</a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-700">Cài đặt</a>
              <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-700">Đăng xuất</a>
            </div>
          </div>
        </div>
      )}
    </nav>
    <Outlet />
    </>
  );
};

export default Navbar;