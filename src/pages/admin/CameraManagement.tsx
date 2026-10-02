import { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function CameraManagement() {
  const [cameraList, setCameraList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cameras")
      .then(res => res.json())
      .then(data => setCameraList(data))
      .catch(err => console.error("Failed to fetch cameras:", err));
  }, []);
  const [addModal, setAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = cameraList.filter((c) =>
    [c.id, c.name, c.location].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Cameras", value: cameraList.length, color: "text-white", bg: "bg-slate-500/10" },
          { label: "Active",        value: cameraList.filter((c) => c.status === "Active").length,      color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Maintenance",   value: cameraList.filter((c) => c.status === "Maintenance").length, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "AI Enabled",    value: cameraList.filter((c) => c.aiDetection).length,              color: "text-blue-400",  bg: "bg-blue-500/10"  },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-700/50`}>
            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cameras…"
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <RippleButton variant="primary" onClick={() => setAddModal(true)}>+ Add Camera</RippleButton>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700/50">
                {["Camera ID", "Camera Name", "Location", "Status", "AI Detection", "Detected Persons", "Last Active", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map((cam) => (
                <tr key={cam.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 mono text-xs text-blue-400 font-semibold whitespace-nowrap">{cam.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${cam.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-300"}`}>
                        📷
                      </div>
                      <span className="text-sm font-medium text-white whitespace-nowrap">{cam.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-48 truncate">{cam.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={cam.status} size="sm" /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`mono text-xs font-semibold px-2 py-1 rounded-md ${cam.aiDetection ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-400"}`}>
                      {cam.aiDetection ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap text-center">{cam.detectedPersons}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {cam.lastActive === "Live" ? (
                      <span className="flex items-center gap-1.5 text-green-400 font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live
                      </span>
                    ) : cam.lastActive}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === cam.id ? null : cam.id)}
                      className="p-1 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {openMenuId === cam.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10 py-1 text-sm font-medium">
                        <button onClick={() => { alert(`Viewing ${cam.name}`); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700">View</button>
                        <button onClick={() => { alert(`Editing ${cam.name}`); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700">Edit</button>
                        <button 
                          onClick={async () => {
                            const newStatus = cam.status === "Active" ? "Maintenance" : "Active";
                            try {
                              const res = await fetch(`/api/cameras/${cam.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: newStatus })
                              });
                              if (res.ok) {
                                setCameraList(cameraList.map(c => c.id === cam.id ? { ...c, status: newStatus } : c));
                              }
                            } catch (err) {
                              console.error("Failed to update status", err);
                            }
                            setOpenMenuId(null);
                          }} 
                          className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700"
                        >
                          {cam.status === "Active" ? "Disable" : "Enable"}
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

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Camera">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setAddModal(false); }}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Camera ID", placeholder: "CAM-007" },
              { label: "Camera Name", placeholder: "e.g. Science Block Entrance" },
              { label: "Location", placeholder: "Full location description" },
              { label: "IP Address", placeholder: "192.168.1.100" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{f.label}</label>
                <input placeholder={f.placeholder} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <input type="checkbox" id="ai-toggle" className="w-4 h-4 accent-blue-500" defaultChecked />
            <label htmlFor="ai-toggle" className="text-sm text-blue-400 font-medium">Enable AI Harassment Detection</label>
          </div>
          <div className="flex gap-3">
            <RippleButton type="submit" variant="primary" className="flex-1">Add Camera</RippleButton>
            <RippleButton type="button" variant="outline" className="flex-1" onClick={() => setAddModal(false)}>Cancel</RippleButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
