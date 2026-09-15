import { useState, useEffect } from "react";
import { Incident } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";

export default function IncidentHistory({ user }: { user: any }) {
  const student = user;
  const [selected, setSelected] = useState<Incident | null>(null);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/incidents")
      .then(r => r.json())
      .then((data: Incident[]) => setMyIncidents(data.filter(i => i.victimId === student.id)))
      .catch(console.error);
  }, [student.id]);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Incidents", value: myIncidents.length, color: "text-slate-800" },
          { label: "Under Review", value: myIncidents.filter((i) => i.status === "Under Review").length, color: "text-amber-700" },
          { label: "Resolved", value: myIncidents.filter((i) => i.status === "Resolved").length, color: "text-green-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {myIncidents.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <span className="text-4xl block mb-3">🛡️</span>
            <p className="font-semibold text-gray-700">No incidents recorded</p>
            <p className="text-sm text-gray-400 mt-1">Stay safe and report any issues promptly.</p>
          </div>
        )}
        {myIncidents.map((inc) => (
          <div key={inc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(inc)}>
            <div className="flex items-stretch">
              <div className={`w-1 shrink-0 ${inc.status === "New" ? "bg-blue-500" : inc.status === "Under Review" ? "bg-amber-500" : inc.status === "Confirmed" ? "bg-red-500" : "bg-green-500"}`} />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="mono text-xs text-blue-700 font-bold">{inc.id}</span>
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{inc.type}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>📍 {inc.location}</span>
                      <span>📅 {inc.date}</span>
                      <span>🕐 {inc.time}</span>
                    </div>
                  </div>
                  <span className={`mono text-xs font-bold ${inc.aiConfidence >= 90 ? "text-red-600" : "text-amber-600"}`}>
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
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-semibold text-gray-800">{k === "Status" ? "" : v}</p>
                  {k === "Status" && <StatusBadge status={v as string} size="sm" />}
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
                <strong className="text-[10px] text-amber-600 uppercase tracking-wide block mb-1">Notes from Safety Team</strong>
                {selected.notes}
              </div>
            )}
            <img src={selected.evidenceImage} alt="Evidence" className="w-full h-44 object-cover rounded-xl bg-gray-100" />
          </div>
        )}
      </Modal>
    </div>
  );
}
