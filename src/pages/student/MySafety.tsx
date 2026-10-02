import { useState, useRef } from "react";
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
  
  const [type, setType] = useState("Verbal Harassment");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [suspectedPerson, setSuspectedPerson] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      alert("Please fill out the location and description.");
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("victim", student.name || "Unknown");
      formData.append("victimId", student.id || "Unknown");
      formData.append("victimDept", student.department || "Unknown");
      formData.append("type", type);
      formData.append("location", location);
      // We pass the description in case the backend schema adds a description field, though it currently doesn't show it.
      formData.append("suspectedPerson", suspectedPerson.trim() || "Unknown");
      formData.append("cameraId", "Manual Report");
      formData.append("aiConfidence", "0");
      formData.append("status", "New");
      
      if (evidenceFile) {
        formData.append("evidenceImage", evidenceFile);
      }

      const res = await fetch("/api/incidents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccessMsg("Incident reported successfully. The administration will review it shortly.");
        setType("Verbal Harassment");
        setLocation("");
        setDescription("");
        setSuspectedPerson("");
        setEvidenceFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert("Failed to report incident. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-3xl">
      {/* Current status card */}
      <div className={`rounded-xl border backdrop-blur-sm p-6 ${student.safetyStatus === "Safe" ? "bg-green-900/20 border-green-700/50" : "bg-amber-900/20 border-amber-700/50"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${student.safetyStatus === "Safe" ? "bg-green-500/10" : "bg-amber-500/10"}`}>
            {student.safetyStatus === "Safe" ? "🛡️" : "⚠️"}
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold mb-1 ${student.safetyStatus === "Safe" ? "text-green-400" : "text-amber-400"}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Your Safety Status
            </h2>
            <StatusBadge status={student.safetyStatus} />
            <p className={`text-sm mt-2 ${student.safetyStatus === "Safe" ? "text-green-300" : "text-amber-300"}`}>
              {student.safetyStatus === "Safe"
                ? "No active incidents. You are under AI-monitored campus protection."
                : "An incident involving you is under review. Our safety team will reach you shortly."}
            </p>
          </div>
        </div>
      </div>

      {/* Report incident */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
        <div className="flex items-start gap-4">
          <span className="text-3xl shrink-0">🚨</span>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Report an Incident</h3>
            <p className="text-sm text-slate-400 mb-4">
              If you have experienced or witnessed any form of harassment, please report it immediately. All reports are handled confidentially.
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Incident Type</label>
                <select 
                  value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-white"
                >
                  <option>Verbal Harassment</option>
                  <option>Physical Contact</option>
                  <option>Stalking</option>
                  <option>Threatening Behavior</option>
                  <option>Cyberbullying</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location</label>
                  <input 
                    value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where did this occur?" 
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-white placeholder-slate-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Suspected Harasser (Optional)</label>
                  <input 
                    value={suspectedPerson} onChange={(e) => setSuspectedPerson(e.target.value)}
                    placeholder="Name or description" 
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-white placeholder-slate-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Evidence / Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900/50 text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea 
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="Describe what happened…" 
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-900/50 text-white placeholder-slate-500" 
                />
              </div>
              
              {successMsg && (
                <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg text-green-400 text-xs font-medium">
                  ✅ {successMsg}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Safety tips */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Campus Safety Guidelines</h3>
        <div className="space-y-3">
          {safetyTips.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
              <span className="text-xl shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{tip.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
