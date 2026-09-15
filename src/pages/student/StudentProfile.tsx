import { useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";

export default function StudentProfile({ user }: { user: any }) {
  const student = user;
  const [editing, setEditing] = useState(false);

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in">
      {/* Photo + basic */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <img src={student.photo} alt={student.name} className="w-24 h-24 rounded-2xl object-cover bg-gray-100 ring-4 ring-blue-50" />
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md text-sm hover:bg-blue-700 transition-colors">
              ✏️
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>{student.name}</h2>
            <p className="mono text-sm text-blue-600 font-medium mt-0.5">{student.id}</p>
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
            <div key={f.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">{f.label}</p>
              <p className="text-sm font-semibold text-gray-800">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency contact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Emergency Contacts</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-xs font-semibold text-red-800">University Emergency Line</p>
              <p className="text-sm font-bold text-red-700">+92-51-9085000</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-xl">👨‍👩‍👧</span>
            <div>
              <p className="text-xs font-semibold text-blue-800">Parent / Guardian</p>
              <p className="text-sm font-bold text-blue-700">{student.parentPhone} — {student.parentName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <RippleButton variant="primary" className="flex-1">Update Profile</RippleButton>
        <RippleButton variant="outline" className="flex-1">Change Password</RippleButton>
      </div>
    </div>
  );
}
