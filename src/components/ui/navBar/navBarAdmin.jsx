import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  FileCheck,
  FileStack,
  BookOpen,
  BookMarked,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";
import Cookies from "js-cookie";
import ProfileModal from "./profileModal";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ChatBotWidget from "./chatBotWidget";

const adminLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Shield },
  { name: "Users", href: "/admin/userList", icon: Users },
  { name: "Moderation", href: "/admin/moderation", icon: FileCheck },
  { name: "Content", href: "/admin/testManager", icon: FileStack },
  { name: "Grammar", href: "/admin/grammar", icon: BookOpen },
  { name: "Vocabulary", href: "/admin/vocabulary", icon: BookMarked },
];

const NavbarAdmin = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove("accessToken");
    Cookies.remove("user");
    Cookies.remove("refreshToken");
    navigate("/landingPage");
  };

  return (
    <>
      <nav className="bg-slate-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/admin/dashboard"
              className="text-white text-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="p-1.5 bg-emerald-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span>Admin Console</span>
            </Link>

            <div className="hidden lg:flex lg:space-x-1 bg-slate-800/60 rounded-lg p-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95">
            <div className="px-3 pt-2 pb-3 space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white"
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
              <button
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </nav>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <Outlet />

      <ChatBotWidget />
    </>
  );
};

export default NavbarAdmin;
