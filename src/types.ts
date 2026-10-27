export type Role = "admin" | "student" | "parent";

export type IncidentStatus = "New" | "Pending Review" | "Under Review" | "Confirmed" | "Rejected" | "Resolved";

export type HarassmentType =
  | "Verbal Harassment"
  | "Physical Contact"
  | "Stalking"
  | "Threatening Behavior"
  | "Cyberbullying";

export type SafetyStatus = "Safe" | "Alert" | "Incident Under Review";

export interface PersonDetails {
  studentId: string;
  name: string;
  fatherName?: string;
  rollNumber?: string;
  department?: string;
  semester?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  faceRecognitionStatus?: string;
  parentName?: string;
  parentPhone?: string;
  faceDistance?: number;
  faceThreshold?: number;
}

export interface Incident {
  id: string;
  type: string; // Changed to string to allow 'Watching / Continuous Watching'
  victim: PersonDetails | string;
  harasser?: PersonDetails | string;
  duration?: number;
  // Legacy fields below:
  victimId?: string;
  victimDept?: string;
  victimSemester?: string;
  suspectedPerson?: string;
  harasserId?: string;
  date: string;
  time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  cameraId: string;
  aiConfidence: number;
  status: IncidentStatus;
  evidenceImage: string;
  notes?: string;
}

export interface Student {
  _id?: string;
  id: string;
  name: string;
  department: string;
  semester: string;
  parentName: string;
  parentPhone: string;
  phone?: string;
  cnic?: string;
  photo: string;
  status: "Active" | "Inactive";
  safetyStatus: SafetyStatus;
  email: string;
  createdAt?: string;
}

export interface Parent {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  cnic?: string;
  address: string;
  profilePicture?: string;
  photo?: string;
  registrationNumber?: string;
  linkedStudentId?: string;
  linkedStudentName?: string;
  childStudentId?: string;
  password?: string;
  studentSafetyStatus?: SafetyStatus | string;
  status: "Active" | "Inactive";
  createdAt?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  installationAddress?: string;
  latitude?: number;
  longitude?: number;
  status: "Active" | "Inactive" | "Maintenance";
  aiDetection: boolean;
  detectedPersons: number;
  lastActive: string;
  feed?: string;
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
  | "parent-management"
  | "reports"
  | "settings";

export type StudentPage = "dashboard" | "profile" | "safety" | "incidents" | "notifications";
export type ParentPage = "dashboard" | "child-profile" | "safety-status" | "incidents" | "notifications";
