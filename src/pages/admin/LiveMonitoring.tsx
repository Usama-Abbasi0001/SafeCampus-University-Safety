import { useState, useEffect } from "react";
import { Camera } from "../../types";
import StatusBadge from "../../components/StatusBadge";

function AiIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

export default function LiveMonitoring() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive" | "Maintenance">("All");

  useEffect(() => {
    fetch("http://localhost:5000/api/cameras")
      .then(r => r.json())
      .then(data => setCameras(data))
      .catch(console.error);
  }, []);

  const filtered = filter === "All" ? cameras : cameras.filter((c) => c.status === filter);

  const totalPersons = cameras.filter((c) => c.status === "Active").reduce((s, c) => s + (c.detectedPersons || 0), 0);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Top stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Cameras", value: cameras.length, color: "text-slate-800" },
          { label: "Active",        value: cameras.filter((c) => c.status === "Active").length,      color: "text-green-700" },
          { label: "Inactive",      value: cameras.filter((c) => c.status === "Inactive").length,    color: "text-gray-500" },
          { label: "Persons Detected", value: totalPersons, color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Filter:</span>
        {(["All", "Active", "Inactive", "Maintenance"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Live Feed Active
        </span>
      </div>

      {/* Camera grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((cam) => (
          <div key={cam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Camera feed */}
            <div className="relative aspect-video bg-slate-800">
              {cam.status === "Active" ? (
                <img src={cam.feed} alt={cam.name} className="w-full h-full object-cover opacity-80" />
              ) : cam.status === "Maintenance" ? (
                <div className="w-full h-full camera-shimmer flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl">🔧</span>
                    <p className="text-white/60 text-xs mt-1">Under Maintenance</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl text-slate-600">📷</span>
                    <p className="text-slate-500 text-xs mt-1">Camera Offline</p>
                  </div>
                </div>
              )}

              {/* Overlays */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cam.status === "Active" ? "bg-red-500 animate-pulse" : "bg-gray-500"}`} />
                <span className="text-white text-[10px] font-semibold bg-black/50 px-2 py-0.5 rounded-full mono">{cam.id}</span>
              </div>

              {cam.status === "Active" && (
                <div className="absolute bottom-2 right-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full">
                  LIVE
                </div>
              )}

              {cam.aiDetection && cam.status === "Active" && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  <AiIcon /> AI ON
                </div>
              )}
            </div>

            {/* Info area */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{cam.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cam.location}</p>
                </div>
                <StatusBadge status={cam.status} size="sm" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-0.5">
                    <PersonIcon />
                    <span className="font-bold text-sm text-gray-800">{cam.detectedPersons}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Persons</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className={`font-bold text-sm ${cam.aiDetection ? "text-blue-600" : "text-gray-400"}`}>{cam.aiDetection ? "ON" : "OFF"}</p>
                  <p className="text-[10px] text-gray-400">AI Status</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="font-bold text-sm text-gray-800">{cam.lastActive}</p>
                  <p className="text-[10px] text-gray-400">Last Active</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
