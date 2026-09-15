import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";

const safetyTips = [
  { icon: "📱", title: "Keep Your Phone Charged", desc: "Always keep your phone charged and with you on campus." },
  { icon: "👥", title: "Travel in Groups", desc: "Avoid isolated areas, especially after hours. Walk with friends." },
  { icon: "🚨", title: "Report Immediately", desc: "Use this portal to report any incident immediately. Your report is confidential." },
  { icon: "📍", title: "Stay in Monitored Areas", desc: "Campus cameras are active in all monitored zones for your protection." },
  { icon: "🔒", title: "Protect Your Privacy", desc: "Do not share personal information with strangers on campus." },
];

export default function MySafety({ user }: { user: any }) {
  const student = user;
  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-3xl">
      {/* Current status card */}
      <div className={`rounded-xl border p-6 ${student.safetyStatus === "Safe" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${student.safetyStatus === "Safe" ? "bg-green-100" : "bg-amber-100"}`}>
            {student.safetyStatus === "Safe" ? "🛡️" : "⚠️"}
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold mb-1 ${student.safetyStatus === "Safe" ? "text-green-800" : "text-amber-800"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Your Safety Status
            </h2>
            <StatusBadge status={student.safetyStatus} />
            <p className={`text-sm mt-2 ${student.safetyStatus === "Safe" ? "text-green-600" : "text-amber-700"}`}>
              {student.safetyStatus === "Safe"
                ? "No active incidents. You are under AI-monitored campus protection."
                : "An incident involving you is under review. Our safety team will reach you shortly."}
            </p>
          </div>
        </div>
      </div>

      {/* Report incident */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
        <div className="flex items-start gap-4">
          <span className="text-3xl shrink-0">🚨</span>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Report an Incident</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have experienced or witnessed any form of harassment, please report it immediately. All reports are handled confidentially.
            </p>
            <form className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Incident Type</label>
                <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option>Verbal Harassment</option>
                  <option>Physical Contact</option>
                  <option>Stalking</option>
                  <option>Threatening Behavior</option>
                  <option>Cyberbullying</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                <input placeholder="Where did this occur?" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea rows={3} placeholder="Describe what happened…" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <RippleButton variant="danger" size="md" className="w-full">Submit Report</RippleButton>
            </form>
          </div>
        </div>
      </div>

      {/* Safety tips */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Campus Safety Guidelines</h3>
        <div className="space-y-3">
          {safetyTips.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg">
              <span className="text-xl shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
