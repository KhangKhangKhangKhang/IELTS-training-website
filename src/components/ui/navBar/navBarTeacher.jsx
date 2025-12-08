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
  Flame,
} from "lucide-react";
import ProfileModal from "./profileModal";
import Cookies from "js-cookie";
import ChatBotWidget from "./chatBotWidget";

const NavbarTeacher = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Trang Chủ", href: "/teacher", icon: Home },
    { name: "Diễn đàn", href: "/teacher/statistic", icon: BarChart3 },
    { name: "Làm đề", href: "/teacher/test", icon: BookOpen },
    { name: "Từ Vựng", href: "/teacher/vocabulary", icon: BookMarked },
    { name: "Quản lý đề", href: "/teacher/testManager", icon: FilePlus2 },
    { name: "Ngữ pháp", href: "/teacher/grammar", icon: Cookie },
    { name: "Danh sách", href: "/teacher/userList", icon: Users2 },
  ];

  const handleLogout = () => {
    Cookies.remove("accessToken");
    Cookies.remove("user");
    Cookies.remove("refreshToken");
    navigate("/landingPage");
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <>
      <nav className="bg-slate-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/teacher"
              className="text-slate-100 text-xl font-bold flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              <BookOpen className="h-6 w-6" />
              IELTS AI Practice
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Section */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 transition text-slate-200 hover:text-white"
              >
                <Flame className="h-5 w-5 text-orange-400" />
                <User className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="sm:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden border-t border-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="px-4 pt-2 pb-4 border-t border-slate-700 space-y-2">
              <button
                onClick={() => {
                  setIsProfileModalOpen(true);
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition text-sm font-medium"
              >
                <Flame className="h-4 w-4 text-orange-400" />
                <User className="h-4 w-4" />
                Hồ sơ
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
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
