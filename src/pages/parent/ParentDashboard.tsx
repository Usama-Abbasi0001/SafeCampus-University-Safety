import { useState, useEffect } from "react";
import { Incident, Parent, Student } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";

export default function ParentDashboard({ onNavigate, user }: { onNavigate: (p: string) => void, user: any }) {
  const [parent, setParent] = useState<Parent>(user || {});
  const [child, setChild] = useState<Partial<Student>>(user?.linkedStudent || {});
  const [childIncidents, setChildIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const parentId = user?._id || user?.id;

  // Retrieve fresh parent and child record from database
  useEffect(() => {
    if (parentId) {
      setLoading(true);
      fetch(`/api/parents/${parentId}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: any) => {
          if (data) {
            setParent(data);
            if (data.linkedStudent) {
              setChild(data.linkedStudent);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [parentId]);

  // Retrieve child incidents
  const childId = child?.id || parent?.childStudentId || user?.childStudentId;
  useEffect(() => {
    if (childId) {
      fetch("/api/incidents")
        .then(r => r.json())
        .then((data: Incident[]) => {
          const cid = childId.toLowerCase();
          setChildIncidents(data.filter(i => {
            const vId = (i.victimId || (typeof i.victim === 'object' ? i.victim?.studentId : "") || "").toLowerCase();
            return vId === cid;
          }));
        })
        .catch(console.error);
    }
  }, [childId]);

  const hasAlert = childIncidents.some((i) => i.status === "Confirmed" || i.status === "New");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-3xl">
            👨‍👩‍👧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Welcome, {parent.name}
              </h2>
              <StatusBadge status={parent.status || "Active"} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Parent Guardian Portal — Real-time university safety monitoring for your child
            </p>
          </div>
        </div>

        <RippleButton
          variant="outline"
          size="sm"
          className="text-xs hidden sm:flex items-center gap-1.5"
          onClick={() => onNavigate("safety-status")}
        >
          <span>🛡️</span> Safety Status
        </RippleButton>
      </div>

      {/* Harassment alert card (prominent if active) */}
      {hasAlert && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-6 shadow-xl border border-red-500/40">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-red-500/30 border border-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              🚨
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold bg-white text-red-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Urgent Harassment Alert
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Active Incident Notice Involving {child.name || "Your Child"}
              </h3>
              {childIncidents.filter((i) => i.status !== "Resolved").slice(0, 1).map((inc) => (
                <div key={inc.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-red-100 text-sm mb-4 bg-red-800/40 p-3.5 rounded-xl border border-red-400/20">
                  <div><span className="text-red-300 text-xs">Child Name:</span><br /><span className="text-white font-semibold">{child.name || "Enrolled Child"}</span></div>
                  <div><span className="text-red-300 text-xs">Incident Type:</span><br /><span className="text-white font-semibold">{inc.type}</span></div>
                  <div><span className="text-red-300 text-xs">Date & Time:</span><br /><span className="text-white font-semibold">{inc.date} ({inc.time})</span></div>
                  <div><span className="text-red-300 text-xs">Campus Location:</span><br /><span className="text-white font-semibold">{inc.location}</span></div>
                  <div><span className="text-red-300 text-xs">Verification Status:</span><br /><StatusBadge status={inc.status} size="sm" /></div>
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate("incidents")}
                  className="px-4 py-2 bg-white text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                >
                  View Full Incident Report
                </button>
                <button
                  onClick={() => alert("Connecting to University Safety Office: 03173509636")}
                  className="px-4 py-2 bg-red-900/60 text-white text-xs font-bold rounded-lg hover:bg-red-900 transition-colors border border-white/20"
                >
                  📞 Contact Safety Office
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Parent Personal Details & Linked Child Record */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parent Personal Profile Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={parent.profilePicture || parent.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                  alt={parent.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-500/50 bg-slate-800"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{parent.name}</h3>
                  <p className="text-xs text-teal-400 font-medium">Verified Parent Account</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ID: {String(parentId || "").slice(-6).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Email Address</p>
                <p className="text-slate-200 font-medium truncate" title={parent.email}>{parent.email || "N/A"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Contact Phone</p>
                <p className="text-slate-200 font-medium">{parent.phone || "N/A"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">CNIC Number</p>
                <p className="text-emerald-400 font-medium font-mono">{parent.cnic || "Verified on Record"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Account Status</p>
                <p className="text-slate-200 font-medium">{parent.status || "Active"}</p>
              </div>

              <div className="col-span-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Residential Address</p>
                <p className="text-slate-200 font-medium">{parent.address || "Address registered with University"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Child / Student Information Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={child.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                  alt={child.name || "Child"}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/50 bg-slate-800"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{child.name || "Enrolled Student"}</h3>
                  <p className="font-mono text-xs text-blue-400 font-semibold">{child.id || parent.childStudentId}</p>
                </div>
              </div>
              <StatusBadge status={child.safetyStatus || "Safe"} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Department / Class</p>
                <p className="text-slate-200 font-medium">{child.department || "Computer Science"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Current Semester / Grade</p>
                <p className="text-slate-200 font-medium">{child.semester || "8th"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Enrollment Status</p>
                <p className="text-slate-200 font-medium">{child.status || "Active"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Campus Safety Index</p>
                <p className="text-emerald-400 font-semibold">Verified Normal</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total recorded events: {childIncidents.length}</span>
            <button
              onClick={() => onNavigate("incidents")}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              View incident log →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Incidents", value: childIncidents.length, color: "text-white" },
          { label: "Active Review", value: childIncidents.filter((i) => i.status !== "Resolved" && i.status !== "Rejected").length, color: "text-amber-400" },
          { label: "Resolved / Closed", value: childIncidents.filter((i) => i.status === "Resolved").length, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-700/50 text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
