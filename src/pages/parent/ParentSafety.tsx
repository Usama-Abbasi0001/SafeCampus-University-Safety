import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";

export default function ParentSafety({ user }: { user: any }) {
  const child = user?.linkedStudent || {};
  const config = {
    Safe: { bg: "bg-green-900/20", border: "border-green-700/50", text: "text-green-400", icon: "🛡️", title: "Child is Safe" },
    Alert: { bg: "bg-red-900/20", border: "border-red-700/50", text: "text-red-400", icon: "🚨", title: "Alert — Child at Risk" },
    "Incident Under Review": { bg: "bg-amber-900/20", border: "border-amber-700/50", text: "text-amber-400", icon: "⚠️", title: "Incident Under Review" },
  };
  const c = config[child.safetyStatus as keyof typeof config] || config.Safe;

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in">
      <div className={`rounded-xl border ${c.border} ${c.bg} p-6`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{c.icon}</div>
          <div>
            <h2 className={`text-lg font-bold ${c.text}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.title}</h2>
            <p className={`text-sm ${c.text} opacity-80`}>{child.name}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={child.safetyStatus} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Student Name", child.name],
            ["Student ID", child.id],
            ["Department", child.department],
            ["Semester", child.semester],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{k}</p>
              <p className="text-sm font-semibold text-white">{v}</p>
            </div>
          ))}
        </div>

        {child.safetyStatus !== "Safe" && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
            <p className={`text-sm font-medium ${c.text}`}>
              {child.safetyStatus === "Alert"
                ? "🚨 An active incident has been confirmed involving your child. Please contact the university safety office immediately."
                : "⚠️ An incident involving your child is currently being reviewed by the safety team. You will be notified of updates."}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Safety Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />
          <div className="space-y-4 pl-10">
            {[
              { time: "Dec 13, 02:20 PM", label: "Incident Confirmed", type: "danger" },
              { time: "Dec 13, 02:15 PM", label: "AI Detection Alert Triggered — Library Entrance", type: "warning" },
              { time: "Dec 13, 02:00 PM", label: "System monitoring active", type: "info" },
              { time: "Dec 13, 09:00 AM", label: "Child checked in to campus", type: "success" },
            ].map((e, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-10 top-1 w-3 h-3 rounded-full ring-2 ring-slate-800 ${e.type === "danger" ? "bg-red-500" : e.type === "warning" ? "bg-amber-400" : e.type === "success" ? "bg-green-500" : "bg-blue-400"}`} />
                <p className="text-xs text-slate-400">{e.time}</p>
                <p className="text-sm font-medium text-white mt-0.5">{e.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Campus Safety Contact</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
            <span>📞</span>
            <div>
              <p className="text-xs text-red-400 font-semibold">Emergency Hotline (24/7)</p>
              <p className="text-sm font-bold text-red-300">03173509636</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
