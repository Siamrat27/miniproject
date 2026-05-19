import { useEffect, useState } from 'react';
import { inventoryAPI } from '../services/api';

const ALL_WAREHOUSES = ['คลังหลัก', 'คลังสาขา A', 'คลังสาขา B','คลังสาขา C'];

const EMPTY_FORM = {
  fromInventoryId: '',
  quantity: '',
  toType: 'warehouse',
  toWarehouse: '',
  note: '',
};

const Transfer = () => {
  const [inventory, setInventory] = useState([]);
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadInventory = () =>
    inventoryAPI.list().then((res) => setInventory(res.data.data));

  useEffect(() => { loadInventory(); }, []);

  const sourceWarehouses = [...new Set(inventory.filter((i) => i.quantity > 0).map((i) => i.warehouse))];

  const warehouseItems = inventory.filter(
    (i) => i.warehouse === sourceWarehouse && i.quantity > 0
  );

  const selectedItem = inventory.find((i) => i.id === parseInt(form.fromInventoryId));

  const destWarehouses = ALL_WAREHOUSES.filter((w) => w !== sourceWarehouse);

  const handleSourceWarehouseChange = (w) => {
    setSourceWarehouse(w);
    setForm({ ...EMPTY_FORM, toWarehouse: '' });
  };

  const handleItemChange = (id) => {
    setForm({ ...form, fromInventoryId: id, quantity: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await inventoryAPI.transfer({
        fromInventoryId: parseInt(form.fromInventoryId),
        quantity: parseInt(form.quantity),
        toType: form.toType,
        toWarehouse: form.toType === 'warehouse' ? form.toWarehouse : null,
        note: form.note,
      });

      const dest = form.toType === 'warehouse' ? form.toWarehouse : 'ภายนอก (ส่งออก)';
      setSuccess(
        `โอนย้าย "${selectedItem.productName}" จำนวน ${form.quantity} ${selectedItem.unit} จาก ${sourceWarehouse} → ${dest} สำเร็จ`
      );
      setSourceWarehouse('');
      setForm(EMPTY_FORM);
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">โอนย้าย / ส่งออกสินค้า</h2>
          <p className="page-sub">ย้ายสินค้าระหว่างคลัง หรือส่งออกไปภายนอก</p>
        </div>
      </div>

      <div className="form-card">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">ต้นทาง</h3>

            <div className="form-row">
              <div className="form-group">
                <label>คลังต้นทาง *</label>
                <select
                  value={sourceWarehouse}
                  onChange={(e) => handleSourceWarehouseChange(e.target.value)}
                  required
                >
                  <option value="">-- เลือกคลัง --</option>
                  {sourceWarehouses.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>สินค้า *</label>
                <select
                  value={form.fromInventoryId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  required
                  disabled={!sourceWarehouse}
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {warehouseItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.productName} (คงเหลือ: {i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: 280 }}>
              <label>จำนวนที่ต้องการโอน *</label>
              <input
                type="number"
                min="1"
                step="1"
                // max={selectedItem?.quantity}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
                disabled={!form.fromInventoryId}
              />
              {selectedItem && (
                <span className="form-hint">
                  คงเหลือ: {selectedItem.quantity} {selectedItem.unit}
                </span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">ปลายทาง</h3>

            <div className="form-group">
              <label>ประเภทปลายทาง</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="warehouse"
                    checked={form.toType === 'warehouse'}
                    onChange={() => setForm({ ...form, toType: 'warehouse', toWarehouse: '' })}
                  />
                  คลังอื่น
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="external"
                    checked={form.toType === 'external'}
                    onChange={() => setForm({ ...form, toType: 'external', toWarehouse: '' })}
                  />
                  ภายนอก (ส่งออก / จำหน่าย)
                </label>
              </div>
            </div>

            {form.toType === 'warehouse' && (
              <div className="form-group" style={{ maxWidth: 280 }}>
                <label>คลังปลายทาง *</label>
                <select
                  value={form.toWarehouse}
                  onChange={(e) => setForm({ ...form, toWarehouse: e.target.value })}
                  required
                >
                  <option value="">-- เลือกคลัง --</option>
                  {destWarehouses.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>หมายเหตุ</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                placeholder="ระบุเหตุผล / ปลายทาง (ถ้ามี)"
              />
            </div>
          </div>

          {selectedItem && form.quantity && (
            <div className="confirm-summary">
              <span>สรุป:</span> โอน <strong>{selectedItem.productName}</strong> จำนวน{' '}
              <strong>{form.quantity} {selectedItem.unit}</strong> จาก <strong>{sourceWarehouse}</strong> →{' '}
              <strong>{form.toType === 'warehouse' ? (form.toWarehouse || '?') : 'ภายนอก'}</strong>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.fromInventoryId || !form.quantity || (form.toType === 'warehouse' && !form.toWarehouse)}
            >
              {saving ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Transfer;
