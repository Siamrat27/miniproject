import { useEffect, useState } from 'react';
import { statsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const TYPE_INFO = {
  receive:  { label: 'นำเข้า',  cls: 'badge-success' },
  transfer: { label: 'โอนย้าย', cls: 'badge-blue'    },
  export:   { label: 'ส่งออก',  cls: 'badge-warning'  },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('th-TH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const StatCard = ({ label, value, sub, color }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.get().then((res) => setStats(res.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">กำลังโหลด...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-sub">ภาพรวมระบบสินค้าและคลังสินค้า</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="สินค้าทั้งหมด"  value={stats.totalProducts}      color="blue"  sub="รายการสินค้า" />
        <StatCard label="รายการในคลัง"   value={stats.totalInventoryItems} color="green" sub="รายการสต็อก" />
        <StatCard
          label="สินค้าใกล้หมด"
          value={stats.lowStockCount}
          color={stats.lowStockCount > 0 ? 'red' : 'green'}
          sub="ต่ำกว่าจำนวนขั้นต่ำ"
        />
      </div>

      <div className="dashboard-grid">
        {stats.lowStockCount > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">สินค้าใกล้หมด</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ชื่อสินค้า</th>
                  <th>คลัง</th>
                  <th>คงเหลือ</th>
                  <th>ขั้นต่ำ</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.productName}</td>
                    <td>{item.warehouse}</td>
                    <td className="text-danger font-medium">{item.quantity} {item.unit}</td>
                    <td className="text-muted">{item.minStock} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stats.recentTransactions?.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">รายการล่าสุด</h3>
              <Link to="/transactions" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
                ดูทั้งหมด →
              </Link>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>ประเภท</th>
                  <th>สินค้า</th>
                  <th>จำนวน</th>
                  <th>คลัง</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((t) => {
                  const info = TYPE_INFO[t.type] || { label: t.type, cls: 'badge-blue' };
                  return (
                    <tr key={t.id}>
                      <td className="text-sm text-muted nowrap">{formatDate(t.createdAt)}</td>
                      <td><span className={`badge ${info.cls}`}>{info.label}</span></td>
                      <td className="font-medium">{t.productName}</td>
                      <td className="nowrap">{t.quantity} {t.unit}</td>
                      <td className="text-sm">{t.toWarehouse || t.fromWarehouse}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
