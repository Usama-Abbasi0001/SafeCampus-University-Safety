import { useState, useEffect } from "react";
import { Incident } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
const safetyConfig = {
  Safe: { bg: "bg-green-900/20", border: "border-green-700/50", text: "text-green-400", icon: "🛡️", msg: "You are currently safe. No active incidents detected." },
  Alert: { bg: "bg-red-900/20", border: "border-red-700/50", text: "text-red-400", icon: "🚨", msg: "An alert has been raised. Please contact the safety office." },
  "Incident Under Review": { bg: "bg-amber-900/20", border: "border-amber-700/50", text: "text-amber-400", icon: "⚠️", msg: "An incident involving you is currently under review by our safety team." },
};

export default function StudentDashboard({ onNavigate, user }: { onNavigate: (p: string) => void, user: any }) {
  const student = user;
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const studentNotifications: any[] = []; // Empty for now until backend is implemented
  
  useEffect(() => {
    fetch("/api/incidents")
      .then(r => r.json())
      .then((data: Incident[]) => setMyIncidents(data.filter(i => i.victimId === student.id)))
      .catch(console.error);
  }, [student.id]);

  const sc = safetyConfig[(student.safetyStatus || "Safe") as keyof typeof safetyConfig] || safetyConfig["Safe"];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Profile card */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-6">
        <div className="flex items-center gap-5">
          <img src={student.photo} alt={student.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-900 ring-4 ring-slate-700" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {student.name}
                </h2>
                <p className="mono text-sm text-blue-400 font-medium mt-0.5">{student.id}</p>
              </div>
              <StatusBadge status={student.safetyStatus} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                ["Department", student.department],
                ["Semester", student.semester],
                ["Email", student.email],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{k}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Safety status */}
      <div className={`rounded-xl border backdrop-blur-sm ${sc.border} ${sc.bg} p-5 flex items-start gap-4`}>
        <span className="text-3xl shrink-0">{sc.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-semibold ${sc.text}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Current Safety Status: {student.safetyStatus}
            </h3>
            <StatusBadge status={student.safetyStatus} />
          </div>
          <p className={`text-sm mt-1 ${sc.text} opacity-80`}>{sc.msg}</p>
          {student.safetyStatus !== "Safe" && (
            <RippleButton variant="primary" size="sm" className="mt-3" onClick={() => onNavigate("incidents")}>
              View Incident Details
            </RippleButton>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Incidents", value: myIncidents.length, icon: "📋", color: "text-white" },
          { label: "Under Review", value: myIncidents.filter((i) => i.status === "Under Review").length, icon: "🔍", color: "text-amber-400" },
          { label: "Resolved", value: myIncidents.filter((i) => i.status === "Resolved").length, icon: "✅", color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 text-center">
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent incidents */}
      {myIncidents.length > 0 && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>My Recent Incidents</h3>
            <RippleButton variant="outline" size="sm" onClick={() => onNavigate("incidents")}>View All</RippleButton>
          </div>
          <div className="divide-y divide-slate-700/50">
            {myIncidents.map((inc) => (
              <div key={inc.id} className="px-5 py-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="mono text-xs text-blue-400 font-semibold">{inc.id}</span>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                    <p className="text-sm font-medium text-white">{inc.type}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{inc.location} · {inc.date} at {inc.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications preview */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Recent Notifications</h3>
          <RippleButton variant="outline" size="sm" onClick={() => onNavigate("notifications")}>View All</RippleButton>
        </div>
        <div className="divide-y divide-slate-700/50">
          {studentNotifications.length > 0 ? (
            studentNotifications.slice(0, 2).map((n) => (
              <div key={n.id} className={`px-5 py-3 flex gap-3 items-start ${!n.read ? "bg-blue-900/20" : ""}`}>
                <span className="text-lg">{n.type === "alert" ? "🚨" : "ℹ️"}</span>
                <div>
                  <p className="text-xs font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                </div>
                {!n.read && <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No new notifications</div>
          )}
        </div>
      </div>
    </div>
  );
}
