import { Role, Notification } from "../types";
import { useRipple } from "../hooks/useRipple";
import { useState } from "react";

interface Props {
  role: Role;
  userName: string;
  notifications: Notification[];
  onLogout: () => void;
  pageTitle: string;
  userPhoto?: string | null;
}

const RoleLabels: Record<Role, string> = {
  admin: "Administrator",
  student: "Student",
  parent: "Parent",
};

const roleBadgeColors: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700",
  student: "bg-blue-100 text-blue-700",
  parent: "bg-green-100 text-green-700",
};

const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Topbar({ role, userName, notifications, onLogout, pageTitle, userPhoto }: Props) {
  const addRipple = useRipple(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const typeIcon = (type: string) => {
    if (type === "alert") return "🚨";
    if (type === "warning") return "⚠️";
    if (type === "success") return "✅";
    return "ℹ️";
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 relative z-20">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="ripple-wrapper w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors relative"
            onMouseDown={addRipple}
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                {unread > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? "bg-blue-50/40" : ""}`}>
                    <div className="flex gap-2.5 items-start">
                      <span className="text-base shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
            <p className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block ${roleBadgeColors[role]}`}>
              {RoleLabels[role]}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden shrink-0">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0)
            )}
          </div>
          <button
            onClick={onLogout}
            className="ripple-wrapper ml-1 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            onMouseDown={addRipple}
            title="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>

      {showNotifs && <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />}
    </header>
  );
}
