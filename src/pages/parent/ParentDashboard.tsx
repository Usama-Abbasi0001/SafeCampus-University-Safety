import { useState, useEffect } from "react";
import { Incident } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
export default function ParentDashboard({ onNavigate, user }: { onNavigate: (p: string) => void, user: any }) {
  const parent = user;
  const child = user?.linkedStudent || {};
  const [childIncidents, setChildIncidents] = useState<Incident[]>([]);
  const parentNotifications: any[] = []; // Empty for now

  useEffect(() => {
    if (child.id) {
      fetch("/api/incidents")
        .then(r => r.json())
        .then((data: Incident[]) => setChildIncidents(data.filter(i => i.victimId === child.id)))
        .catch(console.error);
    }
  }, [child.id]);

  const hasAlert = childIncidents.some((i) => i.status === "Confirmed" || i.status === "New");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-2xl">👨‍👩‍👧</div>
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Welcome, {parent.name}</h2>
          <p className="text-sm text-slate-400">Parent Dashboard — Monitoring your child's campus safety</p>
        </div>
      </div>

      {/* Harassment alert card (prominent) */}
      {hasAlert && (
        <div className="bg-red-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center text-3xl shrink-0">🚨</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Harassment Alert</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Incident Involving {child.name}
              </h3>
              {childIncidents.filter((i) => i.status !== "Resolved").slice(0, 1).map((inc) => (
                <div key={inc.id} className="grid grid-cols-2 gap-3 text-red-100 text-sm mb-4">
                  <div><span className="text-red-300 text-xs">Child Name:</span><br /><span className="text-white font-semibold">{child.name}</span></div>
                  <div><span className="text-red-300 text-xs">Incident Type:</span><br /><span className="text-white font-semibold">{inc.type}</span></div>
                  <div><span className="text-red-300 text-xs">Date:</span><br /><span className="text-white font-semibold">{inc.date}</span></div>
                  <div><span className="text-red-300 text-xs">Time:</span><br /><span className="text-white font-semibold">{inc.time}</span></div>
                  <div><span className="text-red-300 text-xs">Location:</span><br /><span className="text-white font-semibold">{inc.location}</span></div>
                  <div><span className="text-red-300 text-xs">Status:</span><br /><StatusBadge status={inc.status} size="sm" /></div>
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate("incidents")}
                  className="ripple-wrapper px-4 py-2 bg-white text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  View Full Details
                </button>
                <button className="ripple-wrapper px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 transition-colors">
                  Contact University
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child profile summary */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
        <div className="flex items-center gap-4 mb-4">
          <img src={child.photo} alt={child.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-900 ring-4 ring-slate-700" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>{child.name}</h3>
                <p className="mono text-xs text-blue-400 font-medium">{child.id}</p>
              </div>
              <StatusBadge status={child.safetyStatus} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            ["Department", child.department],
            ["Semester", child.semester],
            ["Status", child.status],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{k}</p>
              <p className="text-sm font-semibold text-white">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Incidents", value: childIncidents.length, color: "text-white" },
          { label: "Active Incidents", value: childIncidents.filter((i) => i.status !== "Resolved" && i.status !== "Rejected").length, color: "text-red-400" },
          { label: "Resolved", value: childIncidents.filter((i) => i.status === "Resolved").length, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent notifications */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Recent Notifications</h3>
          <RippleButton variant="outline" size="sm" onClick={() => onNavigate("notifications")}>View All</RippleButton>
        </div>
        <div className="divide-y divide-slate-700/50">
          {parentNotifications.length > 0 ? (
            parentNotifications.slice(0, 2).map((n) => (
              <div key={n.id} className={`px-5 py-3 flex gap-3 items-start ${!n.read ? "bg-red-500/10" : ""}`}>
                <span className="text-lg">{n.type === "alert" ? "🚨" : "⚠️"}</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />}
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
