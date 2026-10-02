import { useState } from "react";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";
import { useEffect } from "react";
import { Camera, Incident } from "../../types";

const confColor = (c: number) =>
  c >= 90 ? "text-red-400" : c >= 75 ? "text-amber-400" : "text-green-400";

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
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  const handleStatusUpdate = async (status: string) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/incidents/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updated = await res.json();
        setIncidents(incidents.map(i => i.id === updated.id ? updated : i));
        setSelected(null);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/incidents").then(r => r.ok ? r.json() : []),
      fetch("/api/cameras").then(r => r.ok ? r.json() : [])
    ]).then(([incData, camData]) => {
      setIncidents(incData);
      setCameras(camData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const newAlerts = incidents.filter(i => i.status === "New").length;
  const underReview = incidents.filter(i => i.status === "Under Review").length;
  const confirmed = incidents.filter(i => i.status === "Confirmed").length;
  const resolved = incidents.filter(i => i.status === "Resolved").length;
  
  const today = new Date().toISOString().split('T')[0];
  const todaysIncidents = incidents.filter(i => i.date === today).length;
  const activeCameras = cameras.filter(c => c.status === "Active").length;

  const stats = [
    { label: "Total Incidents", value: incidents.length, icon: "📋", iconBg: "bg-slate-500/20", accent: "text-slate-300" },
    { label: "Today's Incidents", value: todaysIncidents, icon: "📅", iconBg: "bg-blue-500/20", accent: "text-blue-400" },
    { label: "New Alerts", value: newAlerts, icon: "🚨", iconBg: "bg-red-500/20", accent: "text-red-400" },
    { label: "Under Review", value: underReview, icon: "🔍", iconBg: "bg-amber-500/20", accent: "text-amber-400" },
    { label: "Confirmed", value: confirmed, icon: "⚠️", iconBg: "bg-orange-500/20", accent: "text-orange-400" },
    { label: "Resolved", value: resolved, icon: "✅", iconBg: "bg-green-500/20", accent: "text-green-400" },
    { label: "Active Cameras", value: activeCameras, icon: "📷", iconBg: "bg-indigo-500/20", accent: "text-indigo-400" },
  ];

  if (loading) {
    return <div className="p-6 text-slate-400">Loading data...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={<span className="text-lg">{s.icon}</span>} iconBg={s.iconBg} accent={s.accent} />
        ))}
      </div>

      {/* Alert banner */}
      {newAlerts > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="text-red-400 text-xl shrink-0">🚨</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-400 text-sm">{newAlerts} Unreviewed Alerts Require Immediate Attention</p>
            <p className="text-red-400/80 text-xs mt-0.5">AI-detected incidents are awaiting admin review. Please action them promptly.</p>
          </div>
          <RippleButton variant="danger" size="sm" onClick={() => onNavigate("harassment-alerts")}>
            Review Alerts
          </RippleButton>
        </div>
      )}

      {/* Recent alerts table */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/90">
          <div>
            <h2 className="text-base font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Recent Harassment Alerts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">AI-detected incidents requiring review</p>
          </div>
          <RippleButton variant="outline" size="sm" onClick={() => onNavigate("harassment-alerts")}>
            View All
          </RippleButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700/50">
                {["Incident ID", "Type", "Student / Victim", "Suspected Person", "AI Confidence", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No data available
                  </td>
                </tr>
              ) : (
                incidents.slice(0, 5).map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 mono text-xs text-blue-400 font-medium whitespace-nowrap">{inc.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{inc.type}</td>
                    <td className="px-4 py-3 text-xs font-medium text-white whitespace-nowrap">{typeof inc.victim === 'object' ? inc.victim.name : inc.victim}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{typeof inc.harasser === 'object' ? inc.harasser.name : (inc.suspectedPerson || '-')}</td>
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
                        className="ripple-wrapper inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <EyeIcon /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident Detail — ${selected?.id}`} maxWidth="max-w-3xl">
        {selected && <IncidentDetail inc={selected} onStatusUpdate={handleStatusUpdate} />}
      </Modal>
    </div>
  );
}

function IncidentDetail({ inc, onStatusUpdate }: { inc: Incident, onStatusUpdate: (status: string) => void }) {
  const confColor = (c: number) => c >= 90 ? "text-red-400 bg-red-500/10 border-red-500/20" : c >= 75 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-green-400 bg-green-500/10 border-green-500/20";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">Incident Details</p>
          <p className="text-sm text-white"><strong>ID:</strong> {inc.id}</p>
          <p className="text-sm text-white"><strong>Type:</strong> {inc.type}</p>
          <p className="text-sm text-white"><strong>Date & Time:</strong> {inc.date} at {inc.time}</p>
          <p className="text-sm text-white"><strong>Location:</strong> {inc.location}</p>
          <p className="text-sm text-white"><strong>Camera ID:</strong> {inc.cameraId}</p>
          {inc.duration && <p className="text-sm text-amber-400 font-bold">Duration: {inc.duration}+ seconds</p>}
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">Victim</p>
          <div className="flex flex-col gap-1">
             {typeof inc.victim === 'object' && inc.victim.profilePicture && (
               <img src={inc.victim.profilePicture} alt="Victim" className="w-12 h-12 rounded-full object-cover" />
             )}
             <div>
                <p className="text-sm text-white font-bold">{typeof inc.victim === 'object' ? inc.victim.name : inc.victim}</p>
                <p className="text-xs text-slate-400">{typeof inc.victim === 'object' ? inc.victim.department : inc.victimDept}</p>
                <p className="text-xs text-slate-400">{typeof inc.victim === 'object' ? inc.victim.rollNumber : ''}</p>
             </div>
          </div>
        </div>

        <div className="col-span-2 bg-slate-900/50 rounded-lg p-3 border border-red-500/30">
          <p className="text-[11px] text-red-400 font-medium uppercase tracking-wide mb-1">Harasser / Suspect</p>
          <div className="flex items-center gap-3">
             {typeof inc.harasser === 'object' && inc.harasser.profilePicture && (
               <img src={inc.harasser.profilePicture} alt="Harasser" className="w-12 h-12 rounded-full object-cover" />
             )}
             <div>
                <p className="text-sm text-white font-bold">{typeof inc.harasser === 'object' ? inc.harasser.name : (inc.suspectedPerson || 'Unknown')}</p>
                <p className="text-xs text-slate-400">{typeof inc.harasser === 'object' ? inc.harasser.department : ''}</p>
                <p className="text-xs text-slate-400">{typeof inc.harasser === 'object' ? inc.harasser.rollNumber : ''}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">AI Confidence</p>
          <div className="flex items-center gap-2">
            <span className={`mono font-bold text-lg px-2 py-0.5 rounded border ${confColor(inc.aiConfidence)}`}>{inc.aiConfidence}%</span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${inc.aiConfidence >= 90 ? "bg-red-500" : inc.aiConfidence >= 75 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${inc.aiConfidence}%` }} />
            </div>
          </div>
        </div>
        <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-1">Incident Status</p>
          <StatusBadge status={inc.status} />
        </div>
      </div>

      {inc.notes && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wide mb-1">AI Detection Notes</p>
          <p className="text-sm text-amber-200">{inc.notes}</p>
        </div>
      )}

      <div>
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-2">Evidence Image</p>
        <img src={inc.evidenceImage} alt="Incident evidence" className="w-full rounded-xl object-cover h-52 bg-slate-800" />
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
        <RippleButton variant="danger" className="flex-1" onClick={() => onStatusUpdate("Confirmed")}>Confirm Incident</RippleButton>
        <RippleButton variant="outline" className="flex-1" onClick={() => onStatusUpdate("Rejected")}>Mark as Rejected</RippleButton>
        <RippleButton variant="primary" className="flex-1" onClick={() => onStatusUpdate("Under Review")}>Set Under Review</RippleButton>
      </div>
    </div>
  );
}
