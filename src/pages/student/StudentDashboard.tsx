import { useState, useEffect } from "react";
import { Incident, Student } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";

const safetyConfig = {
  Safe: {
    bg: "bg-emerald-900/20",
    border: "border-emerald-700/50",
    text: "text-emerald-400",
    icon: "🛡️",
    msg: "You are currently marked safe. No safety incidents or threats reported."
  },
  Alert: {
    bg: "bg-red-900/20",
    border: "border-red-700/50",
    text: "text-red-400",
    icon: "🚨",
    msg: "An incident alert has been registered. Please report to the campus safety desk or security post."
  },
  "Incident Under Review": {
    bg: "bg-amber-900/20",
    border: "border-amber-700/50",
    text: "text-amber-400",
    icon: "⚠️",
    msg: "An incident involving your student ID is currently under security review."
  },
};

export default function StudentDashboard({ onNavigate, user }: { onNavigate: (p: string) => void, user: any }) {
  const [student, setStudent] = useState<Student>(user || {});
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  // Retrieve live student profile from database
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetch(`/api/students/${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: Student) => {
          if (data && data.id) {
            setStudent(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  // Retrieve student incidents
  useEffect(() => {
    if (student?.id) {
      fetch("/api/incidents")
        .then(r => r.json())
        .then((data: Incident[]) => {
          const sId = student.id.toLowerCase();
          setMyIncidents(data.filter(i => {
            const vId = (i.victimId || (typeof i.victim === 'object' ? i.victim?.studentId : "") || "").toLowerCase();
            return vId === sId;
          }));
        })
        .catch(console.error);
    }
  }, [student?.id]);

  const sc = safetyConfig[(student.safetyStatus || "Safe") as keyof typeof safetyConfig] || safetyConfig["Safe"];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Student Profile Overview Card */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <img
              src={student.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover bg-slate-900 ring-4 ring-slate-700 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {student.name}
                </h2>
                <StatusBadge status={student.status || "Active"} size="sm" />
              </div>
              <p className="font-mono text-sm text-blue-400 font-semibold mt-0.5">{student.id}</p>
              <p className="text-xs text-slate-400 mt-1">
                {student.department || "Computer Science"} • Semester {student.semester || "8th"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RippleButton
              variant="outline"
              size="sm"
              onClick={() => onNavigate("profile")}
              className="text-xs"
            >
              👤 View Full Profile
            </RippleButton>
            <RippleButton
              variant="primary"
              size="sm"
              onClick={() => onNavigate("safety")}
              className="text-xs bg-blue-600 hover:bg-blue-500"
            >
              🛡️ Safety Center
            </RippleButton>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/50 text-xs">
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Student Phone</p>
            <p className="text-slate-200 font-medium">{student.phone || student.parentPhone || "Not Provided"}</p>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Email Address</p>
            <p className="text-slate-200 font-medium truncate" title={student.email}>{student.email || "Not Provided"}</p>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Parent / Guardian</p>
            <p className="text-slate-200 font-medium">{student.parentName || "Registered Guardian"}</p>
          </div>

          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Guardian Contact</p>
            <p className="text-slate-200 font-medium">{student.parentPhone || "Registered on file"}</p>
          </div>
        </div>
      </div>

      {/* Real-time Safety Status Card */}
      <div className={`rounded-2xl border backdrop-blur-sm ${sc.border} ${sc.bg} p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl shrink-0">{sc.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${sc.text}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Safety Status: {student.safetyStatus || "Safe"}
              </h3>
              <StatusBadge status={student.safetyStatus || "Safe"} size="sm" />
            </div>
            <p className={`text-xs mt-1 ${sc.text} opacity-90`}>{sc.msg}</p>
          </div>
        </div>

        {student.safetyStatus !== "Safe" && (
          <RippleButton
            variant="primary"
            size="sm"
            className="bg-red-600 hover:bg-red-500 text-xs shrink-0"
            onClick={() => onNavigate("incidents")}
          >
            Review Security Incident
          </RippleButton>
        )}
      </div>

      {/* Incident Statistics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "My Recorded Incidents", value: myIncidents.length, color: "text-white" },
          { label: "Under Review", value: myIncidents.filter((i) => i.status === "Under Review" || i.status === "New").length, color: "text-amber-400" },
          { label: "Resolved", value: myIncidents.filter((i) => i.status === "Resolved").length, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-700/50 text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
