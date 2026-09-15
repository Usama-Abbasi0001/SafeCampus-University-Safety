import { useState, useEffect } from "react";
import { Incident, IncidentStatus } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

const statuses: IncidentStatus[] = ["New", "Under Review", "Confirmed", "Rejected", "Resolved"];

const confColor = (c: number) =>
  c >= 90 ? "text-red-600" : c >= 75 ? "text-amber-600" : "text-green-600";

export default function HarassmentAlerts() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "All">("All");
  const [selected, setSelected] = useState<Incident | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/incidents")
      .then(r => r.json())
      .then(data => setIncidents(data))
      .catch(console.error);
  }, []);

  const filtered = statusFilter === "All" ? incidents : incidents.filter((i) => i.status === statusFilter);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("All")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === "All" ? "bg-slate-800 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          All ({incidents.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === s ? "bg-slate-800 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            {s} ({incidents.filter((i) => i.status === s).length})
          </button>
        ))}
      </div>

      {/* Incident cards */}
      <div className="space-y-3">
        {filtered.map((inc) => (
          <div key={inc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-stretch">
              {/* Colored left bar by status */}
              <div className={`w-1.5 shrink-0 ${inc.status === "New" ? "bg-blue-500" : inc.status === "Under Review" ? "bg-amber-500" : inc.status === "Confirmed" ? "bg-red-500" : inc.status === "Resolved" ? "bg-green-500" : "bg-gray-400"}`} />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{inc.id}</span>
                      <StatusBadge status={inc.status} size="sm" />
                      <span className={`mono text-xs font-bold ${confColor(inc.aiConfidence)}`}>AI {inc.aiConfidence}%</span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {inc.type}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-gray-600">
                      <div><span className="text-gray-400">Victim:</span> <span className="font-medium text-gray-800">{inc.victim}</span></div>
                      <div><span className="text-gray-400">Dept:</span> {inc.victimDept}</div>
                      <div><span className="text-gray-400">Date:</span> {inc.date}</div>
                      <div><span className="text-gray-400">Time:</span> {inc.time}</div>
                      <div><span className="text-gray-400">Location:</span> {inc.location}</div>
                      <div><span className="text-gray-400">Camera:</span> <span className="mono">{inc.cameraId}</span></div>
                      <div className="col-span-2"><span className="text-gray-400">Suspected:</span> {inc.suspectedPerson}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <RippleButton variant="primary" size="sm" onClick={() => setSelected(inc)}>
                      View Details
                    </RippleButton>
                    {inc.status === "New" && (
                      <RippleButton variant="outline" size="sm">Mark Review</RippleButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl block mb-3">✅</span>
          <p className="font-medium">No incidents with status "{statusFilter}"</p>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Alert Detail — ${selected?.id}`} maxWidth="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Incident ID", selected.id],
                ["Type", selected.type],
                ["Victim Name", selected.victim],
                ["Student ID", selected.victimId],
                ["Department", selected.victimDept],
                ["Semester", selected.victimSemester],
                ["Suspected", selected.suspectedPerson],
                ["Date & Time", `${selected.date} at ${selected.time}`],
                ["Location", selected.location],
                ["Camera ID", selected.cameraId],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">{k}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <span className={`mono font-bold text-base ${confColor(selected.aiConfidence)}`}>{selected.aiConfidence}%</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full ${selected.aiConfidence >= 90 ? "bg-red-500" : selected.aiConfidence >= 75 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${selected.aiConfidence}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {selected.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800">
                <strong className="text-amber-600 text-[10px] uppercase tracking-wide block mb-1">Notes</strong>
                {selected.notes}
              </div>
            )}

            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2">Evidence Image</p>
              <img src={selected.evidenceImage} alt="Evidence" className="w-full h-52 object-cover rounded-xl bg-gray-100" />
            </div>

            <div className="flex gap-2 pt-1">
              <RippleButton variant="danger" className="flex-1">Confirm Incident</RippleButton>
              <RippleButton variant="outline" className="flex-1">Reject</RippleButton>
              <RippleButton variant="primary" className="flex-1">Set Under Review</RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
