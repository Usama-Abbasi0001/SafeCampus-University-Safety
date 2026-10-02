import { useState, useEffect } from "react";
import { Incident } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

export default function IncidentHistory({ user }: { user: any }) {
  const student = user;
  const [selected, setSelected] = useState<Incident | null>(null);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetch("/api/incidents")
      .then(r => r.json())
      .then((data: Incident[]) => setMyIncidents(data.filter(i => i.victimId === student.id)))
      .catch(console.error);
  }, [student.id]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Incidents", value: myIncidents.length, color: "text-white" },
          { label: "Under Review", value: myIncidents.filter((i) => i.status === "Under Review").length, color: "text-amber-400" },
          { label: "Resolved", value: myIncidents.filter((i) => i.status === "Resolved").length, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-slate-700/50 text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {myIncidents.length === 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-12 text-center shadow-sm border border-slate-700/50">
            <span className="text-4xl block mb-3">🛡️</span>
            <p className="font-semibold text-white">No incidents recorded</p>
            <p className="text-sm text-slate-400 mt-1">Stay safe and report any issues promptly.</p>
          </div>
        )}
        {myIncidents.map((inc) => (
          <div key={inc.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => setSelected(inc)}>
            <div className="flex items-stretch">
              <div className={`w-1 shrink-0 ${inc.status === "New" ? "bg-blue-500" : inc.status === "Under Review" ? "bg-amber-500" : inc.status === "Confirmed" ? "bg-red-500" : "bg-green-500"}`} />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold">{inc.id}</span>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                    <p className="text-sm font-semibold text-white">{inc.type}</p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-400">
                      <span>📍 {inc.location}</span>
                      <span>📅 {inc.date}</span>
                      <span>🕐 {inc.time}</span>
                    </div>
                  </div>
                  <span className={`mono text-xs font-bold ${inc.aiConfidence >= 90 ? "text-red-400" : "text-amber-400"}`}>
                    AI {inc.aiConfidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident — ${selected?.id}`} maxWidth="max-w-2xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Type", selected.type],
                ["Date & Time", `${selected.date} at ${selected.time}`],
                ["Location", selected.location],
                ["Camera", selected.cameraId],
                ["AI Confidence", `${selected.aiConfidence}%`],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-semibold text-white">{k === "Status" ? "" : v}</p>
                  {k === "Status" && <StatusBadge status={v as string} size="sm" />}
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 text-sm text-amber-300">
                <strong className="text-[10px] text-amber-500 uppercase tracking-wide block mb-1">Notes from Safety Team</strong>
                {selected.notes}
              </div>
            )}
            <img src={selected.evidenceImage} alt="Evidence" className="w-full h-44 object-cover rounded-xl bg-slate-800" />
          </div>
        )}
      </Modal>
    </div>
  );
}
