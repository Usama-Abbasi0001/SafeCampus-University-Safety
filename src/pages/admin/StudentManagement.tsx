import { useState, useEffect } from "react";
import { Student } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function StudentManagement() {
  const [search, setSearch] = useState("");
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleDelete = async (studentId: string) => {
    if (confirm("Are you sure you want to permanently delete this student?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/students/${studentId}`, { method: 'DELETE' });
        if (res.ok) {
          setStudentList(studentList.filter(s => s.id !== studentId));
        } else {
          alert("Failed to delete student");
        }
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/students")
      .then(res => res.json())
      .then(data => {
        // Sort students by ID so that 2k22-cs-01 comes before 2k22-cs-50
        const sorted = data.sort((a: Student, b: Student) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
        setStudentList(sorted);
      })
      .catch(err => console.error("Failed to fetch students:", err));
  }, []);

  const filtered = studentList.filter((s) =>
    [s.id, s.name, s.department, s.semester, s.parentName].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, name, department…"
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <RippleButton variant="primary" size="md" onClick={() => setAddModal(true)}>
          + Add Student
        </RippleButton>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">{filtered.length} students</span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Active
            <span className="w-2 h-2 rounded-full bg-gray-400 ml-2" /> Inactive
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Photo", "Student ID", "Name", "Department", "Semester", "Parent Name", "Safety Status", "Status", "Action"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-3 py-1.5">
                    <img src={s.photo} alt={s.name} className="w-7 h-7 rounded-full object-cover bg-gray-200 ring-1 ring-gray-100" />
                  </td>
                  <td className="px-3 py-1.5 mono text-[11px] font-semibold text-blue-700 whitespace-nowrap">{s.id}</td>
                  <td className="px-3 py-1.5 text-xs font-medium text-gray-900 whitespace-nowrap">{s.name}</td>
                  <td className="px-3 py-1.5 text-[11px] text-gray-600 whitespace-nowrap">{s.department}</td>
                  <td className="px-3 py-1.5 text-[11px] text-gray-600 whitespace-nowrap">{s.semester}</td>
                  <td className="px-3 py-1.5 text-[11px] text-gray-600 whitespace-nowrap">{s.parentName}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap"><StatusBadge status={s.safetyStatus} size="sm" /></td>
                  <td className="px-3 py-1.5 whitespace-nowrap"><StatusBadge status={s.status} size="sm" /></td>
                  <td className="px-3 py-1.5 whitespace-nowrap relative">
                    <button 
                      className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                      onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                      onBlur={() => setTimeout(() => setMenuOpen(null), 150)}
                    >
                      ⋮
                    </button>
                    {menuOpen === s.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 shadow-xl rounded-lg w-36 z-50 py-1 flex flex-col overflow-hidden">
                        <button className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors" onMouseDown={() => { setViewStudent(s); setMenuOpen(null); }}>
                          View Student
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors" onMouseDown={() => { setEditStudent(s); setMenuOpen(null); }}>
                          Edit Student
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors" onMouseDown={() => { handleDelete(s.id); setMenuOpen(null); }}>
                          Delete Student
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Student">
        <StudentForm onClose={() => setAddModal(false)} onSubmit={async (newStudent) => {
          try {
            const res = await fetch("http://localhost:5000/api/students", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newStudent)
            });
            const savedStudent = await res.json();
            setStudentList([savedStudent, ...studentList]);
            setAddModal(false);
          } catch (err) {
            console.error("Failed to add student:", err);
          }
        }} />
      </Modal>

      {/* Edit Student Modal */}
      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        {editStudent && (
          <StudentForm 
            initialData={editStudent} 
            onClose={() => setEditStudent(null)} 
            onSubmit={(updated) => {
              setStudentList(studentList.map(s => s.id === editStudent.id ? { ...s, ...updated } : s));
              setEditStudent(null);
            }} 
          />
        )}
      </Modal>

      {/* View Student Modal */}
      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Detail">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={viewStudent.photo} alt={viewStudent.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewStudent.name}</h3>
                <p className="mono text-sm text-blue-600">{viewStudent.id}</p>
                <div className="flex gap-2 mt-1">
                  <StatusBadge status={viewStudent.status} size="sm" />
                  <StatusBadge status={viewStudent.safetyStatus} size="sm" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Department", viewStudent.department],
                ["Semester", viewStudent.semester],
                ["Email", viewStudent.email],
                ["Parent Name", viewStudent.parentName],
                ["Parent Phone", viewStudent.parentPhone],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <RippleButton variant="primary" className="flex-1" onClick={() => { alert(`Viewing incidents for ${viewStudent.name}`); setViewStudent(null); }}>View Incidents</RippleButton>
              <RippleButton variant="outline" className="flex-1" onClick={() => { setEditStudent(viewStudent); setViewStudent(null); }}>Edit Student</RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StudentForm({ initialData, onClose, onSubmit }: { initialData?: Student, onClose: () => void, onSubmit: (data: Partial<Student>) => void }) {
  const [formData, setFormData] = useState<Partial<Student>>(initialData || {});
  const [photoPreview, setPhotoPreview] = useState(initialData?.photo || "");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoPreview(url);
      setFormData({ ...formData, photo: url });
    }
  };

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Student ID", placeholder: "STU-2024-007", name: "id" },
          { label: "Full Name", placeholder: "Full name", name: "name" },
          { label: "Department", placeholder: "e.g. Computer Science", name: "department" },
          { label: "Semester", placeholder: "e.g. 4th", name: "semester" },
          { label: "Parent Name", placeholder: "Parent full name", name: "parentName" },
          { label: "Parent Phone", placeholder: "+92-300-0000000", name: "parentPhone" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
            <input
              name={f.name}
              placeholder={f.placeholder}
              value={(formData as any)[f.name] || ""}
              onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="student@university.edu.pk"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Student Photo</label>
        <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center flex flex-col items-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors relative overflow-hidden">
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mb-2" />
          ) : (
            <span className="text-2xl block mb-2">📷</span>
          )}
          <p className="text-sm text-gray-500">{photoPreview ? "Change photo" : "Click to upload photo"}</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <RippleButton type="submit" variant="primary" className="flex-1">{initialData ? "Save Changes" : "Add Student"}</RippleButton>
        <RippleButton type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</RippleButton>
      </div>
    </form>
  );
}
