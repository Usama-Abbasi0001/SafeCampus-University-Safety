import { useState, useEffect } from "react";
import { Incident } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

export default function ParentIncidents({ user }: { user: any }) {
  const child = user?.linkedStudent || {};
  const [selected, setSelected] = useState<Incident | null>(null);
  const [childIncidents, setChildIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    if (child.id) {
      fetch("/api/incidents")
        .then(r => r.json())
        .then((data: Incident[]) => setChildIncidents(data.filter(i => i.victimId === child.id)))
        .catch(console.error);
    }
  }, [child.id]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {childIncidents.length === 0 && (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 text-center shadow-sm border border-slate-700/50">
          <span className="text-4xl block mb-3">🛡️</span>
          <p className="font-semibold text-white">No incidents reported</p>
          <p className="text-sm text-slate-400 mt-1">Your child has no recorded incidents.</p>
        </div>
      )}

      {childIncidents.map((inc) => (
        <div key={inc.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden hover:bg-slate-800/80 transition-colors">
          <div className="flex">
            <div className={`w-2 ${inc.status === "Confirmed" ? "bg-red-500" : inc.status === "Under Review" ? "bg-amber-500" : inc.status === "New" ? "bg-blue-500" : "bg-green-500"}`} />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="mono text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">{inc.id}</span>
                    <StatusBadge status={inc.status} size="sm" />
                  </div>
                  <h3 className="text-base font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>{inc.type}</h3>
                </div>
                <button
                  onClick={() => setSelected(inc)}
                  className="ripple-wrapper text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-300">
                <div><span className="text-slate-500">Date:</span> <span className="font-medium text-white">{inc.date}</span></div>
                <div><span className="text-slate-500">Time:</span> <span className="font-medium text-white">{inc.time}</span></div>
                <div><span className="text-slate-500">Location:</span> <span className="font-medium text-white">{inc.location}</span></div>
              </div>

              {(inc.status === "Confirmed" || inc.status === "New") && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <p className="text-xs font-semibold text-red-400">⚠️ Action Required</p>
                  <p className="text-xs text-red-300 mt-0.5">Please contact the university safety office for updates on this incident.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident — ${selected?.id}`} maxWidth="max-w-2xl">
        {selected && (
          <div className="space-y-4">
            {/* Harassment alert card inside modal */}
            <div className="bg-red-600 text-white rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-200 mb-1">🚨 Harassment Alert</p>
              <h3 className="text-lg font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>{selected.type}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Child Name", selected.victim],
                ["Student ID", selected.victimId],
                ["Incident Type", selected.type],
                ["Date", selected.date],
                ["Time", selected.time],
                ["Location", selected.location],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-semibold text-white">{v}</p>
                </div>
              ))}
              {selected.status === "Confirmed" && selected.suspectedPerson && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 col-span-2">
                  <p className="text-[10px] text-red-400 uppercase tracking-wide mb-1">Suspected Harasser</p>
                  <p className="text-sm font-semibold text-red-300">{selected.suspectedPerson}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-slate-900/50 p-3 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex-1 bg-slate-900/50 p-3 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">AI Evidence</p>
                <p className="text-sm font-semibold text-white">{selected.aiConfidence}% confidence</p>
              </div>
            </div>

            <img src={selected.evidenceImage} alt="Evidence" className="w-full h-44 object-contain rounded-xl bg-slate-800 border border-slate-700/50" />

            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
              <p className="text-xs font-semibold text-blue-400 mb-1">Contact University Safety Office</p>
              <p className="text-sm font-bold text-blue-300">03173509636</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
