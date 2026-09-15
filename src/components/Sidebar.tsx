import React from "react";
import { useRipple } from "../hooks/useRipple";
import { AdminPage, ParentPage, Role, StudentPage } from "../types";

type AnyPage = AdminPage | StudentPage | ParentPage;

interface NavItem {
  id: AnyPage;
  label: string;
  icon: React.ReactElement;
}

interface Props {
  role: Role;
  currentPage: AnyPage;
  onNavigate: (page: AnyPage) => void;
}

const Icon = ({ path, path2 }: { path: string; path2?: string }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
    {path2 && <path d={path2} />}
  </svg>
);

const adminNav: NavItem[] = [
  { id: "dashboard",          label: "Dashboard",          icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" path2="M9 22V12h6v10" /> },
  { id: "live-monitoring",    label: "Live Monitoring",    icon: <Icon path="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.362a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { id: "harassment-alerts",  label: "Harassment Alerts",  icon: <Icon path="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /> },
  { id: "incident-management",label: "Incident Management",icon: <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" path2="M14 2v6h6M16 13H8M16 17H8M10 9H8" /> },
  { id: "student-management", label: "Student Management", icon: <Icon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> },
  { id: "camera-management",  label: "Camera Management",  icon: <Icon path="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" path2="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /> },
  { id: "reports",            label: "Reports",            icon: <Icon path="M18 20V10M12 20V4M6 20v-6" /> },
  { id: "settings",           label: "Settings",           icon: <Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /> },
];

const studentNav: NavItem[] = [
  { id: "dashboard",     label: "Dashboard",       icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" path2="M9 22V12h6v10" /> },
  { id: "profile",       label: "My Profile",      icon: <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /> },
  { id: "safety",        label: "My Safety",       icon: <Icon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /> },
  { id: "incidents",     label: "Incident History", icon: <Icon path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" path2="M14 2v6h6M16 13H8M16 17H8M10 9H8" /> },
  { id: "notifications", label: "Notifications",   icon: <Icon path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /> },
];

const parentNav: NavItem[] = [
  { id: "dashboard",     label: "Dashboard",      icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" path2="M9 22V12h6v10" /> },
  { id: "child-profile", label: "Child Profile",  icon: <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /> },
  { id: "safety-status", label: "Safety Status",  icon: <Icon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /> },
  { id: "incidents",     label: "Incidents",      icon: <Icon path="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /> },
  { id: "notifications", label: "Notifications",  icon: <Icon path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /> },
];

const navByRole: Record<Role, NavItem[]> = {
  admin: adminNav,
  student: studentNav,
  parent: parentNav,
};

const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  student: "Student Portal",
  parent: "Parent Portal",
};

const roleColors: Record<Role, string> = {
  admin: "from-indigo-900 via-slate-900 to-slate-900",
  student: "from-blue-900 via-slate-900 to-slate-900",
  parent: "from-teal-900 via-slate-900 to-slate-900",
};

const roleDot: Record<Role, string> = {
  admin: "bg-purple-400",
  student: "bg-blue-400",
  parent: "bg-teal-400",
};

export default function Sidebar({ role, currentPage, onNavigate }: Props) {
  const addRipple = useRipple(true);
  const nav = navByRole[role];

  return (
    <aside className={`w-64 shrink-0 flex flex-col bg-gradient-to-b ${roleColors[role]} text-white h-screen sticky top-0`}>
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>SafeCampus</p>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">University Safety</p>
          </div>
        </div>
      </div>

      {/* Role label */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${roleDot[role]}`} />
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{roleLabels[role]}</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                addRipple(e);
                onNavigate(item.id);
              }}
              className={`ripple-wrapper w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "sidebar-active text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
              style={isActive ? { borderLeft: "3px solid #60A5FA", paddingLeft: "calc(0.75rem - 3px)" } : {}}
            >
              <span className={isActive ? "text-blue-400" : "text-white/40"}>{item.icon}</span>
              {item.label}
              {item.id === "harassment-alerts" && <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>}
              {item.id === "notifications" && <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">2</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-tight">SafeCampus HDS v2.1</p>
        <p className="text-[10px] text-white/20">© 2024 University Safety System</p>
      </div>
    </aside>
  );
}
