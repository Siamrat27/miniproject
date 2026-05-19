import { useEffect, useState } from 'react';
import { transactionsAPI } from '../services/api';

const TYPE_INFO = {
  receive:  { label: 'นำเข้า',  cls: 'badge-success' },
  transfer: { label: 'โอนย้าย', cls: 'badge-blue'    },
  export:   { label: 'ส่งออก',  cls: 'badge-warning'  },
};

const FILTERS = [
  { value: 'all',      label: 'ทั้งหมด'  },
  { value: 'receive',  label: 'นำเข้า'   },
  { value: 'transfer', label: 'โอนย้าย'  },
  { value: 'export',   label: 'ส่งออก'   },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    transactionsAPI.list(200).then((res) => {
      setTransactions(res.data.data);
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  if (loading) return <div className="page-loading">กำลังโหลด...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Transaction Log</h2>
          <p className="page-sub">ประวัติการเคลื่อนไหวสินค้าทั้งหมด</p>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            className={`filter-tab${filter === value ? ' active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
            <span className="filter-count">
              {value === 'all'
                ? transactions.length
                : transactions.filter((t) => t.type === value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card mt-16">
        {filtered.length === 0 ? (
          <div className="empty-state">ไม่มีรายการ</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>วันที่/เวลา</th>
                <th>ประเภท</th>
                <th>สินค้า</th>
                <th>จากคลัง</th>
                <th>ไปคลัง</th>
                <th>จำนวน</th>
                <th>บันทึกโดย</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const info = TYPE_INFO[t.type] || { label: t.type, cls: 'badge-blue' };
                return (
                  <tr key={t.id}>
                    <td className="text-sm text-muted nowrap">{formatDate(t.createdAt)}</td>
                    <td><span className={`badge ${info.cls}`}>{info.label}</span></td>
                    <td className="font-medium">{t.productName}</td>
                    <td>{t.fromWarehouse ?? <span className="text-muted">—</span>}</td>
                    <td>{t.toWarehouse ?? <span className="text-muted">—</span>}</td>
                    <td className="nowrap">{t.quantity} {t.unit}</td>
                    <td className="text-sm">{t.createdBy}</td>
                    <td className="text-sm text-muted">{t.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
