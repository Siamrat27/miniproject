import { useEffect, useState } from 'react';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Electronics', 'Office Supplies', 'Clothing', 'Food & Beverage', 'Tools', 'Other'];

const EMPTY_FORM = { name: '', sku: '', category: 'Electronics', price: '', unit: '', description: '' };

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

const Products = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () =>
    productsAPI.list().then((res) => {
      setProducts(res.data.data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, price: p.price, unit: p.unit, description: p.description || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await productsAPI.update(editing.id, { ...form, price: Number(form.price) });
      } else {
        await productsAPI.create({ ...form, price: Number(form.price) });
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await productsAPI.remove(id);
    setDeleteConfirm(null);
    load();
  };

  if (loading) return <div className="page-loading">กำลังโหลด...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">สินค้า</h2>
          <p className="page-sub">รายการสินค้าทั้งหมด ({products.length} รายการ)</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มสินค้า</button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>หมวดหมู่</th>
              <th>ราคา</th>
              <th>หน่วย</th>
              <th>คำอธิบาย</th>
              {isAdmin && <th>จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><span className="sku-tag">{p.sku}</span></td>
                <td className="font-medium">{p.name}</td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td>{Number(p.price).toLocaleString()} ฿</td>
                <td>{p.unit}</td>
                <td className="text-muted text-sm">{p.description || '-'}</td>
                {isAdmin && (
                  <td>
                    <div className="action-group">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>แก้ไข</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(p)}>ลบ</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>ชื่อสินค้า *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>หมวดหมู่</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ราคา (฿) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>หน่วย *</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="เช่น ชิ้น, กล่อง, รีม" required />
            </div>
            <div className="form-group">
              <label>คำอธิบาย</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeleteConfirm(null)}>
          <div className="modal-body">
            <p>ต้องการลบสินค้า <strong>{deleteConfirm.name}</strong> ใช่หรือไม่?</p>
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

export default Products;
