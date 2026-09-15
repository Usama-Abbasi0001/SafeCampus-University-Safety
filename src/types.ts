export type Role = "admin" | "student" | "parent";

export type IncidentStatus = "New" | "Under Review" | "Confirmed" | "Rejected" | "Resolved";

export type HarassmentType =
  | "Verbal Harassment"
  | "Physical Contact"
  | "Stalking"
  | "Threatening Behavior"
  | "Cyberbullying";

export type SafetyStatus = "Safe" | "Alert" | "Incident Under Review";

export interface Incident {
  id: string;
  type: HarassmentType;
  victim: string;
  victimId: string;
  victimDept: string;
  victimSemester: string;
  suspectedPerson: string;
  date: string;
  time: string;
  location: string;
  cameraId: string;
  aiConfidence: number;
  status: IncidentStatus;
  evidenceImage: string;
  notes?: string;
}

export interface Student {
  id: string;
  name: string;
  department: string;
  semester: string;
  parentName: string;
  parentPhone: string;
  photo: string;
  status: "Active" | "Inactive";
  safetyStatus: SafetyStatus;
  email: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: "Active" | "Inactive" | "Maintenance";
  aiDetection: boolean;
  detectedPersons: number;
  lastActive: string;
  feed: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "alert" | "info" | "success" | "warning";
}

export type AdminPage =
  | "dashboard"
  | "live-monitoring"
  | "harassment-alerts"
  | "incident-management"
  | "student-management"
  | "camera-management"
  | "reports"
  | "settings";

export type StudentPage = "dashboard" | "profile" | "safety" | "incidents" | "notifications";
export type ParentPage = "dashboard" | "child-profile" | "safety-status" | "incidents" | "notifications";
