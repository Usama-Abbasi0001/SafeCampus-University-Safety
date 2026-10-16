import { useState, useEffect } from "react";
import { Parent } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import RippleButton from "../../components/RippleButton";
import Modal from "../../components/Modal";

export default function ParentManagement() {
  const [search, setSearch] = useState("");
  const [parentList, setParentList] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [viewParent, setViewParent] = useState<Parent | null>(null);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parents");
      if (res.ok) {
        const data = await res.json();
        setParentList(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch parents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleDelete = async (parentId: string) => {
    if (confirm("Are you sure you want to permanently delete this parent account?")) {
      try {
        const res = await fetch(`/api/parents/${parentId}`, { method: "DELETE" });
        if (res.ok) {
          setParentList(parentList.filter((p) => (p.id || p._id) !== parentId));
        } else {
          alert("Failed to delete parent");
        }
      } catch (err) {
        console.error("Error deleting parent:", err);
      }
    }
  };

  const filtered = parentList.filter((p) =>
    [p.id, p._id, p.name, p.email, p.phone, p.address, p.linkedStudentName, p.linkedStudentId]
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
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-xl font-bold">
            👨‍👩‍👧
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Parent Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified parents and guardian directory linked with enrolled student records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RippleButton variant="outline" size="sm" onClick={fetchParents} className="text-xs">
            🔄 Refresh
          </RippleButton>
          <RippleButton variant="primary" size="md" onClick={() => setAddModal(true)} className="bg-teal-600 hover:bg-teal-500">
            + Add Parent
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
          placeholder="Search parents by name, email, phone, child..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />
      </div>

      {/* Table Container */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-700/50 overflow-visible">
        <div className="px-5 py-3.5 border-b border-slate-700/50 bg-slate-800/90 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Active Parent Accounts</span>
            <span className="text-xs text-slate-400">({filtered.length} registered)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> Inactive</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading parent directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <span className="text-3xl block mb-2">👨‍👩‍👧</span>
            <p className="font-medium text-white">No parent accounts found</p>
            <p className="text-xs text-slate-500 mt-1">Click "+ Add Parent" to register a parent account.</p>
          </div>
        ) : (
          <div className="overflow-visible sm:overflow-x-auto pb-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-800/95 border-b border-slate-700/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Parent ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Residential Address</th>
                  <th className="px-4 py-3">Linked Child / Student</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filtered.map((p) => {
                  const pId = p.id || p._id || "N/A";
                  return (
                    <tr key={pId} className="hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <img
                          src={p.profilePicture || p.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                          alt={p.name}
                          className="w-9 h-9 rounded-full object-cover bg-slate-700 ring-2 ring-slate-600"
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
                      <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                        {p.email}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px] truncate" title={p.address}>
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
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
                            onClick={() => handleDelete(pId)}
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

      {/* Add Parent Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Parent">
        <ParentForm
          onClose={() => setAddModal(false)}
          onSubmit={async (formData) => {
            try {
              const res = await fetch("/api/parents", {
                method: "POST",
                body: formData,
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
          }}
        />
      </Modal>

      {/* Edit Parent Modal */}
      <Modal open={!!editParent} onClose={() => setEditParent(null)} title="Edit Parent Details">
        {editParent && (
          <ParentForm
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
                  setParentList(parentList.map((p) => ((p.id || p._id) === pId ? { ...p, ...updated } : p)));
                  setEditParent(null);
                } else {
                  alert("Failed to update parent");
                }
              } catch (err) {
                console.error("Failed to update parent", err);
              }
            }}
          />
        )}
      </Modal>

      {/* View Parent Modal */}
      <Modal open={!!viewParent} onClose={() => setViewParent(null)} title="Parent Record & Linked Student">
        {viewParent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <img
                src={viewParent.profilePicture || viewParent.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={viewParent.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-teal-500/50 bg-slate-800"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{viewParent.name}</h3>
                <p className="text-xs text-slate-400">{viewParent.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={viewParent.status || "Active"} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Phone Number</p>
                <p className="text-sm font-medium text-white">{viewParent.phone || "Not Provided"}</p>
              </div>

              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Email Address</p>
                <p className="text-sm font-medium text-white">{viewParent.email || "Not Provided"}</p>
              </div>

              <div className="col-span-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Residential Address</p>
                <p className="text-sm font-medium text-white">{viewParent.address || "Not Provided"}</p>
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
              <RippleButton variant="outline" className="flex-1" onClick={() => setViewParent(null)}>
                Close
              </RippleButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ParentForm({
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
          <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
          <input
            required
            name="name"
            placeholder="Parent full name"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone *</label>
          <input
            required
            name="phone"
            placeholder="0336 3437354"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="col-span-2">
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
            placeholder="e.g. 2k22-cs-46"
            value={formData.linkedStudentId || formData.childStudentId || ""}
            onChange={(e) => setFormData({ ...formData, linkedStudentId: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Residential Address *</label>
          <input
            required
            name="address"
            placeholder="Hyderabad Dawood Mart"
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
            placeholder={initialData ? "Leave blank to keep current" : "Set password"}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Picture</label>
        <label className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center flex flex-col items-center cursor-pointer hover:border-teal-500 hover:bg-slate-900/50 transition-colors relative overflow-hidden">
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover mb-1" />
          ) : (
            <span className="text-2xl block mb-1">📷</span>
          )}
          <p className="text-xs text-slate-300 font-medium">{photoPreview ? "Change Photo" : "Upload Photo"}</p>
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
