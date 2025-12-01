import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  BarChart3,
  BookMarked,
  Menu,
  X,
  User,
  LogOut,
  FilePlus2,
  Users2,
  Cookie,
} from "lucide-react";
import ProfileModal from "./profileModal"; // modal profile
import Cookies from "js-cookie";
import ChatBotWidget from "./chatBotWidget";

const NavbarTeacher = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: "Trang Chủ",
      href: "/teacher",
      current: location.pathname === "/teacher",
      icon: Home,
    },
    {
      name: "Diễn đàn",
      href: "/teacher/statistic",
      current: location.pathname === "/teacher/statistic",
      icon: BarChart3,
    },
    {
      name: "Làm đề",
      href: "/teacher/test",
      current: location.pathname === "/teacher/test",
      icon: BookOpen,
    },
    {
      name: "Từ Vựng",
      href: "/teacher/vocabulary",
      current: location.pathname === "/teacher/vocabulary",
      icon: BookMarked,
    },
    {
      name: "Quản lý đề",
      href: "/teacher/testManager",
      current: location.pathname === "/teacher/testManager",
      icon: FilePlus2,
    },
    {
      name: "Ngữ pháp",
      href: "/teacher/grammar",
      current: location.pathname === "/teacher/grammar",
      icon: Cookie,
    },
    {
      name: "Danh sách",
      href: "/teacher/userList",
      current: location.pathname === "/teacher/userList",
      icon: Users2,
    },
  ];

  const handleLogout = () => {
    Cookies.remove("accessToken");
    Cookies.remove("user");
    Cookies.remove("refreshToken");

    navigate("/landingPage");
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <>
      <nav className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo và menu chính */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-slate-100 text-xl font-bold flex items-center"
                >
                  <BookOpen className="h-6 w-6 mr-2" />
                  IELTS AI Practice
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        item.current
                          ? "border-slate-500 text-slate-100"
                          : "border-transparent text-slate-300 hover:border-slate-300 hover:text-slate-100"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                    >
                      <Icon className="h-5 w-5 mr-1" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bên phải: User + Logout */}
            <div className="hidden sm:flex sm:items-center gap-4">
              <button
                onClick={openProfileModal}
                className="flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-slate-800"
              >
                <User className="h-6 w-6 text-slate-200" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center h-10 gap-2 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 !text-white text-sm font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>

            {/* Nút menu mobile */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                {!isMenuOpen ? (
                  <Menu className="block h-6 w-6" />
                ) : (
                  <X className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? "bg-slate-900 border-slate-500 text-white"
                        : "border-transparent text-slate-300 hover:bg-slate-700 hover:border-slate-300 hover:text-white"
                    } flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 pb-3 border-t border-slate-700">
              <div className="flex items-center px-4">
                <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-200 font-medium">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">Người dùng</p>
                  <p className="text-sm font-medium text-slate-400">
                    user@example.com
                  </p>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={() => {
                    openProfileModal();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  Hồ sơ
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base text-red-400 hover:text-white hover:bg-red-700"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={closeProfileModal} />

      <Outlet />

      <ChatBotWidget />
    </>
  );
};

export default NavbarTeacher;
