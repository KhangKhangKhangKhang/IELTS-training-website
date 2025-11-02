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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileModal from "./profileModal"; // Component riêng cho modal profile
import ChatBotWidget from "./chatBotWidget";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    {
      name: "Trang Chủ",
      href: "/",
      current: location.pathname === "/",
      icon: Home,
    },
    {
      name: "Giải Đề",
      href: "/test",
      current: location.pathname === "/test",
      icon: BookOpen,
    },
    {
      name: "Diễn đàn",
      href: "/statistic",
      current: location.pathname === "/statistic",
      icon: BarChart3,
    },
    {
      name: "Từ Vựng",
      href: "/vocabulary",
      current: location.pathname === "/vocabulary",
      icon: BookMarked,
    },
    {
      name: "Ngữ pháp",
      href: "/grammar",
      current: location.pathname === "/grammar",
      icon: Album,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/landingPage");
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <nav className="bg-slate-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Bên trái: Logo + Menu */}
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="text-slate-100 text-xl font-bold flex items-center gap-2 hover:text-blue-400 transition-colors"
              >
                <BookOpen className="h-6 w-6" />
                AIELTS
              </Link>
              <div className="hidden sm:flex sm:space-x-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        item.current
                          ? "border-b-2 border-blue-500 text-white"
                          : "text-slate-300 hover:text-white hover:border-b-2 hover:border-slate-500"
                      } flex items-center gap-1 px-2 py-1 text-sm font-medium transition-all duration-200`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bên phải: Dropdown user */}
            {/* Bên phải: User + Logout */}
            <div className="hidden sm:flex sm:items-center gap-4">
              {/* Nút mở Profile */}
              <button
                onClick={openProfileModal}
                className="flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-slate-800"
              >
                <User className="h-6 w-6 text-slate-200" />
              </button>

              {/* Nút Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center h-10 gap-2 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 !text-white text-sm font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>

            {/* Nút menu mobile */}
            <div className="flex sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
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
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  } flex items-center pl-3 pr-4 py-2 text-base font-medium transition-all`}
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
                className="block w-full text-left px-3 py-2 rounded-md text-base text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                Hồ sơ
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base text-red-400 hover:text-white hover:bg-red-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={closeProfileModal} />

      <Outlet />

      <ChatBotWidget />
    </>
  );
};

export default Navbar;
