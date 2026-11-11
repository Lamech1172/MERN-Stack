import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'Transport': '#06b6d4',
  'Shopping': '#ec4899',
  'Bills & Utilities': '#eab308',
  'Entertainment': '#a855f7',
  'Salary/Income': '#10b981',
  'Other': '#64748b'
};

// Format numbers in Indian Rupee standard (₹1,25,000.00)
const formatINR = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num || 0);
};

// Custom Glassmorphism Tooltip for Pie Chart
const CustomPieTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return (
      <div className="custom-tooltip">
        <div className="tooltip-title" style={{ color }}>{name}</div>
        <div>Amount: <strong>{formatINR(value)}</strong></div>
        <div>Share: <strong>{percent}%</strong></div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [chartMode, setChartMode] = useState('category'); // 'category' | 'overview'

  // Auth Form State
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Transactions & Form State
  const [transactions, setTransactions] = useState([]);
  const [txForm, setTxForm] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isLoginView ? '/auth/login' : '/auth/register';
      const payload = isLoginView
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Check server connection.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setTransactions([]);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.title || !txForm.amount) return;
    try {
      const res = await axios.post(`${API_BASE}/expenses`, txForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions([res.data, ...transactions]);
      setTxForm({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Food & Dining',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(transactions.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // Summary Metrics
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Prepare Category Pie Data
  const categoryTotals = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
      return acc;
    }, {});

  const categoryPieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#8b5cf6'
  }));

  // Prepare Income vs Expense Pie Data
  const overviewPieData = [
    { name: 'Total Income', value: totalIncome, color: '#10b981' },
    { name: 'Total Expense', value: totalExpense, color: '#f43f5e' }
  ].filter((item) => item.value > 0);

  const activePieData = chartMode === 'category' ? categoryPieData : overviewPieData;
  const activePieTotal = chartMode === 'category' ? totalExpense : totalIncome + totalExpense;

  // ---------------- AUTH VIEW ----------------
  if (!token) {
    return (
      <div className="app-container auth-wrapper">
        <div className="auth-card">
          <h1 className="brand-gradient">RupeeFlow</h1>
          <p className="auth-subtitle">
            {isLoginView ? 'Sign in to manage your finances' : 'Create an account to start tracking'}
          </p>

          {authError && <div className="error-banner">{authError}</div>}

          <form onSubmit={handleAuthSubmit}>
            {!isLoginView && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              {isLoginView ? 'Login to Dashboard' : 'Create Account'}
            </button>
          </form>

          <p className="switch-auth">
            {isLoginView ? "Don't have an account? " : 'Already registered? '}
            <span onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); }}>
              {isLoginView ? 'Sign Up' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ---------------- DASHBOARD VIEW ----------------
  return (
    <div className="app-container">
      <header className="navbar">
        <div>
          <h2 className="brand-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>
            RupeeFlow Tracker
          </h2>
        </div>
        <div className="user-badge">
          <span>Welcome, <strong>{user?.name}</strong></span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="summary-grid">
        <div className="stat-card stat-balance">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value">{formatINR(netBalance)}</div>
        </div>
        <div className="stat-card stat-income">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatINR(totalIncome)}</div>
        </div>
        <div className="stat-card stat-expense">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatINR(totalExpense)}</div>
        </div>
      </section>

      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Left Column: Form + Interactive Pie Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div className="glass-panel">
            <h3 className="panel-title">Add New Transaction</h3>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Title / Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Grocery Shopping, Monthly Salary"
                  value={txForm.title}
                  onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g., 1500"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    className="form-control"
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control"
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  >
                    {Object.keys(CATEGORY_COLORS).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary">+ Add Transaction</button>
            </form>
          </div>

          {/* Interactive Pie Chart Panel */}
          <div className="glass-panel">
            <h3 className="panel-title">Visual Analytics</h3>

            <div className="chart-tabs">
              <button
                type="button"
                className={`chart-tab-btn ${chartMode === 'category' ? 'active' : ''}`}
                onClick={() => setChartMode('category')}
              >
                Expenses by Category
              </button>
              <button
                type="button"
                className={`chart-tab-btn ${chartMode === 'overview' ? 'active' : ''}`}
                onClick={() => setChartMode('overview')}
              >
                Income vs Expense
              </button>
            </div>

            {activePieData.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                Add transactions to view the interactive pie chart.
              </p>
            ) : (
              <div className="chart-container">
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={activePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {activePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip total={activePieTotal} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend Grid */}
                <div className="chart-legend-grid">
                  {activePieData.map((item) => {
                    const pct = activePieTotal > 0 ? Math.round((item.value / activePieTotal) * 100) : 0;
                    return (
                      <div key={item.name} className="legend-badge">
                        <div className="legend-left">
                          <span className="legend-dot" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <strong>{pct}%</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="glass-panel">
          <h3 className="panel-title">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No transactions found. Add your first entry on the left!</p>
          ) : (
            <div className="tx-list">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="tx-item"
                  style={{ borderLeftColor: CATEGORY_COLORS[tx.category] || '#8b5cf6' }}
                >
                  <div className="tx-info">
                    <h4>{tx.title}</h4>
                    <div className="tx-meta">
                      {tx.category} • {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div className="tx-right">
                    <span className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </span>
                    <button className="btn-delete" onClick={() => handleDelete(tx._id)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}