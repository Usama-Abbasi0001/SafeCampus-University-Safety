import { useState, useEffect } from "react";
import { Student } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const data = await res.json();
        const sorted = (data || []).sort((a: Student, b: Student) =>
          a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: "base" })
        );
        setStudentList(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (studentId: string) => {
    if (confirm(`Are you sure you want to permanently delete student ${studentId}?`)) {
      try {
        const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
        if (res.ok) {
          setStudentList(studentList.filter((s) => s.id !== studentId));
        } else {
          alert("Failed to delete student");
        }
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
  };

  const filtered = studentList.filter((s) =>
    [s.id, s.name, s.department, s.semester, s.parentName, s.phone, s.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Student Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Enrolled students directory, campus verification status, and safety monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RippleButton variant="outline" size="sm" onClick={fetchStudents} className="text-xs">
            🔄 Refresh
          </RippleButton>
          <RippleButton variant="primary" size="md" onClick={() => setAddModal(true)} className="bg-blue-600 hover:bg-blue-500">
            + Add Student
          </RippleButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by ID, name, department, semester..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* Table Container */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 overflow-visible">
        <div className="px-5 py-3.5 border-b border-slate-700/50 bg-slate-800/90 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Active Student Records</span>
            <span className="text-xs text-slate-400">({filtered.length} enrolled)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Inactive</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading student directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <span className="text-3xl block mb-2">🎓</span>
            <p className="font-medium text-white">No student records found</p>
            <p className="text-xs text-slate-500 mt-1">Click "+ Add Student" to register a new student.</p>
          </div>
        ) : (
          <div className="overflow-visible sm:overflow-x-auto pb-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-800/95 border-b border-slate-700/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Department / Class</th>
                  <th className="px-4 py-3">Semester / Grade</th>
                  <th className="px-4 py-3">Contact Phone</th>
                  <th className="px-4 py-3">Parent / Guardian</th>
                  <th className="px-4 py-3">Guardian Phone</th>
                  <th className="px-4 py-3">Safety Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <img
                        src={s.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                        alt={s.name}
                        className="w-9 h-9 rounded-full object-cover bg-slate-700 ring-2 ring-slate-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-400 whitespace-nowrap">
                      {s.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                      {s.department || "Computer Science"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                      {s.semester || "8th"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                      {s.phone || s.parentPhone || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                      {s.parentName || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {s.parentPhone || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={s.safetyStatus || "Safe"} size="sm" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={s.status || "Active"} size="sm" />
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
                          onClick={() => handleDelete(s.id)}
                          className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Student">
        <StudentForm
          onClose={() => setAddModal(false)}
          onSubmit={async (formData) => {
            try {
              const res = await fetch("/api/students", {
                method: "POST",
                body: formData,
              });
              if (res.ok) {
                const savedStudent = await res.json();
                setStudentList([savedStudent, ...studentList]);
                setAddModal(false);
              } else {
                alert("Failed to add student");
              }
            } catch (err) {
              console.error("Failed to add student:", err);
            }
          }}
        />
      </Modal>

      {/* Edit Student Modal */}
      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        {editStudent && (
          <StudentForm
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
                  setStudentList(studentList.map((s) => (s.id === editStudent.id ? { ...s, ...updated } : s)));
                  setEditStudent(null);
                }
              } catch (err) {
                console.error("Failed to update student", err);
              }
            }}
          />
        )}
      </Modal>

      {/* View Student Modal */}
      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Profile Details">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <img
                src={viewStudent.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                alt={viewStudent.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-500/50 bg-slate-800"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{viewStudent.name}</h3>
                <p className="font-mono text-sm text-blue-400 font-semibold">{viewStudent.id}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={viewStudent.status || "Active"} size="sm" />
                  <StatusBadge status={viewStudent.safetyStatus || "Safe"} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Department / Class</p>
                <p className="text-sm font-medium text-white">{viewStudent.department || "Computer Science"}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Semester / Grade</p>
                <p className="text-sm font-medium text-white">{viewStudent.semester || "8th"}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Contact Phone</p>
                <p className="text-sm font-medium text-white">{viewStudent.phone || viewStudent.parentPhone || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Email Address</p>
                <p className="text-sm font-medium text-white">{viewStudent.email || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Parent / Guardian Name</p>
                <p className="text-sm font-medium text-white">{viewStudent.parentName || "Not Provided"}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Guardian Contact Phone</p>
                <p className="text-sm font-medium text-white">{viewStudent.parentPhone || "Not Provided"}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <RippleButton
                variant="primary"
                className="flex-1 bg-blue-600 hover:bg-blue-500"
                onClick={() => {
                  setEditStudent(viewStudent);
                  setViewStudent(null);
                }}
              >
                ✏️ Edit Student
              </RippleButton>
              <RippleButton variant="outline" className="flex-1" onClick={() => setViewStudent(null)}>
                Close
              </RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StudentForm({
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
    semester: "8th Semester",
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
      if (v !== undefined) data.append(k, String(v));
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
            placeholder="e.g. 2k22-cs-46"
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
            placeholder="e.g. 8th Semester"
            value={formData.semester || ""}
            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Student Contact Phone</label>
          <input
            name="phone"
            placeholder="03363437354"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="student@gmail.com"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          <label className="block text-xs font-semibold text-slate-400 mb-1">Guardian Contact Phone</label>
          <input
            name="parentPhone"
            placeholder="0336 3437354"
            value={formData.parentPhone || ""}
            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
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
