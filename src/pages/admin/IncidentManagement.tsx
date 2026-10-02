import { useState, useEffect } from "react";
import { Incident, IncidentStatus } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type SortKey = "date" | "confidence" | "status";

const statusOrder: Record<IncidentStatus, number> = {
  New: 0, "Pending Review": 1, "Under Review": 2, Confirmed: 3, Rejected: 4, Resolved: 5,
};

export default function IncidentManagement() {
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [incidentList, setIncidentList] = useState<Incident[]>([]);

  const fetchIncidents = () => {
    fetch("/api/incidents")
      .then(res => res.json())
      .then(data => setIncidentList(data))
      .catch(err => console.error("Failed to fetch incidents:", err));
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async (status: IncidentStatus) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/incidents/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSelected({ ...selected, status });
        fetchIncidents();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this incident?")) return;
    try {
      const res = await fetch(`/api/incidents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIncidentList(incidentList.filter(i => i.id !== id));
      } else {
        alert("Failed to delete incident");
      }
    } catch (err) {
      console.error(err);
      alert("Network error deleting incident");
    }
  };

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
          className="flex-1 min-w-52 px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sort:</span>
          {(["date", "confidence", "status"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${sortBy === k ? "bg-blue-600 text-white" : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <RippleButton variant="primary" size="sm" icon={<span>+</span>}>New Incident</RippleButton>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/90">
          <span className="text-sm text-slate-400">{sorted.length} incident{sorted.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700/50">
                {["ID", "Type", "Victim", "Dept", "Suspected", "Camera", "AI%", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sorted.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 mono text-xs text-blue-400 font-medium">{inc.id}</td>
                  <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">{inc.type}</td>
                  <td className="px-4 py-3 text-xs font-medium text-white whitespace-nowrap">{typeof inc.victim === 'object' ? inc.victim.name : inc.victim} <span className="text-[10px] text-slate-500 block">{inc.status === 'Confirmed' ? '' : '(Target)'}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{typeof inc.victim === 'object' ? inc.victim.department : inc.victimDept}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap max-w-32 truncate">{typeof inc.harasser === 'object' ? inc.harasser.name : (inc.suspectedPerson || '-')} <span className="text-[10px] text-slate-500 block">{inc.status === 'Confirmed' ? '' : '(Aggressor)'}</span></td>

                  <td className="px-4 py-3 mono text-xs text-slate-400 whitespace-nowrap">{inc.cameraId}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`mono text-xs font-bold ${inc.aiConfidence >= 90 ? "text-red-400" : inc.aiConfidence >= 75 ? "text-amber-400" : "text-green-400"}`}>
                      {inc.aiConfidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={inc.status} size="sm" /></td>
                  <td className="px-4 py-3 whitespace-nowrap relative">
                    <button 
                      className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700"
                      onClick={() => setMenuOpen(menuOpen === inc.id ? null : inc.id)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {menuOpen === inc.id && (
                      <div className="absolute right-8 top-8 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                        <button 
                          className="block w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors" 
                          onMouseDown={() => { setSelected(inc); setMenuOpen(null); }}
                        >
                          View Incident
                        </button>
                        <button 
                          className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors" 
                          onMouseDown={() => { handleDelete(inc.id); setMenuOpen(null); }}
                        >
                          Delete Incident
                        </button>
                      </div>
                    )}
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
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">{selected.status === 'Confirmed' ? 'Victim' : 'Potential Target'}</p>
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
              </div>

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
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-900/50 p-3 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <span className={`mono font-bold ${selected.aiConfidence >= 90 ? "text-red-400" : "text-amber-400"}`}>{selected.aiConfidence}%</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full ${selected.aiConfidence >= 90 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${selected.aiConfidence}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-slate-900/50 p-3 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>
            
            {/* Identity Correction Mode */}
            {selected.status === 'Pending Review' || selected.status === 'Under Review' || selected.status === 'New' ? (
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mt-2">
                 <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-2">Correct Identities (Before Confirmation)</p>
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="text-xs text-slate-400 block mb-1">Target Student ID</label>
                     <input 
                       type="text" 
                       className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white" 
                       defaultValue={selected.victimId || (typeof selected.victim === 'object' ? selected.victim.studentId : '') || 'Unknown'} 
                       id={`edit-victim-${selected.id}`}
                     />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs text-slate-400 block mb-1">Aggressor Student ID</label>
                     <input 
                       type="text" 
                       className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white" 
                       defaultValue={selected.harasserId || (typeof selected.harasser === 'object' ? selected.harasser.studentId : '') || 'Unknown'} 
                       id={`edit-harasser-${selected.id}`}
                     />
                   </div>
                   <div className="flex items-end">
                     <RippleButton variant="outline" size="sm" onClick={async () => {
                       const vId = (document.getElementById(`edit-victim-${selected.id}`) as HTMLInputElement).value;
                       const hId = (document.getElementById(`edit-harasser-${selected.id}`) as HTMLInputElement).value;
                       try {
                         const res = await fetch(`/api/incidents/${selected.id}`, {
                           method: "PUT",
                           headers: { "Content-Type": "application/json" },
                           body: JSON.stringify({ victimId: vId, harasserId: hId })
                         });
                         if (res.ok) {
                           const updated = await res.json();
                           setSelected(updated);
                           fetchIncidents();
                         } else alert('Failed to update identities');
                       } catch (e) {
                         console.error(e);
                       }
                     }}>Update</RippleButton>
                   </div>
                 </div>
              </div>
            ) : null}

            <div className="w-full mt-3">
              <img src={selected.evidenceImage} alt="Evidence" className="w-full h-64 object-contain rounded-xl bg-slate-800 border border-slate-700/50" />
            </div>

            <div className="flex gap-2 mt-4">
              <RippleButton variant="danger" className="flex-1" onClick={() => handleUpdateStatus("Confirmed")}>Confirm</RippleButton>
              <RippleButton variant="outline" className="flex-1" onClick={() => handleUpdateStatus("Rejected")}>Reject</RippleButton>
              <RippleButton variant="primary" className="flex-1" onClick={() => handleUpdateStatus("Under Review")}>Review</RippleButton>
              <button 
                onClick={() => handleUpdateStatus("Resolved")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30"
              >
                Mark Safe
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
