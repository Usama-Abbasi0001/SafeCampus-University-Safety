import { useState, useEffect } from "react";
import { Incident, IncidentStatus } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

const statuses: IncidentStatus[] = ["New", "Pending Review", "Under Review", "Confirmed", "Rejected", "Resolved"];

const confColor = (c: number) =>
  c >= 90 ? "text-red-400" : c >= 75 ? "text-amber-400" : "text-green-400";

export default function HarassmentAlerts() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "All">("All");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/incidents")
      .then(r => r.json())
      .then(data => setIncidents(data))
      .catch(console.error);
  }, []);

  const handleSendParentEmail = async (incidentId: string) => {
    setSendingEmailId(incidentId);
    setEmailStatusMsg(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/send-parent-email`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailStatusMsg(`✅ Notice sent to ${data.parentEmail} (${data.parentName})`);
      } else {
        setEmailStatusMsg(`⚠️ ${data.message || "Failed to deliver email"}`);
      }
    } catch (e: any) {
      setEmailStatusMsg(`❌ Error: ${e.message}`);
    } finally {
      setSendingEmailId(null);
    }
  };

  const updateStatus = async (status: IncidentStatus) => {
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

  const filtered = statusFilter === "All" ? incidents : incidents.filter((i) => i.status === statusFilter);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("All")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === "All" ? "bg-blue-600 text-white" : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"}`}
        >
          All ({incidents.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"}`}
          >
            {s} ({incidents.filter((i) => i.status === s).length})
          </button>
        ))}
      </div>

      {/* Incident cards */}
      <div className="space-y-3">
        {filtered.map((inc) => (
          <div key={inc.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-sm hover:shadow-lg hover:bg-slate-800 transition-all overflow-hidden">
            <div className="flex items-stretch">
              {/* Colored left bar by status */}
              <div className={`w-1.5 shrink-0 ${inc.status === "New" ? "bg-blue-500" : inc.status === "Pending Review" ? "bg-purple-500" : inc.status === "Under Review" ? "bg-amber-500" : inc.status === "Confirmed" ? "bg-red-500" : inc.status === "Resolved" ? "bg-green-500" : "bg-slate-500"}`} />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="mono text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{inc.id}</span>
                      <StatusBadge status={inc.status} size="sm" />
                      <span className={`mono text-xs font-bold ${confColor(inc.aiConfidence)}`}>AI {inc.aiConfidence}%</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {inc.type}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-300">
                      <div><span className="text-slate-500">{inc.type === 'Hand-Raising Detected' ? 'Recognized Person' : (inc.status === 'Confirmed' ? 'Victim' : 'Potential Target')}:</span> <span className="font-medium text-white">{typeof inc.victim === 'object' ? inc.victim.name : inc.victim}</span></div>
                      <div><span className="text-slate-500">Dept:</span> {typeof inc.victim === 'object' ? inc.victim.department : inc.victimDept}</div>
                      <div><span className="text-slate-500">Date:</span> {inc.date}</div>
                      <div><span className="text-slate-500">Time:</span> {inc.time}</div>
                      <div><span className="text-slate-500">Location:</span> {inc.location}</div>
                      <div><span className="text-slate-500">Camera:</span> <span className="mono">{inc.cameraId}</span></div>
                      {inc.type !== 'Hand-Raising Detected' && (
                        <div className="col-span-2"><span className="text-slate-500">{inc.status === 'Confirmed' ? 'Harasser / Suspect' : 'Potential Aggressor'}:</span> {typeof inc.harasser === 'object' ? inc.harasser.name : (inc.suspectedPerson || 'Unknown')}</div>
                      )}
                      {inc.duration && <div className="col-span-2 text-amber-400">Duration: {inc.duration}s</div>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <RippleButton variant="primary" size="sm" onClick={() => setSelected(inc)}>
                      View Details
                    </RippleButton>
                    <button
                      type="button"
                      onClick={() => handleSendParentEmail(inc.id)}
                      disabled={sendingEmailId === inc.id}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                      title="Send notification to parent email"
                    >
                      <span>📧</span>
                      <span>{sendingEmailId === inc.id ? "Sending..." : "Email Parent"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <span className="text-4xl block mb-3">✅</span>
          <p className="font-medium">No incidents with status "{statusFilter}"</p>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Alert Detail — ${selected?.id}`} maxWidth="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">Incident Details</p>
                <p className="text-sm text-white"><strong>ID:</strong> {selected.id}</p>
                <p className="text-sm text-white"><strong>Type:</strong> {selected.type}</p>
                <p className="text-sm text-white"><strong>Date & Time:</strong> {selected.date} at {selected.time}</p>
                <p className="text-sm text-white"><strong>Location:</strong> {selected.location}</p>
                <p className="text-sm text-white"><strong>Camera ID:</strong> {selected.cameraId}</p>
                {selected.duration && <p className="text-sm text-amber-400 font-bold">Duration: {selected.duration}+ seconds</p>}
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">{selected.type === 'Hand-Raising Detected' ? 'Recognized Person' : (selected.status === 'Confirmed' ? 'Victim' : 'Potential Target')}</p>
                {typeof selected.victim === 'object' && selected.victim.faceRecognitionStatus === 'Unknown' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold">?</div>
                    <div>
                      <p className="text-sm text-red-400 font-bold">UNKNOWN / UNVERIFIED</p>
                      <p className="text-xs text-slate-500">Face not clearly visible or unverified</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                       {typeof selected.victim === 'object' && selected.victim.profilePicture && (
                         <img src={selected.victim.profilePicture} alt="Victim" className="w-10 h-10 rounded-full object-cover" />
                       )}
                       <div>
                          <p className="text-sm text-white font-bold">{typeof selected.victim === 'object' ? selected.victim.name : selected.victim}</p>
                          <p className="text-xs text-slate-400">{typeof selected.victim === 'object' ? selected.victim.department : selected.victimDept}</p>
                          <p className="text-xs text-slate-400">{typeof selected.victim === 'object' ? selected.victim.rollNumber : ''}</p>
                       </div>
                    </div>
                    {typeof selected.victim === 'object' && selected.victim.parentName && (
                      <div className="mt-1 pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400">Parent: <span className="text-white">{selected.victim.parentName}</span> ({selected.victim.parentPhone})</p>
                      </div>
                    )}
                    {typeof selected.victim === 'object' && typeof selected.victim.faceDistance === 'number' && selected.victim.faceDistance > 0 && (
                      <div className="mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Facenet Distance: {selected.victim.faceDistance.toFixed(2)} (Thresh: {selected.victim.faceThreshold?.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selected.type !== 'Hand-Raising Detected' && (
                <div className="col-span-2 bg-slate-900/50 rounded-lg p-3 border border-red-500/30">
                  <p className="text-[10px] text-red-400 uppercase tracking-wide font-medium mb-1">{selected.status === 'Confirmed' ? 'Harasser / Suspect' : 'Potential Aggressor'}</p>
                  <div className="flex items-center gap-2">
                     {typeof selected.harasser === 'object' && selected.harasser.profilePicture && (
                       <img src={selected.harasser.profilePicture} alt="Harasser" className="w-10 h-10 rounded-full object-cover" />
                     )}
                     <div>
                        <p className="text-sm text-white font-bold">{typeof selected.harasser === 'object' ? selected.harasser.name : (selected.suspectedPerson || 'Unknown')}</p>
                        <p className="text-xs text-slate-400">{typeof selected.harasser === 'object' ? selected.harasser.department : ''}</p>
                        <p className="text-xs text-slate-400">{typeof selected.harasser === 'object' ? selected.harasser.rollNumber : ''}</p>
                     </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-2">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <span className={`mono font-bold text-base ${confColor(selected.aiConfidence)}`}>{selected.aiConfidence}%</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full ${selected.aiConfidence >= 90 ? "bg-red-500" : selected.aiConfidence >= 75 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${selected.aiConfidence}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-slate-900/50 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {selected.notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200">
                <strong className="text-amber-400 text-[10px] uppercase tracking-wide block mb-1">Notes</strong>
                {selected.notes}
              </div>
            )}

            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-2">Evidence Image</p>
              <img src={selected.evidenceImage} alt="Evidence" className="w-full h-52 object-cover rounded-xl bg-slate-800" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <RippleButton variant="danger" className="flex-1" onClick={() => updateStatus("Confirmed")}>Confirm Incident</RippleButton>
                <RippleButton variant="outline" className="flex-1" onClick={() => updateStatus("Rejected")}>Reject</RippleButton>
                <RippleButton variant="primary" className="flex-1" onClick={() => updateStatus("Under Review")}>Set Under Review</RippleButton>
              </div>

              {/* Direct Parent Email Action */}
              <div className="pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleSendParentEmail(selected.id)}
                  disabled={sendingEmailId === selected.id}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>📧</span>
                  <span>{sendingEmailId === selected.id ? "Dispatching Official Email..." : "Send Verified Incident Notice to Parent Email"}</span>
                </button>
                {emailStatusMsg && (
                  <p className="text-xs text-center mt-2 font-medium text-slate-300 bg-slate-900/70 py-1.5 px-3 rounded-lg border border-slate-700/50">
                    {emailStatusMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
