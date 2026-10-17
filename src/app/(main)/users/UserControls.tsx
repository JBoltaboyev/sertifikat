"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveUser, deleteUser } from "./actions";

export default function UserControls({ users, faculties }: { users: any[], faculties: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "DEAN",
    facultyId: ""
  });

  const openModal = (user?: any) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        password: "", // Don't pre-fill password for security, typing updates it
        role: user.role || "DEAN",
        facultyId: user.facultyId || ""
      });
    } else {
      setEditingUserId(null);
      setFormData({
        fullName: "",
        username: "",
        password: "",
        role: "DEAN",
        facultyId: faculties[0]?.id || ""
      });
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === 'DEAN' && !formData.facultyId) {
      alert("Dekan uchun fakultet tanlash shart!");
      return;
    }

    const payload = { ...formData, id: editingUserId || undefined };
    const result = await saveUser(payload);
    
    if (result.success) {
      setIsModalOpen(false);
      router.refresh();
    } else {
      alert("Xatolik: " + result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu foydalanuvchini o'chirmoqchimisiz?")) return;
    
    const result = await deleteUser(id);
    if (result.success) {
      router.refresh();
    } else {
      alert("Xatolik: " + result.error);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Yangi Qo'shish
        </button>
      </div>

      <div className="card glass">
        <div className="card-body table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>№</th>
                <th>Ism Familiyasi</th>
                <th>Login (Username)</th>
                <th>Role</th>
                <th>Fakulteti</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: 500 }}>{user.fullName || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{user.username}</td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>
                      {user.role === 'ADMIN' ? 'Prorektor' : 'Dekan'}
                    </span>
                  </td>
                  <td>{user.faculty?.name || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => openModal(user)}>
                      Tahrirlash
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(user.id)}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card glass" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header flex justify-between items-center">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingUserId ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Ism familiyasi</label>
                  <input required type="text" className="input" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                
                <div className="input-group">
                  <label className="label">Rol (Prorektor yoki Dekan)</label>
                  <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="ADMIN">Prorektor (Admin)</option>
                    <option value="DEAN">Dekan</option>
                  </select>
                </div>

                {formData.role === 'DEAN' && (
                  <div className="input-group">
                    <label className="label">Fakulteti</label>
                    <select required className="input" value={formData.facultyId} onChange={e => setFormData({...formData, facultyId: e.target.value})}>
                      <option value="">Tanlang...</option>
                      {faculties.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label className="label">Login</label>
                  <input required type="text" className="input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>

                <div className="input-group">
                  <label className="label">{editingUserId ? "Yangi Parol (ixtiyoriy)" : "Parol"}</label>
                  <input 
                    type="password" 
                    className="input" 
                    required={!editingUserId} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
                  <button type="submit" className="btn btn-primary">Saqlash</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
