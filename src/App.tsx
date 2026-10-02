import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Role, AdminPage, StudentPage, ParentPage, Notification } from "./types";
type AnyPage = AdminPage | StudentPage | ParentPage;


import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { useRipple } from "./hooks/useRipple";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import LiveMonitoring from "./pages/admin/LiveMonitoring";
import HarassmentAlerts from "./pages/admin/HarassmentAlerts";
import IncidentManagement from "./pages/admin/IncidentManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import ParentManagement from "./pages/admin/ParentManagement";
import CameraManagement from "./pages/admin/CameraManagement";
import Reports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/AdminSettings";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import MySafety from "./pages/student/MySafety";
import IncidentHistory from "./pages/student/IncidentHistory";
import StudentNotifications from "./pages/student/StudentNotifications";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildProfile from "./pages/parent/ChildProfile";
import ParentSafety from "./pages/parent/ParentSafety";
import ParentIncidents from "./pages/parent/ParentIncidents";
import ParentNotifications from "./pages/parent/ParentNotifications";

// --- Login screen ---
import AuthFlow from "./components/auth/AuthFlow";



// --- Page titles ---
const adminTitles: Record<AdminPage, string> = {
  dashboard: "Dashboard",
  "live-monitoring": "Live Camera Monitoring",
  "harassment-alerts": "Harassment Alerts",
  "incident-management": "Incident Management",
  "student-management": "Student Management",
  "parent-management": "Parent Management",
  "camera-management": "Camera Management",
  reports: "Analytics & Reports",
  settings: "System Settings",
};

const studentTitles: Record<StudentPage, string> = {
  dashboard: "Student Dashboard",
  profile: "My Profile",
  safety: "My Safety",
  incidents: "Incident History",
  notifications: "Notifications",
};

const parentTitles: Record<ParentPage, string> = {
  dashboard: "Parent Dashboard",
  "child-profile": "Child Profile",
  "safety-status": "Safety Status",
  incidents: "Incidents",
  notifications: "Notifications",
};

// --- Main app ---
export default function App() {
  const [role, setRole] = useState<Role | null>(() => {
    const savedRole = localStorage.getItem("authRole");
    return savedRole ? (savedRole as Role) : null;
  });
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem("authUser");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (role === "admin") {
      fetch("/api/incidents")
        .then(r => r.json())
        .then((data: any[]) => {
          setUnreadAlerts(data.filter(i => i.status === "New").length);
        })
        .catch(console.error);

      const socket = io("http://localhost:5000");
      socket.on("new_incident", (data) => {
        setToastMessage(`🚨 ALERT: ${data.type} detected at ${data.location}!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 8000); // Hide after 8s
        setUnreadAlerts(prev => prev + 1);
      });
      return () => {
        socket.disconnect();
      };
    }
  }, [role]);

  const handleLogin = (r: Role, u: any) => {
    setRole(r);
    setUser(u);
    localStorage.setItem("authRole", r);
    localStorage.setItem("authUser", JSON.stringify(u));
  };

  const handleLogout = () => {
    setRole(null);
    setUser(null);
    localStorage.removeItem("authRole");
    localStorage.removeItem("authUser");
  };

  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [studentPage, setStudentPage] = useState<StudentPage>("dashboard");
  const [parentPage, setParentPage] = useState<ParentPage>("dashboard");

  if (!role || !user) {
    return <AuthFlow onLogin={handleLogin} />;
  }

  const renderAdminPage = () => {
    switch (adminPage) {
      case "dashboard":           return <AdminDashboard onNavigate={(p) => setAdminPage(p as AdminPage)} />;
      case "live-monitoring":     return <LiveMonitoring />;
      case "harassment-alerts":   return <HarassmentAlerts />;
      case "incident-management": return <IncidentManagement />;
      case "student-management":  return <StudentManagement />;
      case "parent-management":   return <ParentManagement />;
      case "camera-management":   return <CameraManagement />;
      case "reports":             return <Reports />;
      case "settings":            return <AdminSettings />;
    }
  };

  const renderStudentPage = () => {
    switch (studentPage) {
      case "dashboard":     return <StudentDashboard user={user} onNavigate={(p) => setStudentPage(p as StudentPage)} />;
      case "profile":       return <StudentProfile user={user} />;
      case "safety":        return <MySafety user={user} />;
      case "incidents":     return <IncidentHistory user={user} />;
      case "notifications": return <StudentNotifications user={user} />;
    }
  };

  const renderParentPage = () => {
    switch (parentPage) {
      case "dashboard":     return <ParentDashboard user={user} onNavigate={(p) => setParentPage(p as ParentPage)} />;
      case "child-profile": return <ChildProfile user={user} />;
      case "safety-status": return <ParentSafety user={user} />;
      case "incidents":     return <ParentIncidents user={user} />;
      case "notifications": return <ParentNotifications user={user} />;
    }
  };

  const currentPage = role === "admin" ? adminPage : role === "student" ? studentPage : parentPage;
  const pageTitle =
    role === "admin"
      ? adminTitles[adminPage]
      : role === "student"
      ? studentTitles[studentPage]
      : parentTitles[parentPage];

  const userName = user?.name || "User";
  const userPhoto = user?.profilePicture || user?.photo || null;

  const notifications: Notification[] = [];

  const handleNavigate = (page: string) => {
    if (role === "admin") setAdminPage(page as AdminPage);
    else if (role === "student") setStudentPage(page as StudentPage);
    else setParentPage(page as ParentPage);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-200">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 right-4 z-50 bg-red-600 text-white px-6 py-4 rounded shadow-xl flex items-center space-x-4 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-bold text-lg">CRITICAL ALERT</h3>
            <p>{toastMessage}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="ml-4 text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      
      <Sidebar role={role} currentPage={currentPage as AnyPage} onNavigate={handleNavigate} unreadAlerts={unreadAlerts} unreadNotifications={notifications.filter(n => !n.read).length} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          role={role}
          userName={userName}
          userPhoto={userPhoto}
          notifications={notifications}
          onLogout={handleLogout}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          {role === "admin" && renderAdminPage()}
          {role === "student" && renderStudentPage()}
          {role === "parent" && renderParentPage()}
        </main>
      </div>
    </div>
  );
}
