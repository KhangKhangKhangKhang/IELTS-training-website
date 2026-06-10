import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
  Route,
  FilePlus2,
  Users2,
  ShieldCheck,
  ClipboardCheck,
  Shield,
  Users,
  FileCheck,
  FileStack,
  Bell,
  Search,
  Cookie,
} from "lucide-react";
import ChatBotWidget from "./chatBotWidget";
import Cookies from "js-cookie";
import StreakWidget from "./StreakWidget";
import XpWidget from "./xPWidget";
import { useAuth } from "@/context/authContext";
import { getNotificationsAPI } from "@/services/apiNotifications";

/* ------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* ------------------------------------------------------------------------- */

const formatRelative = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
};

/* ------------------------------------------------------------------------- */
/*  Accent palette per role                                                   */
/* ------------------------------------------------------------------------- */

const ACCENTS = {
  indigo: {
    chip: "bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca]",
    iconGrad: "from-indigo-500 to-violet-500",
    shadow: "shadow-[0_4px_0_#4338ca]",
  },
  emerald: {
    chip: "bg-emerald-500 text-white shadow-[0_4px_0_#047857]",
    iconGrad: "from-emerald-500 to-teal-500",
    shadow: "shadow-[0_4px_0_#047857]",
  },
  cyan: {
    chip: "bg-cyan-500 text-white shadow-[0_4px_0_#0e7490]",
    iconGrad: "from-cyan-500 to-sky-500",
    shadow: "shadow-[0_4px_0_#0e7490]",
  },
};

const STACKED_TONE = {
  indigo: "bg-[#6366f1] text-white shadow-[0_4px_0_#4338ca] hover:translate-y-[1px] hover:shadow-[0_3px_0_#4338ca] active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca]",
  emerald: "bg-emerald-500 text-white shadow-[0_4px_0_#047857] hover:translate-y-[1px] hover:shadow-[0_3px_0_#047857] active:translate-y-[2px] active:shadow-[0_2px_0_#047857]",
  danger: "bg-rose-500 text-white shadow-[0_4px_0_#9f1239] hover:translate-y-[1px] hover:shadow-[0_3px_0_#9f1239] active:translate-y-[2px] active:shadow-[0_2px_0_#9f1239]",
  ghost: "bg-white text-slate-700 border border-slate-200 shadow-[0_4px_0_#cbd5e1] hover:translate-y-[1px] hover:shadow-[0_3px_0_#cbd5e1] active:translate-y-[2px] active:shadow-[0_2px_0_#cbd5e1]",
};

const StackedButton = ({ tone = "indigo", size = "sm", onClick, children, className = "", title }) => {
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-2 rounded-xl font-bold transition-all duration-100 ${sizes} ${STACKED_TONE[tone]} ${className}`}
    >
      {children}
    </button>
  );
};

const Avatar = ({ name, src }) => {
  const initial = (name?.trim()?.[0] ?? "U").toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
      {initial}
    </div>
  );
};

/* ------------------------------------------------------------------------- */
/*  Default link sets (one per role)                                          */
/* ------------------------------------------------------------------------- */

const STUDENT_LINKS = [
  { name: "Trang Chủ", href: "/homepage", icon: Home },
  { name: "Giải Đề", href: "/test", icon: BookOpen },
  { name: "Diễn đàn", href: "/statistic", icon: BarChart3 },
  { name: "Từ Vựng", href: "/vocabulary", icon: BookMarked },
  { name: "Ngữ pháp", href: "/grammar", icon: Album },
  { name: "Lộ trình", href: "/study-planner", icon: Route },
];

const TEACHER_LINKS = [
  { name: "Trang Chủ", href: "/teacher/homepage", icon: Home },
  { name: "Diễn đàn", href: "/teacher/statistic", icon: BarChart3 },
  { name: "Quản lý đề", href: "/teacher/testManager", icon: FilePlus2 },
  { name: "Ngữ pháp", href: "/teacher/grammar", icon: Cookie },
  { name: "Duyệt bài", href: "/teacher/moderation", icon: ShieldCheck },
  //{ name: "Danh sách", href: "/teacher/userList", icon: Users2 },
  { name: "Chấm bài", href: "/teacher/teacher-review", icon: ClipboardCheck },
];

const ADMIN_LINKS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Shield },
  { name: "Users", href: "/admin/userList", icon: Users },
  { name: "Moderation", href: "/admin/moderation", icon: FileCheck },
  { name: "Content", href: "/admin/testManager", icon: FileStack },
  { name: "Vocabulary", href: "/admin/vocabulary", icon: BookMarked },
  { name: "Chấm bài", href: "/admin/teacher-review", icon: ClipboardCheck },
];

/* ------------------------------------------------------------------------- */
/*  AppTopbar (canvas-adapted, role-agnostic)                                 */
/* ------------------------------------------------------------------------- */

const AppTopbar = ({
  role = "student", // "student" | "teacher" | "admin"
  brand = "IELTS AI Practice",
  brandIcon = "📘",
  accent = "indigo",
  navLinks,
  activeHref,
  onNavigate,
  rightSlot = null,
  showSearch = true,
  onSearch,
  notificationCount,
  showXp = false,
  showStreak = false,
  logoutRedirect = "/landingPage",
  onOpenProfile,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Fetch notifications (silent fail, refresh every 60s + on window focus)
  const fetchNotifs = async () => {
    try {
      const res = await getNotificationsAPI();
      setNotifList(res.items);
      setNotifCount(res.unreadCount);
    } catch (e) {
      /* keep previous state on error */
    }
  };

  useEffect(() => {
    if (notificationCount != null) {
      // external prop wins (manual override)
      setNotifCount(notificationCount);
      return;
    }
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    const onFocus = () => fetchNotifs();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationCount]);

  const a = ACCENTS[accent] || ACCENTS.indigo;

  const links =
    navLinks ??
    (role === "admin"
      ? ADMIN_LINKS
      : role === "teacher"
      ? TEACHER_LINKS
      : STUDENT_LINKS);

  const filteredLinks = links;

  const handleNav = (href) => {
    onNavigate?.(href);
    if (!onNavigate) navigate(href);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    Cookies.remove("user");
    Cookies.remove("refreshToken");
    setIsProfileOpen(false);
    navigate(logoutRedirect);
  };

  // Close notifications + search dropdowns on outside click / Esc
  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsNotifOpen(false);
        setIsSearchOpen(false);
      }
    };
    if (isNotifOpen || isSearchOpen) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isNotifOpen, isSearchOpen]);

  // Diacritic-insensitive contains check (so "tu vung" matches "Từ Vựng")
  const normalize = (s) =>
    (s ?? "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();

  const searchResults =
    !searchValue.trim()
      ? filteredLinks
      : filteredLinks.filter((l) => normalize(l.name).includes(normalize(searchValue)));

  const isActive = (href) =>
    activeHref ? activeHref === href : location.pathname === href;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-white via-[#fafafc] to-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-4">
            {/* Brand */}
            <button
              onClick={() => handleNav(filteredLinks[0]?.href ?? "/")}
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div
                className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${a.iconGrad} flex items-center justify-center text-white text-lg ${a.shadow} group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-200`}
              >
                {brandIcon}
              </div>
              <span className="hidden sm:inline text-[15px] font-extrabold tracking-tight text-slate-800 whitespace-nowrap">
                {brand}
              </span>
            </button>

            {/* Desktop nav (xl to accommodate up to 9 links) */}
            <div className="hidden xl:flex items-center gap-0.5 bg-slate-100/80 rounded-2xl p-1 shadow-inner border border-slate-200/60">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-all duration-150 ${
                      active
                        ? `${a.chip} scale-[1.02]`
                        : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-transform ${
                        active ? "" : "group-hover:scale-110"
                      }`}
                    />
                    {link.name}
                  </button>
                );
              })}
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Search (md+) */}
              {showSearch && (
                <div className="relative hidden md:block" ref={searchRef}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white border shadow-sm w-56 transition ${
                      isSearchOpen && searchValue
                        ? "border-[#6366f1]/40 ring-2 ring-[#6366f1]/30"
                        : "border-slate-200 focus-within:ring-2 focus-within:ring-[#6366f1]/40 focus-within:border-[#6366f1]/40"
                    }`}
                  >
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        setIsSearchOpen(true);
                        onSearch?.(e.target.value);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      placeholder="Tìm trang..."
                      className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                    />
                    {searchValue && (
                      <button
                        onClick={() => {
                          setSearchValue("");
                          onSearch?.("");
                        }}
                        className="text-slate-400 hover:text-slate-600 transition"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {isSearchOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-transparent">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          {searchValue
                            ? `${searchResults.length} kết quả`
                            : "Tất cả trang"}
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <div className="text-2xl mb-1">🔍</div>
                            <div className="text-sm text-slate-500">
                              Không tìm thấy
                            </div>
                          </div>
                        ) : (
                          searchResults.map((link) => {
                            const Icon = link.icon;
                            const active = isActive(link.href);
                            return (
                              <button
                                key={link.href}
                                onClick={() => {
                                  setSearchValue("");
                                  setIsSearchOpen(false);
                                  handleNav(link.href);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex items-center gap-2.5 border-b border-slate-50 last:border-b-0"
                              >
                                <div
                                  className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
                                    active
                                      ? "bg-indigo-100 text-indigo-600"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span
                                  className={`text-sm font-medium ${
                                    active
                                      ? "text-indigo-700"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {link.name}
                                </span>
                                {active && (
                                  <span className="ml-auto text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    Hiện tại
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role-specific widgets (Xp / Streak) */}
              {(showXp || showStreak || rightSlot) && (
                <div className="hidden lg:flex items-center gap-1.5">
                  {showXp && <XpWidget />}
                  {showStreak && (
                    <StreakWidget onClick={() => setIsProfileOpen(true)} />
                  )}
                  {rightSlot}
                </div>
              )}

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen((v) => !v)}
                  title="Thông báo"
                  className="relative h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow flex items-center justify-center transition-all duration-150"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-white">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-transparent">
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          Thông báo
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {notifCount > 0
                            ? `${notifCount} mục mới`
                            : "Không có mục mới"}
                        </div>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${notifCount > 0 ? "bg-rose-500" : "bg-slate-300"}`} />
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifList.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <div className="text-3xl mb-2">🔕</div>
                          <div className="text-sm text-slate-500">
                            Chưa có thông báo nào
                          </div>
                        </div>
                      ) : (
                        notifList.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              setIsNotifOpen(false);
                              navigate(n.href);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex gap-3 border-b border-slate-50 last:border-b-0"
                          >
                            <div className="shrink-0 h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base">
                              {n.type === "TEST_RESULT" ? "📊" : "📋"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold text-slate-800 truncate">
                                {n.title}
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {n.message}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {formatRelative(n.createdAt)}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile trigger (opens modal directly) */}
              <button
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  else
                    navigate(
                      role === "admin"
                        ? "/admin/profile"
                        : role === "teacher"
                        ? "/teacher/profile"
                        : "/profile"
                    );
                }}
                title="Hồ sơ cá nhân"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all duration-150"
              >
                <Avatar name={user?.nameUser} src={user?.avatar} />
                <span className="hidden lg:inline text-sm font-bold text-slate-700 max-w-[8rem] truncate">
                  {user?.nameUser ?? "User"}
                </span>
              </button>

              {/* Quick logout (xl+) */}
              <div className="hidden xl:block">
                <StackedButton tone="danger" size="sm" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" /> Đăng xuất
                </StackedButton>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                className="xl:hidden h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center transition"
                title="Menu"
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4 text-slate-700" />
                ) : (
                  <Menu className="h-4 w-4 text-slate-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white">
            {showSearch && (
              <div className="px-4 pt-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      onSearch?.(e.target.value);
                    }}
                    placeholder="Tìm trang..."
                    className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                  />
                  {searchValue && (
                    <button
                      onClick={() => {
                        setSearchValue("");
                        onSearch?.("");
                      }}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchValue && (
                  <div className="mt-1.5 px-1 text-[11px] text-slate-500">
                    {searchResults.length > 0
                      ? `${searchResults.length} kết quả`
                      : "Không tìm thấy"}
                  </div>
                )}
              </div>
            )}
            <div className="px-3 pt-3 pb-2 grid grid-cols-2 gap-1.5">
              {searchResults.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? `${a.chip} scale-[1.02]`
                        : "text-slate-700 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onOpenProfile) onOpenProfile();
                  else
                    navigate(
                      role === "admin"
                        ? "/admin/profile"
                        : role === "teacher"
                        ? "/teacher/profile"
                        : "/profile"
                    );
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition"
              >
                <User className="h-4 w-4" /> Hồ sơ
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold shadow-[0_4px_0_#9f1239] hover:translate-y-[1px] hover:shadow-[0_3px_0_#9f1239] active:translate-y-[2px] active:shadow-[0_2px_0_#9f1239] transition"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          </div>
        )}
      </nav>

      <Outlet />
      <ChatBotWidget />
    </>
  );
};

export default AppTopbar;
