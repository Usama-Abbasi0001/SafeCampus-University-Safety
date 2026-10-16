import React, { useState, useEffect } from "react";
import { Student, Parent } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function StudentsAndParents() {
  const [activeTab, setActiveTab] = useState<"students" | "parents">("parents");

  // --- Students State ---
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [studentMenuOpen, setStudentMenuOpen] = useState<string | null>(null);

  // --- Parents State ---
  const [parentList, setParentList] = useState<Parent[]>([]);
  const [parentSearch, setParentSearch] = useState("");
  const [parentLoading, setParentLoading] = useState(true);
  const [parentError, setParentError] = useState("");
  const [addParentModal, setAddParentModal] = useState(false);
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [viewParent, setViewParent] = useState<Parent | null>(null);
  const [parentMenuOpen, setParentMenuOpen] = useState<string | null>(null);

  // Sensitive CNIC visibility toggle for Admin
  const [showSensitiveCnic, setShowSensitiveCnic] = useState<Record<string, boolean>>({});

  const toggleCnicVisibility = (id: string) => {
    setShowSensitiveCnic(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCnic = (cnic?: string, id?: string) => {
    if (!cnic || cnic.trim() === "") return <span className="text-slate-500 italic">Not Provided</span>;
    const isVisible = id ? showSensitiveCnic[id] : false;
    if (isVisible) {
      return <span className="font-mono text-emerald-400 font-semibold">{cnic}</span>;
    }
    // Mask sensitive CNIC: e.g. 42101-*******-1
    if (cnic.length >= 8) {
      const start = cnic.slice(0, 5);
      const end = cnic.slice(-1);
      return <span className="font-mono text-slate-300">{start}-*******-{end}</span>;
    }
    return <span className="font-mono text-slate-300">•••••••••••••</span>;
  };

  // --- Fetch Students ---
  const fetchStudents = async () => {
    setStudentLoading(true);
    setStudentError("");
    try {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      const sorted = (data || []).sort((a: Student, b: Student) =>
        a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" })
      );
      setStudentList(sorted);
    } catch (err: any) {
      setStudentError(err.message || "Could not retrieve student records");
    } finally {
      setStudentLoading(false);
    }
  };

  // --- Fetch Parents ---
  const fetchParents = async () => {
    setParentLoading(true);
    setParentError("");
    try {
      const res = await fetch("/api/parents");
      if (!res.ok) throw new Error("Failed to load parents");
      const data = await res.json();
      setParentList(data || []);
    } catch (err: any) {
      setParentError(err.message || "Could not retrieve parent records");
    } finally {
      setParentLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchParents();
  }, []);

  // --- Student Delete ---
  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete student [${studentId}]?`)) return;
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (res.ok) {
        setStudentList(prev => prev.filter(s => s.id !== studentId));
      } else {
        alert("Failed to delete student from database");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Network error while deleting student");
    }
  };

  // --- Parent Delete ---
  const handleDeleteParent = async (parentId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this parent account?")) return;
    try {
      const res = await fetch(`/api/parents/${parentId}`, { method: "DELETE" });
      if (res.ok) {
        setParentList(prev => prev.filter(p => (p.id || p._id) !== parentId));
      } else {
        alert("Failed to delete parent from database");
      }
    } catch (err) {
      console.error("Error deleting parent:", err);
      alert("Network error while deleting parent");
    }
  };

  // Filtered queries
  const filteredStudents = studentList.filter((s) =>
    [s.id, s.name, s.department, s.semester, s.parentName, s.phone, s.cnic, s.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(studentSearch.toLowerCase())
  );

  const filteredParents = parentList.filter((p) =>
    [p.id, p._id, p.name, p.email, p.phone, p.cnic, p.address, p.linkedStudentName, p.linkedStudentId]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(parentSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Top Banner & Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold">
              👥
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Students & Parents Management
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized directory of student enrollment, verified parent profiles, and guardian linkages
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab("parents")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "parents"
                ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <span>👨‍👩‍👧</span>
            <span>Parents</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "parents" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
              {parentList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === "students"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <span>🎓</span>
            <span>Students</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "students" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
              {studentList.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARENTS MANAGEMENT TABLE                                           */}
      {/* ========================================================================= */}
      {activeTab === "parents" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                placeholder="Search parents by name, email, phone, CNIC, child..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <RippleButton
                variant="outline"
                size="md"
                onClick={fetchParents}
                className="text-xs"
              >
                🔄 Refresh
              </RippleButton>
              <RippleButton
                variant="primary"
                size="md"
                onClick={() => setAddParentModal(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white font-medium"
              >
                + Add Parent
              </RippleButton>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 overflow-visible">
            <div className="px-5 py-3.5 border-b border-slate-700/50 bg-slate-800/90 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Registered Parents</span>
                <span className="text-xs text-slate-400">({filteredParents.length} shown)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Inactive</span>
              </div>
            </div>

            {parentLoading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading parent directory from database...</p>
              </div>
            ) : parentError ? (
              <div className="p-8 text-center bg-red-900/20 text-red-300 rounded-b-2xl">
                <p className="font-semibold text-sm mb-2">⚠️ {parentError}</p>
                <RippleButton size="sm" variant="outline" onClick={fetchParents}>Try Again</RippleButton>
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="text-3xl block mb-2">👨‍👩‍👧</span>
                <p className="font-medium text-white">No parent records found</p>
                <p className="text-xs text-slate-500 mt-1">Try refining your search filter or click "+ Add Parent".</p>
              </div>
            ) : (
              <div className="overflow-visible sm:overflow-x-auto pb-28">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-800/95 border-b border-slate-700/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">Photo</th>
                      <th className="px-4 py-3">Parent ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Phone Number</th>
                      <th className="px-4 py-3">CNIC Number</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">Linked Child / Student</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3">Registration Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {filteredParents.map((p) => {
                      const pId = p.id || p._id || "N/A";
                      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Earlier";
                      return (
                        <tr key={pId} className="hover:bg-slate-700/40 transition-colors">
                          <td className="px-4 py-3">
                            <img
                              src={p.profilePicture || p.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover bg-slate-700 ring-2 ring-slate-600"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-teal-400 whitespace-nowrap">
                            {String(pId).slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                            {p.phone || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {formatCnic(p.cnic, pId)}
                              {p.cnic && (
                                <button
                                  type="button"
                                  onClick={() => toggleCnicVisibility(pId)}
                                  className="text-xs text-slate-400 hover:text-white px-1"
                                  title={showSensitiveCnic[pId] ? "Hide CNIC" : "View CNIC (Authorized Admin)"}
                                >
                                  {showSensitiveCnic[pId] ? "👁️‍🗨️" : "👁️"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                            {p.email}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-[150px] truncate" title={p.address}>
                            {p.address || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {p.linkedStudentName ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-white">{p.linkedStudentName}</span>
                                <span className="font-mono text-[11px] text-blue-400">{p.linkedStudentId || p.childStudentId}</span>
                              </div>
                            ) : p.childStudentId ? (
                              <span className="font-mono text-xs text-blue-400 font-semibold">{p.childStudentId}</span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Unlinked</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={p.status || "Active"} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap relative">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewParent(p)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setEditParent(p)}
                                className="px-2.5 py-1 text-xs font-medium text-teal-300 hover:text-white bg-teal-500/10 hover:bg-teal-500/20 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteParent(pId)}
                                className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STUDENTS MANAGEMENT TABLE                                          */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by ID, name, class/grade, parent, CNIC..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <RippleButton
                variant="outline"
                size="md"
                onClick={fetchStudents}
                className="text-xs"
              >
                🔄 Refresh
              </RippleButton>
              <RippleButton
                variant="primary"
                size="md"
                onClick={() => setAddStudentModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                + Add Student
              </RippleButton>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 overflow-visible">
            <div className="px-5 py-3.5 border-b border-slate-700/50 bg-slate-800/90 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Registered Students</span>
                <span className="text-xs text-slate-400">({filteredStudents.length} shown)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Inactive</span>
              </div>
            </div>

            {studentLoading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading student directory from database...</p>
              </div>
            ) : studentError ? (
              <div className="p-8 text-center bg-red-900/20 text-red-300 rounded-b-2xl">
                <p className="font-semibold text-sm mb-2">⚠️ {studentError}</p>
                <RippleButton size="sm" variant="outline" onClick={fetchStudents}>Try Again</RippleButton>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="text-3xl block mb-2">🎓</span>
                <p className="font-medium text-white">No student records found</p>
                <p className="text-xs text-slate-500 mt-1">Try refining your search filter or click "+ Add Student".</p>
              </div>
            ) : (
              <div className="overflow-visible sm:overflow-x-auto pb-28">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-800/95 border-b border-slate-700/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3">Photo</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Phone Number</th>
                      <th className="px-4 py-3">CNIC / B-Form</th>
                      <th className="px-4 py-3">Class / Grade</th>
                      <th className="px-4 py-3">Parent / Guardian Name</th>
                      <th className="px-4 py-3">Parent Contact</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3">Registration Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {filteredStudents.map((s) => {
                      const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Earlier";
                      return (
                        <tr key={s.id} className="hover:bg-slate-700/40 transition-colors">
                          <td className="px-4 py-3">
                            <img
                              src={s.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                              alt={s.name}
                              className="w-8 h-8 rounded-full object-cover bg-slate-700 ring-2 ring-slate-600"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-400 whitespace-nowrap">
                            {s.id}
                          </td>
                          <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                            {s.name}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                            {s.phone || s.parentPhone || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {formatCnic(s.cnic, s.id)}
                              {s.cnic && (
                                <button
                                  type="button"
                                  onClick={() => toggleCnicVisibility(s.id)}
                                  className="text-xs text-slate-400 hover:text-white px-1"
                                  title={showSensitiveCnic[s.id] ? "Hide CNIC" : "View CNIC (Authorized Admin)"}
                                >
                                  {showSensitiveCnic[s.id] ? "👁️‍🗨️" : "👁️"}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                            <span className="font-medium text-white">{s.department || "Computer Science"}</span>
                            <span className="text-slate-500 ml-1">({s.semester || "8th"})</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                            {s.parentName || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {s.parentPhone || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={s.status || "Active"} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewStudent(s)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => setEditStudent(s)}
                                className="px-2.5 py-1 text-xs font-medium text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id)}
                                className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ADD STUDENT                                                       */}
      {/* ========================================================================= */}
      <Modal open={addStudentModal} onClose={() => setAddStudentModal(false)} title="Add New Student">
        <StudentUnifiedForm
          onClose={() => setAddStudentModal(false)}
          onSubmit={async (formData) => {
            try {
              const res = await fetch("/api/students", {
                method: "POST",
                body: formData,
              });
              if (res.ok) {
                const saved = await res.json();
                setStudentList(prev => [saved, ...prev]);
                setAddStudentModal(false);
              } else {
                const errData = await res.json();
                alert(errData.message || "Failed to add student");
              }
            } catch (err) {
              console.error(err);
              alert("Network error while adding student");
            }
          }}
        />
      </Modal>

      {/* MODAL: EDIT STUDENT */}
      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        {editStudent && (
          <StudentUnifiedForm
            initialData={editStudent}
            onClose={() => setEditStudent(null)}
            onSubmit={async (formData) => {
              try {
                const res = await fetch(`/api/students/${editStudent.id}`, {
                  method: "PUT",
                  body: formData,
                });
                if (res.ok) {
                  const updated = await res.json();
                  setStudentList(prev => prev.map(s => s.id === editStudent.id ? { ...s, ...updated } : s));
                  setEditStudent(null);
                } else {
                  alert("Failed to update student");
                }
              } catch (err) {
                console.error(err);
                alert("Network error while updating student");
              }
            }}
          />
        )}
      </Modal>

      {/* MODAL: VIEW STUDENT */}
      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Profile & Record">
        {viewStudent && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <img
                src={viewStudent.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                alt={viewStudent.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/50 bg-slate-800"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{viewStudent.name}</h3>
                <p className="font-mono text-sm text-blue-400 font-semibold">{viewStudent.id}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={viewStudent.status || "Active"} size="sm" />
                  <StatusBadge status={viewStudent.safetyStatus || "Safe"} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Class / Grade (Dept)</p>
                <p className="font-medium text-white">{viewStudent.department || "Computer Science"}</p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Current Semester</p>
                <p className="font-medium text-white">{viewStudent.semester || "8th"}</p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Student Phone</p>
                <p className="font-medium text-white">{viewStudent.phone || viewStudent.parentPhone || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">CNIC / B-Form Number</p>
                <p className="font-medium text-emerald-400">{viewStudent.cnic || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Parent / Guardian Name</p>
                <p className="font-medium text-white">{viewStudent.parentName || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Parent Contact Number</p>
                <p className="font-medium text-white">{viewStudent.parentPhone || "Not Provided"}</p>
              </div>
              <div className="col-span-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Email Address</p>
                <p className="font-medium text-white">{viewStudent.email || "Not Provided"}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <RippleButton
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setEditStudent(viewStudent);
                  setViewStudent(null);
                }}
              >
                ✏️ Edit Student
              </RippleButton>
              <RippleButton
                variant="outline"
                className="flex-1"
                onClick={() => setViewStudent(null)}
              >
                Close
              </RippleButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODALS: ADD PARENT                                                        */}
      {/* ========================================================================= */}
      <Modal open={addParentModal} onClose={() => setAddParentModal(false)} title="Add New Parent Account">
        <ParentUnifiedForm
          onClose={() => setAddParentModal(false)}
          onSubmit={async (formData) => {
            try {
              const res = await fetch("/api/parents", {
                method: "POST",
                body: formData,
              });
              if (res.ok) {
                const saved = await res.json();
                setParentList(prev => [saved, ...prev]);
                setAddParentModal(false);
              } else {
                const errData = await res.json();
                alert(errData.message || "Failed to add parent account");
              }
            } catch (err) {
              console.error(err);
              alert("Network error while adding parent");
            }
          }}
        />
      </Modal>

      {/* MODAL: EDIT PARENT */}
      <Modal open={!!editParent} onClose={() => setEditParent(null)} title="Edit Parent Details">
        {editParent && (
          <ParentUnifiedForm
            initialData={editParent}
            onClose={() => setEditParent(null)}
            onSubmit={async (formData) => {
              const pId = editParent.id || editParent._id;
              try {
                const res = await fetch(`/api/parents/${pId}`, {
                  method: "PUT",
                  body: formData,
                });
                if (res.ok) {
                  const updated = await res.json();
                  setParentList(prev => prev.map(p => (p.id || p._id) === pId ? { ...p, ...updated } : p));
                  setEditParent(null);
                } else {
                  alert("Failed to update parent details");
                }
              } catch (err) {
                console.error(err);
                alert("Network error while updating parent");
              }
            }}
          />
        )}
      </Modal>

      {/* MODAL: VIEW PARENT */}
      <Modal open={!!viewParent} onClose={() => setViewParent(null)} title="Parent Record & Linked Student">
        {viewParent && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <img
                src={viewParent.profilePicture || viewParent.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={viewParent.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-500/50 bg-slate-800"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{viewParent.name}</h3>
                <p className="text-xs text-slate-400">{viewParent.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={viewParent.status || "Active"} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Phone Number</p>
                <p className="font-medium text-white">{viewParent.phone || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">CNIC Number</p>
                <p className="font-medium text-emerald-400">{viewParent.cnic || "Not Provided"}</p>
              </div>
              <div className="col-span-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-slate-500 uppercase tracking-wider font-semibold mb-1">Residential Address</p>
                <p className="font-medium text-white">{viewParent.address || "Not Provided"}</p>
              </div>
              <div className="col-span-2 bg-teal-950/30 p-3.5 rounded-lg border border-teal-800/40 flex items-center justify-between">
                <div>
                  <p className="text-teal-400 uppercase tracking-wider font-semibold text-[10px]">Linked Child / Student</p>
                  <p className="text-sm font-bold text-white mt-0.5">{viewParent.linkedStudentName || "Enrolled Student"}</p>
                  <p className="font-mono text-xs text-blue-400 mt-0.5">{viewParent.linkedStudentId || viewParent.childStudentId}</p>
                </div>
                {viewParent.studentSafetyStatus && (
                  <StatusBadge status={viewParent.studentSafetyStatus} size="sm" />
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <RippleButton
                variant="primary"
                className="flex-1 bg-teal-600 hover:bg-teal-500"
                onClick={() => {
                  setEditParent(viewParent);
                  setViewParent(null);
                }}
              >
                ✏️ Edit Parent
              </RippleButton>
              <RippleButton
                variant="outline"
                className="flex-1"
                onClick={() => setViewParent(null)}
              >
                Close
              </RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// =============================================================================
// STUDENT UNIFIED FORM
// =============================================================================
function StudentUnifiedForm({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData?: Student;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}) {
  const [formData, setFormData] = useState<Partial<Student>>(initialData || {
    department: "Computer Science",
    semester: "8th",
    status: "Active",
    safetyStatus: "Safe",
  });
  const [photoPreview, setPhotoPreview] = useState(initialData?.photo || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoPreview(url);
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== undefined && v !== null) data.append(k, String(v));
    });
    if (photoFile) {
      data.append("profilePicture", photoFile);
    }
    onSubmit(data);
  };

  return (
    <form className="space-y-4 max-h-[75vh] overflow-y-auto px-1" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Student ID / Roll No *</label>
          <input
            required
            name="id"
            placeholder="e.g. 2K22-CS-01"
            value={formData.id || ""}
            disabled={!!initialData}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
          <input
            required
            name="name"
            placeholder="Student's full name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Department / Class</label>
          <input
            name="department"
            placeholder="e.g. Computer Science"
            value={formData.department || ""}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Current Semester / Grade</label>
          <input
            name="semester"
            placeholder="e.g. 8th"
            value={formData.semester || ""}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Student Phone Number</label>
          <input
            name="phone"
            placeholder="+92 300 1234567"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">CNIC / B-Form Number</label>
          <input
            name="cnic"
            placeholder="42101-1234567-1"
            value={formData.cnic || ""}
            onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Parent / Guardian Name</label>
          <input
            name="parentName"
            placeholder="Guardian's name"
            value={formData.parentName || ""}
            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Parent / Guardian Contact</label>
          <input
            name="parentPhone"
            placeholder="+92 311 0000000"
            value={formData.parentPhone || ""}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="student@university.edu"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Account Status</label>
          <select
            value={formData.status || "Active"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Safety Status</label>
          <select
            value={formData.safetyStatus || "Safe"}
            onChange={(e) => setFormData({ ...formData, safetyStatus: e.target.value as any })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Safe">Safe</option>
            <option value="Alert">Alert</option>
            <option value="Incident Under Review">Incident Under Review</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Student Photo / AI Profile</label>
        <label className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center flex flex-col items-center cursor-pointer hover:border-blue-500 hover:bg-slate-900/50 transition-colors relative overflow-hidden">
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mb-1" />
          ) : (
            <span className="text-2xl block mb-1">📷</span>
          )}
          <p className="text-xs text-slate-300 font-medium">{photoPreview ? "Change Photo" : "Upload Reference Photo"}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">JPG or PNG image</p>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <RippleButton type="submit" variant="primary" className="flex-1 bg-blue-600 hover:bg-blue-500">
          {initialData ? "Save Changes" : "Register Student"}
        </RippleButton>
        <RippleButton type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </RippleButton>
      </div>
    </form>
  );
}

// =============================================================================
// PARENT UNIFIED FORM
// =============================================================================
function ParentUnifiedForm({
  initialData,
  onClose,
  onSubmit,
}: {
  initialData?: Parent;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}) {
  const [formData, setFormData] = useState<Partial<Parent>>(initialData || {
    status: "Active",
  });
  const [photoPreview, setPhotoPreview] = useState(initialData?.profilePicture || initialData?.photo || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoPreview(url);
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== undefined && v !== null) data.append(k, String(v));
    });
    if (photoFile) {
      data.append("profilePicture", photoFile);
    }
    onSubmit(data);
  };

  return (
    <form className="space-y-4 max-h-[75vh] overflow-y-auto px-1" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
          <input
            required
            name="name"
            placeholder="Parent's full name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number *</label>
          <input
            required
            name="phone"
            placeholder="+92 321 0000000"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">CNIC Number *</label>
          <input
            name="cnic"
            placeholder="42101-1234567-1"
            value={formData.cnic || ""}
            onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address *</label>
          <input
            required
            type="email"
            name="email"
            placeholder="parent@gmail.com"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Linked Child / Student Registration Number *</label>
          <input
            required
            name="linkedStudentId"
            placeholder="e.g. 2K22-CS-01"
            value={formData.linkedStudentId || formData.childStudentId || ""}
            onChange={(e) => setFormData({ ...formData, linkedStudentId: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">Must match an existing student ID in the database.</p>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Residential Address *</label>
          <input
            required
            name="address"
            placeholder="House/Apartment, Street, City"
            value={formData.address || ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Account Status</label>
          <select
            value={formData.status || "Active"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Portal Password</label>
          <input
            type="password"
            name="password"
            placeholder={initialData ? "Leave blank to keep current" : "Set parent password"}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Profile Picture</label>
        <label className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center flex flex-col items-center cursor-pointer hover:border-teal-500 hover:bg-slate-900/50 transition-colors relative overflow-hidden">
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mb-1" />
          ) : (
            <span className="text-2xl block mb-1">📷</span>
          )}
          <p className="text-xs text-slate-300 font-medium">{photoPreview ? "Change Photo" : "Upload Photo"}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">JPG or PNG image</p>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <RippleButton type="submit" variant="primary" className="flex-1 bg-teal-600 hover:bg-teal-500">
          {initialData ? "Save Changes" : "Register Parent"}
        </RippleButton>
        <RippleButton type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </RippleButton>
      </div>
    </form>
  );
}
