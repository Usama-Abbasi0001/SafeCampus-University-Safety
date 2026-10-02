import { useState, useEffect } from "react";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function StudentProfile({ user }: { user: any }) {
  const [student, setStudent] = useState(user);
  const [settings, setSettings] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    parentPhone: user.parentPhone || "",
    parentName: user.parentName || "",
  });

  useEffect(() => {
    fetch(`/api/students/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setStudent(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            parentPhone: data.parentPhone || "",
            parentName: data.parentName || "",
          });
        }
      })
      .catch(err => console.error("Failed to load student data", err));

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed to load settings", err));
  }, [user.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent({ ...student, ...updated });
        setEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in">
      {/* Photo + basic */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <img src={student.photo} alt={student.name} className="w-24 h-24 rounded-2xl object-cover bg-slate-900 ring-4 ring-slate-700" />
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md text-sm hover:bg-blue-700 transition-colors">
              ✏️
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>{student.name}</h2>
            <p className="mono text-sm text-blue-400 font-medium mt-0.5">{student.id}</p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={student.status} size="sm" />
              <StatusBadge status={student.safetyStatus} size="sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Full Name", value: student.name },
            { label: "Student ID", value: student.id },
            { label: "Department", value: student.department },
            { label: "Semester", value: student.semester },
            { label: "Email Address", value: student.email },
            { label: "Parent / Guardian", value: student.parentName },
            { label: "Parent Phone", value: student.parentPhone },
          ].map((f) => (
            <div key={f.label} className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">{f.label}</p>
              <p className="text-sm font-semibold text-white">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency contact */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Emergency Contacts</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-xs font-semibold text-red-400">University Emergency Line</p>
              <p className="text-sm font-bold text-red-300">{settings?.emergencyPhone || "03173509636"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <span className="text-xl">👨‍👩‍👧</span>
            <div>
              <p className="text-xs font-semibold text-blue-400">Parent / Guardian</p>
              <p className="text-sm font-bold text-blue-300">{student.parentPhone} — {student.parentName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <RippleButton variant="primary" className="flex-1" onClick={() => setEditing(true)}>Update Profile</RippleButton>
        <RippleButton variant="outline" className="flex-1" onClick={() => alert("Change password not implemented.")}>Change Password</RippleButton>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Update Profile">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Name</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Phone</label>
            <input className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
          </div>
          <div className="flex gap-3 pt-4">
            <RippleButton type="submit" variant="primary" className="flex-1">Save Changes</RippleButton>
            <RippleButton type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</RippleButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
