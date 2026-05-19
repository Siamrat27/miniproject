const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dataPath = (file) => path.join(__dirname, 'data', file);

const read = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const write = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

const today = () => new Date().toISOString().split('T')[0];
const logTxn = (txn) => {
  const txns = read('transactions.json');
  txns.unshift({ id: Date.now(), ...txn, createdAt: new Date().toISOString() });
  write('transactions.json', txns);
};

// ─── Middleware ───────────────────────────────────────────────────────────────

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ data: null, error: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  const userId = parseInt(token.replace('mock_token_', ''));
  const user = read('users.json').find((u) => u.id === userId);
  if (!user) return res.status(401).json({ data: null, error: 'Invalid token' });
  req.user = user;
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ data: null, error: 'Admin only' });
  }
  next();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = read('users.json').find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ data: null, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }
  res.json({
    data: {
      token: `mock_token_${user.id}`,
      user: { id: user.id, name: user.name, role: user.role, username: user.username },
    },
  });
});

app.get('/api/auth/me', auth, (req, res) => {
  const { password, ...safe } = req.user;
  res.json({ data: safe });
});

// ─── Users (admin) ────────────────────────────────────────────────────────────

app.get('/api/users', auth, adminOnly, (req, res) => {
  const users = read('users.json').map(({ password, ...u }) => u);
  res.json({ data: users });
});

app.post('/api/users', auth, adminOnly, (req, res) => {
  const users = read('users.json');
  const { username, password, name, role } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ data: null, error: 'Username นี้มีอยู่แล้ว' });
  }
  const user = { id: Date.now(), username, password, name, role: role || 'user' };
  users.push(user);
  write('users.json', users);
  const { password: _, ...safe } = user;
  res.status(201).json({ data: safe });
});

app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const users = read('users.json');
  const idx = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ data: null, error: 'Not found' });
  const { password, ...rest } = req.body;
  users[idx] = { ...users[idx], ...rest, id: users[idx].id, ...(password ? { password } : {}) };
  write('users.json', users);
  const { password: _, ...safe } = users[idx];
  res.json({ data: safe });
});

app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ data: null, error: 'ไม่สามารถลบบัญชีตัวเองได้' });
  }
  const users = read('users.json');
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ data: null, error: 'Not found' });
  const [deleted] = users.splice(idx, 1);
  write('users.json', users);
  const { password, ...safe } = deleted;
  res.json({ data: safe });
});

// ─── Products ─────────────────────────────────────────────────────────────────

app.get('/api/products', auth, (req, res) => {
  res.json({ data: read('products.json') });
});

app.post('/api/products', auth, adminOnly, (req, res) => {
  const products = read('products.json');
  const item = { id: Date.now(), ...req.body };
  products.push(item);
  write('products.json', products);
  res.status(201).json({ data: item });
});

app.put('/api/products/:id', auth, adminOnly, (req, res) => {
  const products = read('products.json');
  const idx = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ data: null, error: 'Not found' });
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  write('products.json', products);
  res.json({ data: products[idx] });
});

app.delete('/api/products/:id', auth, adminOnly, (req, res) => {
  const products = read('products.json');
  const idx = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ data: null, error: 'Not found' });
  const [deleted] = products.splice(idx, 1);
  write('products.json', products);
  res.json({ data: deleted });
});

// ─── Inventory (CRUD) ─────────────────────────────────────────────────────────

app.get('/api/inventory', auth, (req, res) => {
  res.json({ data: read('inventory.json') });
});

app.post('/api/inventory', auth, adminOnly, (req, res) => {
  const inventory = read('inventory.json');
  const item = { id: Date.now(), lastUpdated: today(), ...req.body };
  inventory.push(item);
  write('inventory.json', inventory);
  res.status(201).json({ data: item });
});

app.put('/api/inventory/:id', auth, adminOnly, (req, res) => {
  const inventory = read('inventory.json');
  const idx = inventory.findIndex((i) => i.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ data: null, error: 'Not found' });
  inventory[idx] = { ...inventory[idx], ...req.body, id: inventory[idx].id, lastUpdated: today() };
  write('inventory.json', inventory);
  res.json({ data: inventory[idx] });
});

app.delete('/api/inventory/:id', auth, adminOnly, (req, res) => {
  const inventory = read('inventory.json');
  const idx = inventory.findIndex((i) => i.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ data: null, error: 'Not found' });
  const [deleted] = inventory.splice(idx, 1);
  write('inventory.json', inventory);
  res.json({ data: deleted });
});

// ─── Inventory Receive (นำเข้า) ───────────────────────────────────────────────

app.post('/api/inventory/receive', auth, adminOnly, (req, res) => {
  const { productId, productName, warehouse, quantity, unit, note, minStock } = req.body;
  const inventory = read('inventory.json');

  const existing = inventory.find(
    (i) => i.productId === productId && i.warehouse === warehouse
  );

  let item;
  if (existing) {
    existing.quantity += quantity;
    existing.lastUpdated = today();
    if (minStock !== undefined) existing.minStock = minStock;
    item = existing;
  } else {
    item = { id: Date.now(), productId, productName, warehouse, quantity, unit, minStock: minStock ?? 0, lastUpdated: today() };
    inventory.push(item);
  }
  write('inventory.json', inventory);

  logTxn({
    type: 'receive',
    productId,
    productName,
    fromWarehouse: null,
    toWarehouse: warehouse,
    quantity,
    unit,
    note: note || '',
    createdBy: req.user.name,
  });

  res.json({ data: item });
});

// ─── Inventory Transfer / Export (โอนย้าย / ส่งออก) ─────────────────────────

app.post('/api/inventory/transfer', auth, adminOnly, (req, res) => {
  const { fromInventoryId, quantity, toType, toWarehouse, note } = req.body;
  const inventory = read('inventory.json');

  const source = inventory.find((i) => i.id === fromInventoryId);
  if (!source) return res.status(404).json({ data: null, error: 'ไม่พบรายการต้นทาง' });
  if (source.quantity < quantity) {
    return res.status(400).json({ data: null, error: `สินค้าไม่พอ (คงเหลือ ${source.quantity} ${source.unit})` });
  }

  source.quantity -= quantity;
  source.lastUpdated = today();

  const txnType = toType === 'warehouse' ? 'transfer' : 'export';

  if (toType === 'warehouse' && toWarehouse) {
    const dest = inventory.find(
      (i) => i.productId === source.productId && i.warehouse === toWarehouse
    );
    if (dest) {
      dest.quantity += quantity;
      dest.lastUpdated = today();
    } else {
      inventory.push({
        id: Date.now(),
        productId: source.productId,
        productName: source.productName,
        warehouse: toWarehouse,
        quantity,
        unit: source.unit,
        minStock: source.minStock,
        lastUpdated: today(),
      });
    }
  }

  write('inventory.json', inventory);

  logTxn({
    type: txnType,
    productId: source.productId,
    productName: source.productName,
    fromWarehouse: source.warehouse,
    toWarehouse: toType === 'warehouse' ? toWarehouse : 'ภายนอก',
    quantity,
    unit: source.unit,
    note: note || '',
    createdBy: req.user.name,
  });

  res.json({ data: { success: true } });
});

// ─── Transactions ─────────────────────────────────────────────────────────────

app.get('/api/transactions', auth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const txns = read('transactions.json').slice(0, limit);
  res.json({ data: txns });
});

// ─── Stats (dashboard) ────────────────────────────────────────────────────────

app.get('/api/stats', auth, (req, res) => {
  const products = read('products.json');
  const inventory = read('inventory.json');
  const txns = read('transactions.json');
  const lowStock = inventory.filter((i) => i.quantity < i.minStock);
  res.json({
    data: {
      totalProducts: products.length,
      totalInventoryItems: inventory.length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      recentTransactions: txns.slice(0, 5),
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}`);
});
