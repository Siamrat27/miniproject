import { useEffect, useState } from 'react';
import { productsAPI, inventoryAPI } from '../services/api';

const WAREHOUSES = ['คลังหลัก', 'คลังสาขา A', 'คลังสาขา B','คลังสาขา C'];

const EMPTY_FORM = { productId: '', warehouse: WAREHOUSES[0], quantity: '', note: '' };

const Receive = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    productsAPI.list().then((res) => setProducts(res.data.data));
  }, []);

  const selectedProduct = products.find((p) => p.id === parseInt(form.productId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await inventoryAPI.receive({
        productId: parseInt(form.productId),
        productName: selectedProduct.name,
        warehouse: form.warehouse,
        quantity: parseInt(form.quantity),
        unit: selectedProduct.unit,
        note: form.note,
      });
      setSuccess(
        `นำเข้า "${selectedProduct.name}" จำนวน ${form.quantity} ${selectedProduct.unit} → ${form.warehouse} สำเร็จ`
      );
      setForm(EMPTY_FORM);
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
          <h2 className="page-title">นำเข้าสินค้า</h2>
          <p className="page-sub">รับสินค้าเข้าคลัง — จะบวกกับสต็อกที่มีอยู่อัตโนมัติ</p>
        </div>
      </div>

      <div className="form-card">
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">ข้อมูลการนำเข้า</h3>

            <div className="form-row">
              <div className="form-group">
                <label>คลังสินค้าปลายทาง *</label>
                <select
                  value={form.warehouse}
                  onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                >
                  {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>สินค้า *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  required
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>จำนวนที่นำเข้า *</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  disabled={!form.productId}
                />
                {selectedProduct && (
                  <span className="form-hint">หน่วย: {selectedProduct.unit}</span>
                )}
              </div>
              <div className="form-group">
                <label>หมายเหตุ</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="แหล่งที่มา / เลขที่ใบรับสินค้า (ถ้ามี)"
                />
              </div>
            </div>
          </div>

          {selectedProduct && form.quantity && (
            <div className="confirm-summary">
              <span>สรุป:</span> นำเข้า <strong>{selectedProduct.name}</strong> จำนวน{' '}
              <strong>{form.quantity} {selectedProduct.unit}</strong> เข้า <strong>{form.warehouse}</strong>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !form.productId || !form.quantity}
            >
              {saving ? 'กำลังนำเข้า...' : 'ยืนยันการนำเข้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Receive;
