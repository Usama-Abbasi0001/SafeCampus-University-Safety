import { useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";

export default function ChildProfile({ user }: { user: any }) {
  const child = user?.linkedStudent || {};
  const [editing, setEditing] = useState(false);

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5 mb-6">
          <img src={child.photo} alt={child.name} className="w-24 h-24 rounded-2xl object-cover bg-gray-100 ring-4 ring-teal-50" />
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{child.name}</h2>
            <p className="mono text-sm text-blue-600 font-medium mt-0.5">{child.id}</p>
            <div className="flex gap-2 mt-2">
              <StatusBadge status={child.status} size="sm" />
              <StatusBadge status={child.safetyStatus} size="sm" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Full Name", child.name],
            ["Student ID", child.id],
            ["Department", child.department],
            ["Semester", child.semester],
            ["Email", child.email],
            ["Safety Status", child.safetyStatus],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">{k}</p>
              {k === "Safety Status" ? <StatusBadge status={v} size="sm" /> : <p className="text-sm font-semibold text-gray-800">{v}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl">ℹ️</span>
        <div>
          <p className="text-sm font-semibold text-teal-800">Your Access is Limited to Your Child</p>
          <p className="text-xs text-teal-600 mt-0.5">As a registered parent, you can only view safety and incident information for {child.name}. Contact the university for further assistance.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>University Contact</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <span>🚨</span>
            <div>
              <p className="text-xs font-semibold text-red-800">Emergency</p>
              <p className="text-sm font-bold text-red-700">+92-51-9085000</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span>📧</span>
            <div>
              <p className="text-xs font-semibold text-blue-800">Safety Office Email</p>
              <p className="text-sm font-bold text-blue-700">safety@nust.edu.pk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
