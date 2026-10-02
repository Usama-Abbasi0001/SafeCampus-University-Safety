import { useState, useEffect } from "react";
import { Parent } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function ParentManagement() {
  const [search, setSearch] = useState("");
  const [parentList, setParentList] = useState<Parent[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [viewParent, setViewParent] = useState<Parent | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleDelete = async (parentId: string) => {
    if (confirm("Are you sure you want to permanently delete this parent?")) {
      try {
        const res = await fetch(`/api/parents/${parentId}`, { method: 'DELETE' });
        if (res.ok) {
          setParentList(parentList.filter(p => p.id !== parentId));
        } else {
          alert("Failed to delete parent");
        }
      } catch (err) {
        console.error("Error deleting parent:", err);
      }
    }
  };

  useEffect(() => {
    fetch("/api/parents")
      .then(res => res.json())
      .then(data => setParentList(data))
      .catch(err => console.error("Failed to fetch parents:", err));
  }, []);

  const filtered = parentList.filter((p) =>
    [p.id, p.name, p.email, p.phone, p.linkedStudentName].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, name, email…"
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <RippleButton variant="primary" size="md" onClick={() => setAddModal(true)}>
          + Add Parent
        </RippleButton>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-sm border border-slate-700/50 overflow-visible">
        <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/90 flex items-center justify-between rounded-t-xl">
          <span className="text-sm text-slate-400">{filtered.length} parents</span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Active
            <span className="w-2 h-2 rounded-full bg-slate-500 ml-2" /> Inactive
          </div>
        </div>
        <div className="overflow-visible sm:overflow-x-auto pb-32 rounded-b-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/90 border-b border-slate-700/50">
                {["Photo", "Parent ID", "Name", "Email", "Phone", "Linked Student", "Status", "Action"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-3 py-1.5">
                    <img src={p.profilePicture || p.photo || "https://via.placeholder.com/150"} alt={p.name} className="w-7 h-7 rounded-full object-cover bg-slate-700 ring-1 ring-slate-600" />
                  </td>
                  <td className="px-3 py-1.5 mono text-[11px] font-semibold text-blue-400 whitespace-nowrap">{p.id}</td>
                  <td className="px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap">{p.name}</td>
                  <td className="px-3 py-1.5 text-[11px] text-slate-400 whitespace-nowrap">{p.email}</td>
                  <td className="px-3 py-1.5 text-[11px] text-slate-400 whitespace-nowrap">{p.phone}</td>
                  <td className="px-3 py-1.5 text-[11px] text-slate-300 whitespace-nowrap font-medium">
                    {p.linkedStudentName ? `${p.linkedStudentName} (${p.linkedStudentId})` : "-"}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap"><StatusBadge status={(p as any).studentSafetyStatus || p.status} size="sm" /></td>
                  <td className="px-3 py-1.5 whitespace-nowrap relative">
                    <button 
                      className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700"
                      onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id!)}
                      onBlur={() => setTimeout(() => setMenuOpen(null), 150)}
                    >
                      ⋮
                    </button>
                    {menuOpen === p.id && (
                      <div className="absolute right-0 top-8 bg-slate-800 border border-slate-700 shadow-xl rounded-lg w-36 z-50 py-1 flex flex-col overflow-hidden">
                        <button className="block w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors" onMouseDown={() => { setViewParent(p); setMenuOpen(null); }}>
                          View Parent
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors" onMouseDown={() => { setEditParent(p); setMenuOpen(null); }}>
                          Edit Parent
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors" onMouseDown={() => { handleDelete(p.id!); setMenuOpen(null); }}>
                          Delete Parent
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

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Parent">
        <ParentForm onClose={() => setAddModal(false)} onSubmit={async (formData) => {
          try {
            const res = await fetch("/api/parents", {
              method: "POST",
              body: formData
            });
            if (res.ok) {
              const savedParent = await res.json();
              setParentList([savedParent, ...parentList]);
              setAddModal(false);
            } else {
              alert("Failed to add parent");
            }
          } catch (err) {
            console.error("Error:", err);
          }
        }} />
      </Modal>

      <Modal open={!!editParent} onClose={() => setEditParent(null)} title="Edit Parent">
        {editParent && (
          <ParentForm 
            initialData={editParent} 
            onClose={() => setEditParent(null)} 
            onSubmit={async (formData) => {
              try {
                const res = await fetch(`/api/parents/${editParent.id}`, {
                  method: "PUT",
                  body: formData
                });
                if (res.ok) {
                  const updated = await res.json();
                  setParentList(parentList.map(p => p.id === editParent.id ? { ...p, ...updated } : p));
                  setEditParent(null);
                }
              } catch (err) {
                console.error("Error updating parent", err);
              }
            }} 
          />
        )}
      </Modal>

      {/* View Parent Modal */}
      <Modal open={!!viewParent} onClose={() => setViewParent(null)} title="Parent Detail">
        {viewParent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={viewParent.profilePicture || viewParent.photo || "https://via.placeholder.com/150"} alt={viewParent.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-700" />
              <div>
                <h3 className="text-lg font-semibold text-white">{viewParent.name}</h3>
                <p className="mono text-sm text-blue-400">{viewParent.id}</p>
                <div className="mt-1">
                  <StatusBadge status={(viewParent as any).studentSafetyStatus || viewParent.status} size="sm" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Email", viewParent.email],
                ["Phone", viewParent.phone],
                ["Address", viewParent.address],
                ["Linked Student", viewParent.linkedStudentName],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{k}</p>
                  <p className="text-sm font-medium text-white">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <RippleButton variant="outline" className="flex-1" onClick={() => { setEditParent(viewParent); setViewParent(null); }}>Edit Parent</RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ParentForm({ initialData, onClose, onSubmit }: { initialData?: Partial<Parent>, onClose: () => void, onSubmit: (data: FormData) => void }) {
  const [formData, setFormData] = useState<Partial<Parent>>(initialData || {});
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Full Name", placeholder: "Parent full name", name: "name" },
          { label: "Email Address", placeholder: "parent@example.com", name: "email" },
          { label: "Phone Number", placeholder: "+92-300-0000000", name: "phone" },
          { label: "Address", placeholder: "Home address", name: "address" },
          { label: "Linked Student ID", placeholder: "STU-2024-001", name: "linkedStudentId" },
          { label: "Linked Student Name", placeholder: "Student full name", name: "linkedStudentName" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-xs font-semibold text-slate-400 mb-1">{f.label}</label>
            <input
              name={f.name}
              placeholder={f.placeholder}
              value={(formData as any)[f.name] || ""}
              onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Parent Photo</label>
        <label className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center flex flex-col items-center cursor-pointer hover:border-blue-500 hover:bg-slate-900/50 transition-colors relative overflow-hidden">
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mb-2" />
          ) : (
            <span className="text-2xl block mb-2">📷</span>
          )}
          <p className="text-sm text-slate-400">{photoPreview ? "Change photo" : "Click to upload photo"}</p>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <RippleButton type="submit" variant="primary" className="flex-1">{initialData ? "Save Changes" : "Add Parent"}</RippleButton>
        <RippleButton type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</RippleButton>
      </div>
    </form>
  );
}
