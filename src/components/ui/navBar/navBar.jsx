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
  Album,
} from "lucide-react";
import ProfileModal from "./profileModal";
import ChatBotWidget from "./chatBotWidget";
import Cookies from "js-cookie";
import StreakWidget from "./StreakWidget";
import XpWidget from "./xPWidget";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Trang Chủ", href: "/homepage", icon: Home },
    { name: "Giải Đề", href: "/test", icon: BookOpen },
    { name: "Diễn đàn", href: "/statistic", icon: BarChart3 },
    { name: "Từ Vựng", href: "/vocabulary", icon: BookMarked },
    { name: "Ngữ pháp", href: "/grammar", icon: Album },
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
      <nav className="bg-slate-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="text-white text-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span>AIELTS</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:space-x-1 bg-slate-800/60 rounded-lg p-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Section */}
            <div className="hidden sm:flex items-center gap-2">
              {/* XP WIDGET */}
              <XpWidget />

              {/* STREAK WIDGET */}
              <StreakWidget onClick={() => setIsProfileModalOpen(true)} />

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                title="Hồ sơ cá nhân"
              >
                <User className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-slate-900/95">
            <div className="px-3 pt-2 pb-3 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
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

            <div className="px-3 pt-2 pb-4 border-t border-slate-800 space-y-2">
              {/* Mobile Streak Display */}
              <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg">
                <span className="text-slate-400 text-sm font-medium">
                  Streak:
                </span>
                <StreakWidget onClick={() => { }} />
              </div>

              <button
                onClick={() => {
                  setIsProfileModalOpen(true);
                  closeMenu();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                <User className="h-4 w-4" />
                Hồ sơ
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
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

export default Navbar;
