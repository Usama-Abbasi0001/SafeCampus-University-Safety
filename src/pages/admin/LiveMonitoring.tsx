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

function PersonIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

function LocalWebcamCard({ device, index, aiRunning, loadingAi }: { device?: MediaDeviceInfo, index: number, aiRunning: boolean, loadingAi: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [personsCount, setPersonsCount] = useState<number | string>(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval>;

    async function setupCamera() {
      if (aiRunning || loadingAi) return; // Release lock for Python backend
      
      try {
        const constraints = device 
          ? { video: { deviceId: { exact: device.deviceId } } } 
          : { video: true };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Set to 0 if no real data is provided
          setPersonsCount(0);
        }
      } catch (err: any) {
        setError(err.message || "Failed to access webcam");
      }
    }

    setupCamera();

    return () => {
      clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [device, aiRunning, loadingAi]);

  const camName = device && device.label ? device.label : `Physical Webcam ${index + 1}`;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-blue-500/50 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-slate-900">
        {aiRunning ? (
          <img 
            src="http://localhost:5001/video_feed" 
            alt="AI Live Feed" 
            className="w-full h-full object-cover opacity-90"
            onError={(e) => {
              // Retry connecting every 2 seconds while AI engine boots up
              setTimeout(() => {
                if (e.target) {
                  (e.target as HTMLImageElement).src = `http://localhost:5001/video_feed?retry=${Date.now()}`;
                }
              }, 2000);
            }}
          />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
        )}
        {error && !aiRunning && <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs text-center p-2 bg-black/60">{error}</div>}
        
        {/* Overlays */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${aiRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-white text-[10px] font-semibold bg-black/50 px-2 py-0.5 rounded-full mono">LOCAL-CAM-0{index + 1}</span>
        </div>
        {aiRunning && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
            <AiIcon /> AI ON
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2 truncate">
            <h3 className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'DM Sans', sans-serif" }} title={camName}>{camName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Local Device</p>
          </div>
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
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => {
    fetch("/api/cameras")
      .then(r => r.json())
      .then(data => setCameras(data))
      .catch(console.error);
      
    // Auto-start AI when entering the page
    fetch("/api/ai/start", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        setAiRunning(data.isRunning);
        setLoadingAi(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingAi(false);
      });

    // Cleanup: Stop AI when leaving the page so the camera turns off
    return () => {
      fetch("/api/ai/stop", { method: "POST" }).catch(console.error);
    };
  }, []);

  const filtered = filter === "All" ? cameras : cameras.filter((c) => c.status === filter);

  const totalPersons = cameras.filter((c) => c.status === "Active").reduce((s, c) => s + (c.detectedPersons || 0), 0);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Live Monitoring Control</h1>
        
        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700/50">
          <span className="text-sm font-medium text-slate-300">AI Engine</span>
          <button 
            onClick={() => {
              if (aiRunning) {
                setAiRunning(false);
                fetch("/api/ai/stop", { method: "POST" }).catch(console.error);
              } else {
                setLoadingAi(true);
                fetch("/api/ai/start", { method: "POST" })
                  .then(r => r.json())
                  .then(data => {
                    setAiRunning(data.isRunning);
                    setLoadingAi(false);
                  })
                  .catch(err => {
                    console.error(err);
                    setLoadingAi(false);
                  });
              }
            }}
            disabled={loadingAi}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiRunning ? 'bg-blue-600' : 'bg-slate-600'} ${loadingAi ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiRunning ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
      {/* Top stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Cameras", value: cameras.length, color: "text-white" },
          { label: "Active",        value: cameras.filter((c) => c.status === "Active").length,      color: "text-green-400" },
          { label: "Inactive",      value: cameras.filter((c) => c.status === "Inactive").length,    color: "text-slate-500" },
          { label: "Persons Detected", value: totalPersons, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-700/50">
            <p className="text-xs text-slate-400 font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Filter:</span>
        {(["All", "Active", "Inactive", "Maintenance"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-slate-800/60 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50"}`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Live Feed Active
        </span>
      </div>

      {/* Camera grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <LocalWebcamCard index={0} aiRunning={aiRunning} loadingAi={loadingAi} />
      </div>
    </div>
  );
}
