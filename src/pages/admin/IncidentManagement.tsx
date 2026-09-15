import { useState, useEffect } from "react";
import { Incident, IncidentStatus } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

type SortKey = "date" | "confidence" | "status";

const statusOrder: Record<IncidentStatus, number> = {
  New: 0, "Under Review": 1, Confirmed: 2, Rejected: 3, Resolved: 4,
};

export default function IncidentManagement() {
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [search, setSearch] = useState("");

  const [incidentList, setIncidentList] = useState<Incident[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/incidents")
      .then(res => res.json())
      .then(data => setIncidentList(data))
      .catch(err => console.error("Failed to fetch incidents:", err));
  }, []);

  const sorted = [...incidentList]
    .filter((i) => (i.victimId || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "date") return b.date.localeCompare(a.date);
      if (sortBy === "confidence") return b.aiConfidence - a.aiConfidence;
      return statusOrder[a.status] - statusOrder[b.status];
    });

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, victim, type, location…"
          className="flex-1 min-w-52 px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          {(["date", "confidence", "status"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${sortBy === k ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <RippleButton variant="primary" size="sm" icon={<span>+</span>}>New Incident</RippleButton>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">{sorted.length} incident{sorted.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["ID", "Type", "Victim", "Dept", "Suspected", "Date", "Location", "Camera", "AI%", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((inc) => (
                <tr key={inc.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 mono text-xs text-blue-700 font-medium">{inc.id}</td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{inc.type}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-900 whitespace-nowrap">{inc.victim}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.victimDept}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap max-w-32 truncate">{inc.suspectedPerson}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.date}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inc.location}</td>
                  <td className="px-4 py-3 mono text-xs text-gray-600 whitespace-nowrap">{inc.cameraId}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`mono text-xs font-bold ${inc.aiConfidence >= 90 ? "text-red-600" : inc.aiConfidence >= 75 ? "text-amber-600" : "text-green-600"}`}>
                      {inc.aiConfidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={inc.status} size="sm" /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(inc)} className="ripple-wrapper text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors font-medium">
                        View
                      </button>
                      <button className="ripple-wrapper text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors font-medium">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident — ${selected?.id}`} maxWidth="max-w-2xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Incident ID", selected.id],
                ["Type", selected.type],
                ["Victim", selected.victim],
                ["Student ID", selected.victimId],
                ["Department", selected.victimDept],
                ["Suspected", selected.suspectedPerson],
                ["Date", selected.date],
                ["Time", selected.time],
                ["Location", selected.location],
                ["Camera", selected.cameraId],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <span className={`mono font-bold ${selected.aiConfidence >= 90 ? "text-red-600" : "text-amber-600"}`}>{selected.aiConfidence}%</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full ${selected.aiConfidence >= 90 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${selected.aiConfidence}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            <img src={selected.evidenceImage} alt="Evidence" className="w-full h-44 object-cover rounded-xl bg-gray-100" />
            <div className="flex gap-2">
              <RippleButton variant="danger" className="flex-1">Confirm</RippleButton>
              <RippleButton variant="outline" className="flex-1">Reject</RippleButton>
              <RippleButton variant="primary" className="flex-1">Review</RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
