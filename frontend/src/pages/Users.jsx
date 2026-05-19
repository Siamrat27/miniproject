import { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', username: '', password: '', role: 'user' };

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [modalError, setModalError] = useState('');

  const load = () =>
    usersAPI.list().then((res) => {
      setUsers(res.data.data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalError('');
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, username: u.username, password: '', role: u.role });
    setModalError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await usersAPI.update(editing.id, payload);
      } else {
        await usersAPI.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setModalError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await usersAPI.remove(id);
    setDeleteConfirm(null);
    load();
  };

  if (loading) return <div className="page-loading">กำลังโหลด...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">จัดการผู้ใช้</h2>
          <p className="page-sub">ผู้ใช้ทั้งหมดในระบบ ({users.length} คน)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มผู้ใช้</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>Username</th>
              <th>Role</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">
                  {u.name}
                  {u.id === currentUser.id && (
                    <span className="self-tag">คุณ</span>
                  )}
                </td>
                <td><span className="sku-tag">{u.username}</span></td>
                <td>
                  <span className={`role-pill role-${u.role}`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                </td>
                <td>
                  <div className="action-group">
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)}>แก้ไข</button>
                    {u.id !== currentUser.id && (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(u)}>ลบ</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSave} className="modal-body">
            {modalError && <div className="alert alert-error">{modalError}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>ชื่อแสดง *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                  required
                />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="ชื่อผู้ใช้สำหรับ login"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{editing ? 'รหัสผ่านใหม่ (เว้นว่างเพื่อคงเดิม)' : 'รหัสผ่าน *'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? 'เว้นว่างเพื่อไม่เปลี่ยน' : 'รหัสผ่าน'}
                  required={!editing}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">User (ดูอย่างเดียว)</option>
                  <option value="admin">Admin (จัดการได้)</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeleteConfirm(null)}>
          <div className="modal-body">
            <p>ต้องการลบผู้ใช้ <strong>{deleteConfirm.name}</strong> (@{deleteConfirm.username}) ใช่หรือไม่?</p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>ยกเลิก</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>ลบ</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Users;
