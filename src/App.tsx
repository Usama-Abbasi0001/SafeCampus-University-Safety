import { useState } from "react";
import { Role, AdminPage, StudentPage, ParentPage } from "./types";
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
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [studentPage, setStudentPage] = useState<StudentPage>("dashboard");
  const [parentPage, setParentPage] = useState<ParentPage>("dashboard");

  if (!role || !user) {
    return <AuthFlow onLogin={(r, u) => { setRole(r); setUser(u); }} />;
  }

  const renderAdminPage = () => {
    switch (adminPage) {
      case "dashboard":           return <AdminDashboard onNavigate={(p) => setAdminPage(p as AdminPage)} />;
      case "live-monitoring":     return <LiveMonitoring />;
      case "harassment-alerts":   return <HarassmentAlerts />;
      case "incident-management": return <IncidentManagement />;
      case "student-management":  return <StudentManagement />;
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={role} currentPage={currentPage as AnyPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          role={role}
          userName={userName}
          userPhoto={userPhoto}
          notifications={notifications}
          onLogout={() => { setRole(null); setUser(null); }}
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
