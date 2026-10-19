import { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";
import { Camera } from "../../types";

export default function CameraManagement() {
  const [cameraList, setCameraList] = useState<Camera[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [activeCam, setActiveCam] = useState<Camera | null>(null);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    location: "",
    installationAddress: "",
    latitude: 25.4285,
    longitude: 68.5392,
    aiDetection: true,
    status: "Active" as "Active" | "Inactive" | "Maintenance"
  });

  const fetchCameras = () => {
    fetch("/api/cameras")
      .then(res => res.json())
      .then(data => setCameraList(data))
      .catch(err => console.error("Failed to fetch cameras:", err));
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleOpenEdit = (cam: Camera) => {
    setActiveCam(cam);
    setFormData({
      id: cam.id,
      name: cam.name,
      location: cam.location,
      installationAddress: cam.installationAddress || "",
      latitude: cam.latitude || 25.4285,
      longitude: cam.longitude || 68.5392,
      aiDetection: cam.aiDetection,
      status: cam.status
    });
    setEditModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCam) return;
    try {
      const res = await fetch(`/api/cameras/${activeCam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchCameras();
        setEditModal(false);
        setActiveCam(null);
      }
    } catch (err) {
      console.error("Failed to update camera:", err);
    }
  };

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchCameras();
        setAddModal(false);
        setFormData({
          id: "",
          name: "",
          location: "",
          installationAddress: "",
          latitude: 25.4285,
          longitude: 68.5392,
          aiDetection: true,
          status: "Active"
        });
      }
    } catch (err) {
      console.error("Failed to create camera:", err);
    }
  };

  const filtered = cameraList.filter((c) =>
    [c.id, c.name, c.location, c.installationAddress].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
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
          placeholder="Search cameras by ID, name, verified location…"
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <RippleButton variant="primary" onClick={() => {
          setFormData({
            id: `CAM-0${cameraList.length + 1}`,
            name: "",
            location: "",
            installationAddress: "",
            latitude: 25.4285,
            longitude: 68.5392,
            aiDetection: true,
            status: "Active"
          });
          setAddModal(true);
        }}>+ Add Camera</RippleButton>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700/50">
                {["Camera ID", "Camera Name", "Verified Location & Address", "Coordinates", "Status", "AI Detection", "Last Active", "Action"].map((h) => (
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
                  <td className="px-4 py-3 text-xs max-w-64">
                    <p className="font-semibold text-slate-200">{cam.location}</p>
                    {cam.installationAddress && (
                      <p className="text-slate-400 text-[11px] mt-0.5">{cam.installationAddress}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 mono text-[11px] text-slate-400 whitespace-nowrap">
                    {cam.latitude && cam.longitude ? (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-slate-500">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={cam.status} size="sm" /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`mono text-xs font-semibold px-2 py-1 rounded-md ${cam.aiDetection ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-400"}`}>
                      {cam.aiDetection ? "Enabled" : "Disabled"}
                    </span>
                  </td>
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
                      <div className="absolute right-0 mt-2 w-36 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10 py-1 text-sm font-medium">
                        <button onClick={() => handleOpenEdit(cam)} className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700">Configure Location</button>
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
                                fetchCameras();
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
                        <div className="border-t border-slate-700/50 my-1"></div>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${cam.name}?`)) {
                              try {
                                const res = await fetch(`/api/cameras/${cam.id}`, { method: "DELETE" });
                                if (res.ok) {
                                  setCameraList(cameraList.filter(c => c.id !== cam.id));
                                }
                              } catch (err) {
                                console.error("Failed to delete camera", err);
                              }
                            }
                            setOpenMenuId(null);
                          }}
                          className="block w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10"
                        >
                          Delete
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

      {/* Add Camera Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add CCTV Camera with Verified Location">
        <form className="space-y-4" onSubmit={handleAddCamera}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Camera ID *</label>
              <input 
                required 
                value={formData.id} 
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="CAM-01" 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Camera Name *</label>
              <input 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Science Block Entrance" 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Verified Physical Location *</label>
              <input 
                required 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Central Academic Block - Floor 1 Corridor" 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Installation Address / Mounting Post</label>
              <input 
                value={formData.installationAddress} 
                onChange={(e) => setFormData({ ...formData, installationAddress: e.target.value })}
                placeholder="e.g. Academic Complex Block A, Central Pillar 3" 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude</label>
              <input 
                type="number" 
                step="0.0001" 
                value={formData.latitude} 
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude</label>
              <input 
                type="number" 
                step="0.0001" 
                value={formData.longitude} 
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <input 
              type="checkbox" 
              id="ai-toggle" 
              className="w-4 h-4 accent-blue-500" 
              checked={formData.aiDetection}
              onChange={(e) => setFormData({ ...formData, aiDetection: e.target.checked })}
            />
            <label htmlFor="ai-toggle" className="text-sm text-blue-400 font-medium">Enable AI Detection for this Camera</label>
          </div>
          <div className="flex gap-3">
            <RippleButton type="submit" variant="primary" className="flex-1">Add Camera</RippleButton>
            <RippleButton type="button" variant="outline" className="flex-1" onClick={() => setAddModal(false)}>Cancel</RippleButton>
          </div>
        </form>
      </Modal>

      {/* Edit Camera Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Configure Location - ${activeCam?.id}`}>
        <form className="space-y-4" onSubmit={handleSaveEdit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Camera ID</label>
              <input 
                disabled 
                value={formData.id} 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-400 cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Camera Name *</label>
              <input 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Verified Physical Campus Location *</label>
              <input 
                required 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Central Academic Block - Floor 1 Corridor" 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Installation Address / Mounting Post</label>
              <input 
                value={formData.installationAddress} 
                onChange={(e) => setFormData({ ...formData, installationAddress: e.target.value })}
                placeholder="e.g. Academic Complex Block A, Central Pillar 3" 
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude</label>
              <input 
                type="number" 
                step="0.0001" 
                value={formData.latitude} 
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude</label>
              <input 
                type="number" 
                step="0.0001" 
                value={formData.longitude} 
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <RippleButton type="submit" variant="primary" className="flex-1">Save Verified Location</RippleButton>
            <RippleButton type="button" variant="outline" className="flex-1" onClick={() => setEditModal(false)}>Cancel</RippleButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
