import { useState, useEffect, useRef } from "react";
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

function MaximizeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocalWebcamCard({ 
  aiRunning, 
  loadingAi, 
  onStartAi 
}: { 
  aiRunning: boolean; 
  loadingAi: boolean; 
  onStartAi: () => void; 
}) {
  const [feedKey, setFeedKey] = useState(Date.now());
  const [streamError, setStreamError] = useState(false);
  const [sizeMode, setSizeMode] = useState<"standard" | "large" | "compact">("standard");
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (aiRunning) {
      setStreamError(false);
      setFeedKey(Date.now());
    }
  }, [aiRunning]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const handleSnapshot = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      try {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement("a");
        link.download = `cctv_cam01_snapshot_${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();
      } catch (e) {
        // Fallback directly via URL
        window.open(`http://localhost:5001/video_feed?t=${Date.now()}`, '_blank');
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/40 overflow-hidden transition-all duration-300 ${
        sizeMode === "large" 
          ? "col-span-full ring-2 ring-emerald-500/30" 
          : sizeMode === "standard"
          ? "col-span-full xl:col-span-3 ring-1 ring-emerald-500/30"
          : "col-span-1"
      }`}
    >
      {/* Top Command Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${aiRunning && !streamError ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-white font-bold text-sm tracking-wide mono">CAM-01 • ACTIVE CCTV</span>
          </div>
          <span className="hidden sm:inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
            Central Academic Block - Floor 1 Corridor
          </span>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-2">
          {/* Size Selectors */}
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
            <button
              onClick={() => setSizeMode("standard")}
              className={`px-2.5 py-1 rounded-md transition-colors ${sizeMode === "standard" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              title="Standard Balanced View"
            >
              Standard
            </button>
            <button
              onClick={() => setSizeMode("large")}
              className={`px-2.5 py-1 rounded-md transition-colors ${sizeMode === "large" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              title="Large View"
            >
              Large
            </button>
            <button
              onClick={() => setSizeMode("compact")}
              className={`px-2 py-1 rounded-md transition-colors ${sizeMode === "compact" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              title="Compact View"
            >
              Grid
            </button>
          </div>

          {/* Snapshot Button */}
          {aiRunning && (
            <button
              onClick={handleSnapshot}
              title="Take CCTV Snapshot"
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <CameraIcon />
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => { setStreamError(false); setFeedKey(Date.now()); }}
            title="Refresh Live Stream"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshIcon />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Native Fullscreen"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <MaximizeIcon />
          </button>
        </div>
      </div>

      {/* Main Video Viewport (Clean, Balanced Height) */}
      <div 
        className={`relative bg-slate-950 flex items-center justify-center overflow-hidden transition-all duration-300 ${
          sizeMode === "large"
            ? "h-[440px] md:h-[500px] xl:h-[540px]"
            : sizeMode === "standard"
            ? "h-[340px] md:h-[400px] xl:h-[440px]"
            : "aspect-video max-h-[360px]"
        }`}
      >
        {aiRunning ? (
          <>
            <img 
              ref={imgRef}
              key={feedKey}
              src={`http://localhost:5001/video_feed?t=${feedKey}`} 
              alt="AI Live Feed" 
              className="w-full h-full object-contain bg-slate-950 select-none"
              onError={() => {
                setStreamError(true);
                setTimeout(() => {
                  setFeedKey(Date.now());
                  setStreamError(false);
                }, 2000);
              }}
              onLoad={() => setStreamError(false)}
            />

            {streamError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-base font-semibold text-white">Connecting to AI Neural Stream...</p>
                <p className="text-xs text-slate-400 mt-1">Acquiring DirectShow webcam stream & loading FaceNet/YOLO engine</p>
                <button 
                  onClick={() => { setStreamError(false); setFeedKey(Date.now()); }}
                  className="mt-4 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-md"
                >
                  Reconnect Feed
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              📷
            </div>
            <div>
              <p className="text-lg font-bold text-white">CCTV CAM-01 Standby</p>
              <p className="text-xs text-slate-400 mt-1">
                AI Pose Recognition & FaceNet identification engine is currently paused. Activate to start live continuous monitoring.
              </p>
            </div>
            <button
              onClick={onStartAi}
              disabled={loadingAi}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
            >
              {loadingAi ? "Starting AI Engine..." : "⚡ Activate High-Definition Live Stream"}
            </button>
          </div>
        )}

        {/* Overlaid Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-20 pointer-events-none">
          <span className={`flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md mono ${
            aiRunning && !streamError ? 'bg-red-600/90 text-white animate-pulse' : 'bg-slate-800/80 text-slate-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-white" />
            {aiRunning && !streamError ? 'LIVE' : 'STANDBY'}
          </span>
          <span className="bg-slate-900/80 backdrop-blur-sm text-blue-300 border border-blue-500/40 text-xs px-2.5 py-1 rounded-full font-medium mono">
            CAM-01 (ACTIVE CCTV)
          </span>
        </div>

        {aiRunning && !streamError && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20 pointer-events-none">
            <div className="bg-emerald-600/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium shadow-md flex items-center gap-1.5">
              <AiIcon />
              <span>30 FPS • AI ENGINE ONLINE</span>
            </div>
            <span className="hidden md:inline-block bg-slate-900/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-mono">
              HD READY
            </span>
          </div>
        )}

        {/* Live HUD Bottom Indicator */}
        {aiRunning && !streamError && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 pointer-events-none z-20">
            <div className="flex items-center gap-4">
              <span>🎯 <strong>Face Recognition:</strong> <span className="text-blue-400">FaceNet 512-D Embedding Active</span></span>
              <span className="hidden md:inline">⚡ <strong>Rules:</strong> <span className="text-emerald-400">Hand on Shoulder/Neck & Kissing</span></span>
            </div>
            <div className="mono text-[11px] text-slate-300">
              GPS: <strong className="text-emerald-400">25.4285° N, 68.5392° E</strong>
            </div>
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Academic Complex Block A, Central Corridor (CAM-01)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified Physical CCTV Installation • High Sensitivity AI Surveillance Node
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-semibold">
            Status: {aiRunning ? "Streaming Live" : "Offline"}
          </span>
          <StatusBadge status={aiRunning ? "Active" : "Inactive"} size="sm" />
        </div>
      </div>
    </div>
  );
}

export default function LiveMonitoring() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive" | "Maintenance">("All");
  const [aiRunning, setAiRunning] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const checkStatus = () => {
    fetch("/api/ai/status")
      .then(r => r.json())
      .then(data => {
        setAiRunning(data.isRunning || false);
      })
      .catch(() => setAiRunning(false));
  };

  useEffect(() => {
    fetch("/api/cameras")
      .then(r => r.json())
      .then(data => setCameras(data))
      .catch(console.error);

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAi = () => {
    if (aiRunning) {
      setAiRunning(false);
      setLoadingAi(true);
      fetch("/api/ai/stop", { method: "POST" })
        .catch(console.error)
        .finally(() => setLoadingAi(false));
    } else {
      setLoadingAi(true);
      fetch("/api/ai/start", { method: "POST" })
        .then(r => r.json())
        .then(data => {
          setAiRunning(true);
        })
        .catch(err => {
          console.error(err);
          setAiRunning(false);
        })
        .finally(() => {
          setTimeout(() => setLoadingAi(false), 1000);
        });
    }
  };

  const filtered = filter === "All" ? cameras : cameras.filter((c) => c.status === filter);
  const totalPersons = cameras.filter((c) => c.status === "Active").reduce((s, c) => s + (c.detectedPersons || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Top Header & Toggle */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live CCTV Surveillance & Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time deep learning facial identification and physical contact behavior detection</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700/60 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">AI Neural Engine</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              aiRunning 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
                : 'bg-slate-700 text-slate-400'
            }`}>
              {loadingAi ? "Starting..." : aiRunning ? "Active / ON" : "Disabled / OFF"}
            </span>
          </div>
          <button 
            type="button"
            onClick={handleToggleAi}
            disabled={loadingAi}
            title={aiRunning ? "Click to Turn Off AI Engine" : "Click to Turn On AI Engine"}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
              aiRunning ? 'bg-emerald-600' : 'bg-slate-700'
            } ${loadingAi ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              aiRunning ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cameras", value: cameras.length, color: "text-white" },
          { label: "Active Nodes",  value: cameras.filter((c) => c.status === "Active").length, color: "text-green-400" },
          { label: "Inactive",      value: cameras.filter((c) => c.status === "Inactive").length, color: "text-slate-500" },
          { label: "Persons in Frame", value: totalPersons || (aiRunning ? "Active" : 0), color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/70 rounded-xl p-4 shadow-sm border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter and Live Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Feed Filter:</span>
          {(["All", "Active", "Inactive", "Maintenance"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 border border-slate-700/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span>Surveillance Feed <strong>CAM-01</strong> Active at Floor 1 Corridor</span>
        </div>
      </div>

      {/* Main CCTV Command Screen: Hero Card */}
      {(filter === "All" || filter === "Active") && (
        <div className="space-y-3">
          <LocalWebcamCard aiRunning={aiRunning} loadingAi={loadingAi} onStartAi={handleToggleAi} />
        </div>
      )}

      {/* Other Standby CCTV Cameras */}
      {filtered.filter(c => c.id !== "CAM-01").length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Campus Camera Network (Standby Feeds)</h2>
            <span className="text-xs text-slate-400">{filtered.filter(c => c.id !== "CAM-01").length} Additional CCTV Posts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.filter(c => c.id !== "CAM-01").map((cam) => (
              <div key={cam.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-hidden hover:shadow-lg transition-all">
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-slate-800/40 via-slate-900/90 to-black pointer-events-none" />
                  <div className="text-center z-10 p-4">
                    <span className="text-3xl block mb-1">📹</span>
                    <p className="text-xs font-semibold text-slate-300 mono">{cam.id} • RTSP STANDBY</p>
                    <p className="text-[11px] text-slate-500 mt-1">{cam.location}</p>
                  </div>

                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
                    <span className={`w-2 h-2 rounded-full ${cam.status === "Active" ? "bg-emerald-500" : "bg-slate-500"}`} />
                    <span className="text-white text-[10px] font-semibold bg-black/60 px-2 py-0.5 rounded-full mono">{cam.id}</span>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-800/80 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-medium z-20 border border-slate-700">
                    {cam.aiDetection ? "AI READY" : "MANUAL"}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {cam.name}
                      </h3>
                      <p className="text-xs text-blue-400 font-medium mt-0.5">
                        📍 {cam.location}
                      </p>
                      {cam.installationAddress && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {cam.installationAddress}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={cam.status} size="sm" />
                  </div>

                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] mono text-slate-400">
                    <span>GPS: <strong className="text-emerald-400">{cam.latitude?.toFixed(4)}° N, {cam.longitude?.toFixed(4)}° E</strong></span>
                    <span className="text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px]">Verified Post</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
