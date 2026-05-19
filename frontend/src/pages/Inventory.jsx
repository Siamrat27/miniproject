import { useEffect, useState } from 'react';
import { inventoryAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const WAREHOUSES = ['คลังหลัก', 'คลังสาขา A', 'คลังสาขา B', 'คลังสาขา C'];

const EMPTY_RECEIVE = { productId: '', warehouse: WAREHOUSES[0], quantity: '', minStock: '', note: '' };
const EMPTY_EDIT = { productId: '', productName: '', warehouse: WAREHOUSES[0], quantity: '', unit: '', minStock: '' };

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

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  const [receiveModal, setReceiveModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState(EMPTY_RECEIVE);
  const [receiveSaving, setReceiveSaving] = useState(false);
  const [receiveMsg, setReceiveMsg] = useState({ type: '', text: '' });

  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () =>
    Promise.all([inventoryAPI.list(), productsAPI.list()]).then(([inv, prod]) => {
      setInventory(inv.data.data);
      setProducts(prod.data.data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const warehouses = ['all', ...Array.from(new Set(inventory.map((i) => i.warehouse))).sort()];
  const filtered = warehouseFilter === 'all' ? inventory : inventory.filter((i) => i.warehouse === warehouseFilter);

  const openReceive = () => {
    setReceiveForm({ ...EMPTY_RECEIVE, productId: products[0]?.id || '' });
    setReceiveMsg({ type: '', text: '' });
    setReceiveModal(true);
  };

  const receiveProduct = products.find((p) => p.id === Number(receiveForm.productId));

  const handleReceive = async (e) => {
    e.preventDefault();
    setReceiveSaving(true);
    setReceiveMsg({ type: '', text: '' });
    try {
      await inventoryAPI.receive({
        productId: Number(receiveForm.productId),
        productName: receiveProduct?.name || '',
        warehouse: receiveForm.warehouse,
        quantity: Number(receiveForm.quantity),
        unit: receiveProduct?.unit || '',
        minStock: receiveForm.minStock !== '' ? Number(receiveForm.minStock) : undefined,
        note: receiveForm.note,
      });
      setReceiveMsg({ type: 'success', text: `นำเข้า "${receiveProduct?.name}" ${receiveForm.quantity} ${receiveProduct?.unit} → ${receiveForm.warehouse} สำเร็จ` });
      setReceiveForm({ ...EMPTY_RECEIVE, productId: products[0]?.id || '' });
      load();
    } catch (err) {
      setReceiveMsg({ type: 'error', text: err.response?.data?.error || 'เกิดข้อผิดพลาด' });
    } finally {
      setReceiveSaving(false);
    }
  };

  const openEdit = (item) => {
    setEditing(item);
    setEditForm({ productId: item.productId, productName: item.productName, warehouse: item.warehouse, quantity: item.quantity, unit: item.unit, minStock: item.minStock });
    setEditModal(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const payload = { ...editForm, productId: Number(editForm.productId), quantity: Number(editForm.quantity), minStock: Number(editForm.minStock) };
      await inventoryAPI.update(editing.id, payload);
      setEditModal(false);
      load();
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await inventoryAPI.remove(id);
    setDeleteConfirm(null);
    load();
  };

  const getStatus = (item) => {
    if (item.quantity === 0) return { label: 'หมดสต็อก', cls: 'badge-danger' };
    if (item.quantity < item.minStock) return { label: 'ใกล้หมด', cls: 'badge-warning' };
    return { label: 'ปกติ', cls: 'badge-success' };
  };

  if (loading) return <div className="page-loading">กำลังโหลด...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">คลังสินค้า</h2>
          <p className="page-sub">
            {warehouseFilter === 'all'
              ? `รายการสต็อกสินค้าทั้งหมด (${inventory.length} รายการ)`
              : `${warehouseFilter} (${filtered.length} รายการ)`}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openReceive}>+ นำเข้าสินค้า</button>
        )}
      </div>

      <div className="filter-tabs">
        {warehouses.map((w) => {
          const count = w === 'all' ? inventory.length : inventory.filter((i) => i.warehouse === w).length;
          return (
            <button
              key={w}
              className={`filter-tab${warehouseFilter === w ? ' active' : ''}`}
              onClick={() => setWarehouseFilter(w)}
            >
              {w === 'all' ? 'ทั้งหมด' : w}
              <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>คลัง</th>
              <th>คงเหลือ</th>
              <th>ขั้นต่ำ</th>
              <th>สถานะ</th>
              <th>อัปเดตล่าสุด</th>
              {isAdmin && <th>จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  ไม่มีรายการในคลังนี้
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const status = getStatus(item);
              return (
                <tr key={item.id}>
                  <td className="font-medium">{item.productName}</td>
                  <td>{item.warehouse}</td>
                  <td>
                    <span className={item.quantity < item.minStock ? 'text-danger font-medium' : ''}>
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td>{item.minStock} {item.unit}</td>
                  <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                  <td className="text-muted text-sm">{item.lastUpdated}</td>
                  {isAdmin && (
                    <td>
                      <div className="action-group">
                        <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)}>แก้ไข</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(item)}>ลบ</button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {receiveModal && (
        <Modal title="นำเข้าสินค้า" onClose={() => setReceiveModal(false)}>
          <form onSubmit={handleReceive} className="modal-body">
            {receiveMsg.text && (
              <div className={`alert alert-${receiveMsg.type === 'success' ? 'success' : 'error'}`}>
                {receiveMsg.text}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>คลังปลายทาง</label>
                <select value={receiveForm.warehouse} onChange={(e) => setReceiveForm({ ...receiveForm, warehouse: e.target.value })}>
                  {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>สินค้า *</label>
                <select value={receiveForm.productId} onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })} required>
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>จำนวนที่นำเข้า *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                  required
                  disabled={!receiveForm.productId}
                />
                {receiveProduct && <span className="form-hint">หน่วย: {receiveProduct.unit}</span>}
              </div>
              <div className="form-group">
                <label>จำนวนขั้นต่ำ <span className="text-muted">(ไม่บังคับ)</span></label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={receiveForm.minStock}
                  onChange={(e) => setReceiveForm({ ...receiveForm, minStock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label>หมายเหตุ</label>
              <input
                type="text"
                value={receiveForm.note}
                onChange={(e) => setReceiveForm({ ...receiveForm, note: e.target.value })}
                placeholder="แหล่งที่มา / เลขที่ใบ (ถ้ามี)"
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setReceiveModal(false)}>ปิด</button>
              <button type="submit" className="btn btn-primary" disabled={receiveSaving}>
                {receiveSaving ? 'กำลังนำเข้า...' : 'ยืนยันการนำเข้า'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editModal && (
        <Modal title="แก้ไขรายการคลัง" onClose={() => setEditModal(false)}>
          <form onSubmit={handleEditSave} className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>คลังสินค้า</label>
                <select value={editForm.warehouse} onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value })}>
                  {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>หน่วย</label>
                <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>จำนวนคงเหลือ (แก้ไขตรง)</label>
                <input type="number" min="0" step="1" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>จำนวนขั้นต่ำ</label>
                <input type="number" min="0" step="1" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })} required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setEditModal(false)}>ยกเลิก</button>
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="ยืนยันการลบ" onClose={() => setDeleteConfirm(null)}>
          <div className="modal-body">
            <p>ต้องการลบรายการ <strong>{deleteConfirm.productName}</strong> ({deleteConfirm.warehouse}) ใช่หรือไม่?</p>
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

export default Inventory;
