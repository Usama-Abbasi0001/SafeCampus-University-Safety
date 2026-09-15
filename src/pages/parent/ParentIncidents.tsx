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
      fetch("http://localhost:5000/api/incidents")
        .then(r => r.json())
        .then((data: Incident[]) => setChildIncidents(data.filter(i => i.victimId === child.id)))
        .catch(console.error);
    }
  }, [child.id]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {childIncidents.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <span className="text-4xl block mb-3">🛡️</span>
          <p className="font-semibold text-gray-700">No incidents reported</p>
          <p className="text-sm text-gray-400 mt-1">Your child has no recorded incidents.</p>
        </div>
      )}

      {childIncidents.map((inc) => (
        <div key={inc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex">
            <div className={`w-2 ${inc.status === "Confirmed" ? "bg-red-500" : inc.status === "Under Review" ? "bg-amber-500" : inc.status === "New" ? "bg-blue-500" : "bg-green-500"}`} />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="mono text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">{inc.id}</span>
                    <StatusBadge status={inc.status} size="sm" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{inc.type}</h3>
                </div>
                <button
                  onClick={() => setSelected(inc)}
                  className="ripple-wrapper text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-600">
                <div><span className="text-gray-400">Date:</span> <span className="font-medium">{inc.date}</span></div>
                <div><span className="text-gray-400">Time:</span> <span className="font-medium">{inc.time}</span></div>
                <div><span className="text-gray-400">Location:</span> <span className="font-medium">{inc.location}</span></div>
              </div>

              {(inc.status === "Confirmed" || inc.status === "New") && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-700">⚠️ Action Required</p>
                  <p className="text-xs text-red-600 mt-0.5">Please contact the university safety office for updates on this incident.</p>
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
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">AI Evidence</p>
                <p className="text-sm font-semibold text-gray-800">{selected.aiConfidence}% confidence</p>
              </div>
            </div>

            <img src={selected.evidenceImage} alt="Evidence" className="w-full h-44 object-cover rounded-xl bg-gray-100" />

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">Contact University Safety Office</p>
              <p className="text-sm font-bold text-blue-800">+92-51-9085000</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
