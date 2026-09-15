import { useState, useEffect } from "react";
import RippleButton from "../../components/RippleButton";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    aiThreshold: 75,
    emailNotifs: true,
    smsNotifs: true,
    autoConfirm: false,
    universityName: 'National University of Sciences & Technology',
    safetyOfficerEmail: 'safety@nust.edu.pk',
    emergencyPhone: '+92-51-9085000',
    safetyOfficer: 'Dr. Hina Shahid',
    adminName: 'Dr. Ahmad Raza',
    adminEmail: 'admin@nust.edu.pk'
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    }
    setIsSaving(false);
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-3xl">
      {/* System Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>System Configuration</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">AI Confidence Threshold</p>
              <p className="text-xs text-gray-500 mt-0.5">Minimum AI confidence to trigger an alert ({settings.aiThreshold}%)</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={50} max={99} value={settings.aiThreshold} onChange={(e) => handleChange("aiThreshold", Number(e.target.value))} className="w-32 accent-blue-600" />
              <span className="mono text-sm font-bold text-blue-700 w-10">{settings.aiThreshold}%</span>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-500 mt-0.5">Send email alerts for new incidents</p>
            </div>
            <Toggle checked={settings.emailNotifs} onChange={() => handleChange("emailNotifs", !settings.emailNotifs)} />
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
              <p className="text-xs text-gray-500 mt-0.5">Send SMS to parents on incident detection</p>
            </div>
            <Toggle checked={settings.smsNotifs} onChange={() => handleChange("smsNotifs", !settings.smsNotifs)} />
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-Confirm High Confidence</p>
              <p className="text-xs text-gray-500 mt-0.5">Auto-confirm incidents with AI confidence ≥95%</p>
            </div>
            <Toggle checked={settings.autoConfirm} onChange={() => handleChange("autoConfirm", !settings.autoConfirm)} />
          </div>
        </div>
      </div>

      {/* University Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>University Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "University Name", name: "universityName" },
              { label: "Safety Officer Email", name: "safetyOfficerEmail" },
              { label: "Emergency Phone", name: "emergencyPhone" },
              { label: "Safety Officer", name: "safetyOfficer" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                <input
                  value={(settings as any)[f.name] || ""}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>Admin Account</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Full Name", name: "adminName" },
              { label: "Email Address", name: "adminEmail" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                <input 
                  value={(settings as any)[f.name] || ""} 
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Change Password</label>
            <input type="password" placeholder="New password" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <RippleButton variant="primary" size="md" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </RippleButton>
        <RippleButton variant="outline" size="md">Reset Defaults</RippleButton>
      </div>
    </div>
  );
}
