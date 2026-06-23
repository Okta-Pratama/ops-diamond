import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, BookOpen, Store, HelpCircle, MessageSquare, DollarSign, BarChart2, BookText, LineChart, Users, LogOut } from 'lucide-react';
import ProductAdmin from './productadmin';
import PayrollAdmin from './payrolladmin';
import EmployeeAdmin from './employeeadmin';
import SoldProductAdmin from './soldproductadmin';
import SalaryBookAdmin from './salarybookadmin';
import ProductBookAdmin from './productbookadmin';
import FaqAdmin from './faqadmin';
import StoreAdmin from './storeadmin';
import UsageGuideAdmin from './usageguideadmin';
import api from '../api';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Summary Cards di halaman utama ───────────────────────────────────────────
const DashboardHome = () => {
  const [stats, setStats] = useState({ products: 0, employees: 0, saldo: 0, stores: 0 });
  const [chartData, setChartData] = useState([]);
  const [health, setHealth] = useState({ salesGrowth: 0, salaryGrowth: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, employees, stores, chartRes] = await Promise.all([
          api.get('/products'),
          api.get('/payroll/employees/status'),
          api.get('/stores'),
          api.get('/dashboard/stats/chart')
        ]);
        const totalSaldo = employees.data.reduce((sum, e) => sum + Number(e.total_saldo), 0);
        setStats({ products: products.data.length, employees: employees.data.length, saldo: totalSaldo, stores: stores.data.length });
        
        const cData = chartRes.data;
        setChartData(cData);

        if (cData.length >= 2) {
           const curr = cData[cData.length - 1];
           const prev = cData[cData.length - 2];
           const salesGrowth = prev.total_sales > 0 ? ((curr.total_sales - prev.total_sales) / prev.total_sales * 100) : 0;
           const salaryGrowth = prev.total_salary > 0 ? ((curr.total_salary - prev.total_salary) / prev.total_salary * 100) : 0;
           setHealth({ salesGrowth, salaryGrowth });
        }
      } catch { console.error('Gagal memuat statistik'); }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Produk', value: stats.products, icon: <Package size={26} strokeWidth={1.5}/>, color: '#3b82f6', link: '/admin/dashboard/products' },
    { label: 'Karyawan', value: stats.employees, icon: <Users size={26} strokeWidth={1.5}/>, color: '#10b981', link: '/admin/dashboard/employees' },
    { label: 'Total Saldo Gaji', value: `Rp ${stats.saldo.toLocaleString()}`, icon: <DollarSign size={26} strokeWidth={1.5}/>, color: '#f59e0b', link: '/admin/dashboard/payroll' },
    { label: 'Total Toko', value: stats.stores, icon: <Store size={26} strokeWidth={1.5}/>, color: '#6366f1', link: '/admin/dashboard/stores' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded shadow-sm p-3" style={{ minWidth: '150px' }}>
          <div className="fw-bold mb-2 text-dark" style={{ fontSize: '0.85rem' }}>{label}</div>
          {payload.map(p => (
            <div key={p.dataKey} className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: p.color }}>{p.name}:</span>
              <span className="fw-semibold text-dark">
                {p.dataKey === 'total_salary' ? `Rp ${Number(p.value).toLocaleString()}` : p.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const GrowthBadge = ({ value }) => {
    if (value > 0) return <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1"><TrendingUp size={12}/> +{value.toFixed(1)}%</span>;
    if (value < 0) return <span className="badge bg-danger bg-opacity-10 text-danger d-flex align-items-center gap-1"><TrendingDown size={12}/> {value.toFixed(1)}%</span>;
    return <span className="badge bg-secondary bg-opacity-10 text-secondary d-flex align-items-center gap-1"><Minus size={12}/> 0%</span>;
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark" style={{ letterSpacing: '-0.3px' }}>Selamat Datang, Admin! 👋</h4>
        <p className="text-muted">Ringkasan performa dan kesehatan bisnis Diamond Store Group bulan ini.</p>
      </div>

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div className="col-sm-6 col-xl-3" key={card.label}>
            <Link to={card.link} className="text-decoration-none">
              <div className="card card-interactive border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 50, height: 50, backgroundColor: card.color + '15', color: card.color, flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">{card.label}</div>
                    <div className="fs-4 fw-bold text-dark">{card.value}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white fw-bold border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2 text-dark">
                <LineChart size={18} />
                <span>Tren Performa 6 Bulan Terakhir</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month_label" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area yAxisId="left" type="monotone" dataKey="total_sales" name="Penjualan (Qty)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    <Area yAxisId="right" type="monotone" dataKey="total_salary" name="Gaji Pokok (Rp)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSalary)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white fw-bold border-0 pt-4 pb-0">
              <div className="d-flex align-items-center gap-2 text-dark">
                <BarChart2 size={18} />
                <span>Kesehatan Bisnis (Bulan Ini)</span>
              </div>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-medium">Penjualan Buku Product</span>
                  <GrowthBadge value={health.salesGrowth} />
                </div>
                <div className="fs-3 fw-bold text-dark">
                  {chartData.length > 0 ? chartData[chartData.length-1].total_sales : 0} <span className="fs-6 text-muted fw-normal">Item</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small fw-medium">Pengeluaran Buku Gaji</span>
                  <GrowthBadge value={health.salaryGrowth} />
                </div>
                <div className="fs-3 fw-bold text-dark">
                  <span className="fs-5 text-muted">Rp </span>
                  {chartData.length > 0 ? Number(chartData[chartData.length-1].total_salary).toLocaleString() : 0}
                </div>
              </div>

              <hr className="text-muted opacity-25" />

              <div className="d-flex flex-column gap-2 mt-3">
                {[
                  { to: '/admin/dashboard/salary-book', icon: <BookText size={16}/>, label: 'Buku Gaji', desc: 'Rekap gaji bulanan' },
                  { to: '/admin/dashboard/product-book', icon: <BookOpen size={16}/>, label: 'Buku Product', desc: 'Rekap penjualan produk' },
                ].map((item) => (
                  <Link to={item.to} key={item.to}
                    className="btn btn-light text-start p-3 d-flex align-items-center gap-3 w-100 border-0"
                    style={{ borderRadius: '10px' }}>
                    <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: 36, height: 36, color: '#334155' }}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="small fw-bold text-dark">{item.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Feedback Admin (inline) ──────────────────────────────────────────────────
const FeedbackAdmin = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try { const res = await api.get('/feedbacks'); setFeedbacks(res.data); }
    catch { console.error('Gagal memuat pesan & saran'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchFeedbacks(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pesan saran ini?')) return;
    try { await api.delete(`/feedbacks/${id}`); fetchFeedbacks(); alert('Pesan berhasil dihapus!'); }
    catch { alert('Gagal menghapus pesan'); }
  };

  return (
    <div className="container-fluid mt-2">
      <div className="mb-4">
        <h4 className="fw-bold">💬 Pesan & Saran</h4>
        <small className="text-muted">Daftar masukan dan saran masuk dari pelanggan</small>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold border-0 py-3">
          Pesan & Saran Masuk ({feedbacks.length})
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4" style={{ width: '180px' }}>Tanggal Masuk</th>
                  <th>Isi Saran / Masukan</th>
                  <th className="text-center pe-4" style={{ width: '120px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="text-center py-5 text-muted small">Memuat pesan...</td></tr>
                ) : feedbacks.length === 0 ? (
                  <tr><td colSpan="3" className="text-center py-5 text-muted small">Belum ada pesan atau saran masuk dari pelanggan.</td></tr>
                ) : feedbacks.map(f => (
                  <tr key={f.id}>
                    <td className="ps-4 text-muted small">
                      {new Date(f.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="text-dark fw-normal" style={{ whiteSpace: 'pre-wrap' }}>{f.message}</td>
                    <td className="text-center pe-4">
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(f.id)}>🗑️ Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar Navigation Config ────────────────────────────────────────────────
const MAIN_MENU = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/dashboard/products', label: 'Produk', icon: Package },
  { to: '/admin/dashboard/usage-guides', label: 'Cara Pakai', icon: BookOpen },
  { to: '/admin/dashboard/stores', label: 'Kelola Toko', icon: Store },
  { to: '/admin/dashboard/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/admin/dashboard/feedbacks', label: 'Pesan & Saran', icon: MessageSquare },
];

const PEMBUKUAN_MENU = [
  { to: '/admin/dashboard/payroll', label: 'Penggajian', icon: DollarSign },
  { to: '/admin/dashboard/sold-products', label: 'Product Terjual', icon: BarChart2 },
  { to: '/admin/dashboard/salary-book', label: 'Buku Gaji', icon: BookText },
  { to: '/admin/dashboard/product-book', label: 'Buku Product', icon: LineChart },
  { to: '/admin/dashboard/employees', label: 'Karyawan', icon: Users },
];

// ─── Komponen Utama Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/'); };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.to, item.exact);
    const Icon = item.icon;
    return (
      <li className="nav-item">
        <Link to={item.to} className="nav-link rounded-3 px-3 py-2 d-flex align-items-center gap-2" style={{
          fontSize: '0.875rem',
          color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
          backgroundColor: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          fontWeight: active ? '500' : '400',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >
          {Icon && <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />}
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        {/* SIDEBAR */}
        <div className="d-flex flex-column p-0 text-white"
          style={{ width: '220px', minWidth: '220px', minHeight: '100vh', backgroundColor: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Brand */}
          <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="fw-bold text-white" style={{ fontSize: '0.95rem', letterSpacing: '-0.3px' }}>Diamond Admin</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: '2px' }}>Diamond Store Group</div>
          </div>

          {/* Nav */}
          <nav className="flex-grow-1 px-3 py-3 overflow-auto">
            <ul className="nav flex-column gap-1 mb-2">
              {MAIN_MENU.map(item => <NavLink key={item.to} item={item} />)}
            </ul>

            <div className="px-3 pt-3 pb-1">
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', fontWeight: '600', textTransform: 'uppercase' }}>
                Pembukuan
              </div>
            </div>
            <ul className="nav flex-column gap-1">
              {PEMBUKUAN_MENU.map(item => <NavLink key={item.to} item={item} />)}
            </ul>

            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={handleLogout}
                className="btn w-100 text-start d-flex align-items-center gap-2 border-0"
                style={{ color: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent', fontSize: '0.875rem', padding: '8px 12px', borderRadius: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <LogOut size={15} strokeWidth={1.75} />
                Logout
              </button>
            </div>
          </nav>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-grow-1 bg-white overflow-auto p-4">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="products" element={<ProductAdmin />} />
            <Route path="payroll" element={<PayrollAdmin />} />
            <Route path="employees" element={<EmployeeAdmin />} />
            <Route path="sold-products" element={<SoldProductAdmin />} />
            <Route path="salary-book" element={<SalaryBookAdmin />} />
            <Route path="product-book" element={<ProductBookAdmin />} />
            <Route path="stores" element={<StoreAdmin />} />
            <Route path="faq" element={<FaqAdmin />} />
            <Route path="usage-guides" element={<UsageGuideAdmin />} />
            <Route path="feedbacks" element={<FeedbackAdmin />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;