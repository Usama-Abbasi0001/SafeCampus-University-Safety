import { useState } from "react";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";
import { useEffect } from "react";
import { Incident } from "../../types";

const stats = [
  { label: "Total Incidents", value: 78, icon: "📋", iconBg: "bg-slate-100", accent: "text-slate-800", trend: { value: "+12 this month", up: true } },
  { label: "Today's Incidents", value: 3,  icon: "📅", iconBg: "bg-blue-100",  accent: "text-blue-700",  trend: { value: "+1 from yesterday", up: false } },
  { label: "New Alerts",        value: 3,  icon: "🚨", iconBg: "bg-red-100",   accent: "text-red-700"   },
  { label: "Under Review",      value: 1,  icon: "🔍", iconBg: "bg-amber-100", accent: "text-amber-700" },
  { label: "Confirmed",         value: 22, icon: "⚠️", iconBg: "bg-orange-100",accent: "text-orange-700"},
  { label: "Resolved",          value: 35, icon: "✅", iconBg: "bg-green-100", accent: "text-green-700" },
  { label: "Active Cameras",    value: 5,  icon: "📷", iconBg: "bg-indigo-100",accent: "text-indigo-700"},
];

const confColor = (c: number) =>
  c >= 90 ? "text-red-600" : c >= 75 ? "text-amber-600" : "text-green-600";

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AdminDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [selected, setSelected] = useState<Incident | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/incidents")
      .then(r => r.json())
      .then(data => setIncidents(data.slice(0, 5))) // Show only 5 recent
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={<span className="text-lg">{s.icon}</span>} iconBg={s.iconBg} accent={s.accent} trend={s.trend} />
        ))}
      </div>

      {/* Alert banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <span className="text-red-500 text-xl shrink-0">🚨</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-red-800 text-sm">3 Unreviewed Alerts Require Immediate Attention</p>
          <p className="text-red-600 text-xs mt-0.5">AI-detected incidents are awaiting admin review. Please action them promptly.</p>
        </div>
        <RippleButton variant="danger" size="sm" onClick={() => onNavigate("harassment-alerts")}>
          Review Alerts
        </RippleButton>
      </div>

      {/* Recent alerts table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Recent Harassment Alerts
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">AI-detected incidents requiring review</p>
          </div>
          <RippleButton variant="outline" size="sm" onClick={() => onNavigate("harassment-alerts")}>
            View All
          </RippleButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Incident ID", "Type", "Student / Victim", "Suspected Person", "Date", "Time", "Location", "AI Confidence", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 mono text-xs text-blue-700 font-medium whitespace-nowrap">{inc.id}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{inc.type}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-900 whitespace-nowrap">{inc.victim}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.suspectedPerson}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.date}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.time}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`mono text-xs font-semibold ${confColor(inc.aiConfidence)}`}>
                      {inc.aiConfidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={inc.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => setSelected(inc)}
                      className="ripple-wrapper inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <EyeIcon /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident Detail — ${selected?.id}`} maxWidth="max-w-3xl">
        {selected && <IncidentDetail inc={selected} />}
      </Modal>
    </div>
  );
}

function IncidentDetail({ inc }: { inc: Incident }) {
  const confColor = (c: number) => c >= 90 ? "text-red-600 bg-red-50" : c >= 75 ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          ["Incident ID", inc.id],
          ["Harassment Type", inc.type],
          ["Victim Name", inc.victim],
          ["Student ID", inc.victimId],
          ["Department", inc.victimDept],
          ["Semester", inc.victimSemester],
          ["Suspected Person", inc.suspectedPerson],
          ["Date", inc.date],
          ["Time", inc.time],
          ["Location", inc.location],
          ["Camera ID", inc.cameraId],
          ["AI Detection", "Active"],
        ].map(([k, v]) => (
          <div key={k} className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">{k}</p>
            <p className="text-sm font-semibold text-gray-800">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">AI Confidence</p>
          <div className="flex items-center gap-2">
            <span className={`mono font-bold text-lg px-2 py-0.5 rounded ${confColor(inc.aiConfidence)}`}>{inc.aiConfidence}%</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${inc.aiConfidence >= 90 ? "bg-red-500" : inc.aiConfidence >= 75 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${inc.aiConfidence}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">Incident Status</p>
          <StatusBadge status={inc.status} />
        </div>
      </div>

      {inc.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wide mb-1">AI Detection Notes</p>
          <p className="text-sm text-amber-800">{inc.notes}</p>
        </div>
      )}

      <div>
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-2">Evidence Image</p>
        <img src={inc.evidenceImage} alt="Incident evidence" className="w-full rounded-xl object-cover h-52 bg-gray-100" />
      </div>

      <div className="bg-slate-800 rounded-xl p-4 text-white">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-2">Campus Location Map</p>
        <div className="relative h-32 bg-slate-700 rounded-lg overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-px opacity-20">
            {Array.from({ length: 24 }).map((_, i) => <div key={i} className="border border-slate-500" />)}
          </div>
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <span className="text-red-400 text-xl">📍</span>
            <span className="text-[10px] text-white/80 bg-slate-900/60 px-2 py-0.5 rounded-full whitespace-nowrap">{inc.location}</span>
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] text-slate-400">University Campus Map</div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <RippleButton variant="danger" className="flex-1">Confirm Incident</RippleButton>
        <RippleButton variant="outline" className="flex-1">Mark as Rejected</RippleButton>
        <RippleButton variant="primary" className="flex-1">Set Under Review</RippleButton>
      </div>
    </div>
  );
}
