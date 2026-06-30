import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, BookOpen, Store, HelpCircle, MessageSquare, DollarSign, BarChart2, BookText, LineChart, Users, LogOut, Menu, X, Eye, Wallet } from 'lucide-react';
import ProductAdmin from './productadmin';
import PayrollAdmin from './payrolladmin';
import EmployeeAdmin from './employeeadmin';
import SoldProductAdmin from './soldproductadmin';
import SalaryBookAdmin from './salarybookadmin';
import ProductBookAdmin from './productbookadmin';
import FaqAdmin from './faqadmin';
import StoreAdmin from './storeadmin';
import UsageGuideAdmin from './usageguideadmin';
import WithdrawAdmin from './withdrawadmin';
import api from '../api';

import { AreaChart, Area, LineChart as RechartsLineChart, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Summary Cards di halaman utama ───────────────────────────────────────────
const DashboardHome = () => {
  const [stats, setStats] = useState({ products: 0, employees: 0, saldo: 0, stores: 0 });
  const [chartData, setChartData] = useState([]);
  const [storePerformance, setStorePerformance] = useState([]);
  const [storeTimeseries, setStoreTimeseries] = useState([]);
  const [health, setHealth] = useState({ salesGrowth: 0, salaryGrowth: 0 });
  const [chartRange, setChartRange] = useState('1m');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, employees, stores] = await Promise.all([
          api.get('/products'),
          api.get('/payroll/employees/status'),
          api.get('/stores')
        ]);
        const totalSaldo = employees.data.reduce((sum, e) => sum + Number(e.total_saldo), 0);
        setStats({ products: products.data.length, employees: employees.data.length, saldo: totalSaldo, stores: stores.data.length });
      } catch { console.error('Gagal memuat statistik statis'); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const [res, storePerfRes, storeTsRes] = await Promise.all([
          api.get(`/dashboard/stats/chart?range=${chartRange}`),
          api.get(`/dashboard/stats/stores?range=${chartRange}`),
          api.get(`/dashboard/stats/stores/timeseries?range=${chartRange}`)
        ]);
        
        const cData = res.data;
        setChartData(cData);
        setStorePerformance(storePerfRes.data);
        setStoreTimeseries(storeTsRes.data);

        if (cData.length >= 2) {
           const curr = cData[cData.length - 1];
           const prev = cData[cData.length - 2];
           const salesGrowth = prev.total_sales > 0 ? ((curr.total_sales - prev.total_sales) / prev.total_sales * 100) : 0;
           const salaryGrowth = prev.total_salary > 0 ? ((curr.total_salary - prev.total_salary) / prev.total_salary * 100) : 0;
           setHealth({ salesGrowth, salaryGrowth });
        } else {
           setHealth({ salesGrowth: 0, salaryGrowth: 0 });
        }
      } catch { console.error('Gagal memuat grafik trend'); }
    };
    fetchChart();
  }, [chartRange]);

  const cards = [
    { label: 'Total Produk', value: stats.products, icon: <Package size={26} strokeWidth={1.5}/>, color: '#3b82f6', link: '/admin/dashboard/products' },
    { label: 'Karyawan', value: stats.employees, icon: <Users size={26} strokeWidth={1.5}/>, color: '#10b981', link: '/admin/dashboard/employees' },
    { label: 'Total Saldo Gaji', value: `Rp ${stats.saldo.toLocaleString()}`, icon: <DollarSign size={26} strokeWidth={1.5}/>, color: '#f59e0b', link: '/admin/dashboard/payroll' },
    { label: 'Total Toko', value: stats.stores, icon: <Store size={26} strokeWidth={1.5}/>, color: '#6366f1', link: '/admin/dashboard/stores' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let displayLabel = label;
      if (label) {
        if (['3d', '7d', '1m'].includes(chartRange)) {
          const d = new Date(label);
          if (!isNaN(d.getTime())) {
            displayLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
          }
        } else {
          const d = new Date(label + '-01');
          if (!isNaN(d.getTime())) {
            displayLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
          }
        }
      }
      return (
        <div className="bg-white border rounded shadow-sm p-3" style={{ minWidth: '150px' }}>
          <div className="fw-bold mb-2 text-dark" style={{ fontSize: '0.85rem' }}>{displayLabel}</div>
          {payload.map(p => (
            <div key={p.dataKey} className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: p.color }}>{p.name}:</span>
              <span className="fw-semibold text-dark">
                {p.dataKey === 'total_salary' ? `Rp ${Number(p.value).toLocaleString('id-ID')}` : p.value}
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
            <div className="card-header bg-white fw-bold border-0 pt-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 text-dark">
                <LineChart size={18} />
                <span>Tren Performa {
                  chartRange === '3d' ? '3 Hari' :
                  chartRange === '7d' ? '7 Hari' :
                  chartRange === '1m' ? '1 Bulan' :
                  chartRange === '6m' ? '6 Bulan' : '1 Tahun'
                } Terakhir</span>
              </div>
              <div className="btn-group shadow-sm">
                <button 
                  className={`btn btn-sm ${chartRange === '3d' ? 'btn-dark' : 'btn-light border'}`}
                  onClick={() => setChartRange('3d')}
                  style={{ fontSize: '0.75rem' }}
                >3 Hari</button>
                <button 
                  className={`btn btn-sm ${chartRange === '7d' ? 'btn-dark' : 'btn-light border'}`}
                  onClick={() => setChartRange('7d')}
                  style={{ fontSize: '0.75rem' }}
                >7 Hari</button>
                <button 
                  className={`btn btn-sm ${chartRange === '1m' ? 'btn-dark' : 'btn-light border'}`}
                  onClick={() => setChartRange('1m')}
                  style={{ fontSize: '0.75rem' }}
                >1 Bulan</button>
                <button 
                  className={`btn btn-sm ${chartRange === '6m' ? 'btn-dark' : 'btn-light border'}`}
                  onClick={() => setChartRange('6m')}
                  style={{ fontSize: '0.75rem' }}
                >6 Bulan</button>
                <button 
                  className={`btn btn-sm ${chartRange === '1y' ? 'btn-dark' : 'btn-light border'}`}
                  onClick={() => setChartRange('1y')}
                  style={{ fontSize: '0.75rem' }}
                >1 Tahun</button>
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
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#64748b'}} 
                      dy={10} 
                      tickFormatter={(val) => {
                        if (!val) return '';
                        try {
                          if (['3d', '7d', '1m'].includes(chartRange)) {
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return val;
                            return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
                          } else {
                            const d = new Date(val + '-01');
                            if (isNaN(d.getTime())) return val;
                            return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(d);
                          }
                        } catch (e) {
                          return val;
                        }
                      }}
                    />
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
                <span>Kesehatan Bisnis ({['3d', '7d', '1m'].includes(chartRange) ? 'Hari Ini' : 'Bulan Ini'})</span>
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

      {/* Performa Setiap Toko */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white fw-bold border-0 pt-4 pb-3">
              <div className="d-flex align-items-center gap-2 text-dark">
                <Store size={18} />
                <span>Performa Setiap Toko ({
                  chartRange === '3d' ? '3 Hari' :
                  chartRange === '7d' ? '7 Hari' :
                  chartRange === '1m' ? '1 Bulan' :
                  chartRange === '6m' ? '6 Bulan' : '1 Tahun'
                } Terakhir)</span>
              </div>
            </div>
            <div className="card-body p-0">
              {/* Grafik LineChart Time-Series Performa Toko */}
              {storeTimeseries.length > 0 && (
                <div className="px-4 pt-4 pb-2 border-bottom border-light">
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <RechartsLineChart data={storeTimeseries} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#64748b' }} 
                          tickFormatter={(val) => {
                            if (!val) return '';
                            try {
                              if (['3d', '7d', '1m'].includes(chartRange)) {
                                const d = new Date(val);
                                if (isNaN(d.getTime())) return val;
                                return new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
                              } else {
                                const d = new Date(val + '-01');
                                if (isNaN(d.getTime())) return val;
                                return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(d);
                              }
                            } catch (e) {
                              return val;
                            }
                          }}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          formatter={(value, name) => [`${value} Item`, name]}
                          labelFormatter={(label) => {
                            if (!label) return label;
                            try {
                              if (['3d', '7d', '1m'].includes(chartRange)) {
                                const d = new Date(label);
                                if (isNaN(d.getTime())) return label;
                                return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
                              } else {
                                const d = new Date(label + '-01');
                                if (isNaN(d.getTime())) return label;
                                return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
                              }
                            } catch (e) { return label; }
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        {storePerformance.map((store, idx) => {
                          const colors = ['#b91c1c', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
                          return (
                            <Line 
                              key={store.name} 
                              type="monotone" 
                              dataKey={store.name} 
                              stroke={colors[idx % colors.length]} 
                              strokeWidth={3} 
                              dot={{ r: 4, strokeWidth: 2 }} 
                              activeDot={{ r: 6 }} 
                            />
                          );
                        })}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Nama Toko</th>
                      <th className="text-end pe-4" style={{ width: '150px' }}>Total Terjual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storePerformance.map((store, idx) => (
                      <tr key={store.id}>
                        <td className="ps-4 py-3 fw-medium">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary fw-bold" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>
                              {idx + 1}
                            </div>
                            {store.name}
                          </div>
                        </td>
                        <td className="text-end pe-4 py-3 fw-bold text-success">
                          {store.total_sales} Item
                        </td>
                      </tr>
                    ))}
                    {storePerformance.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-4 text-muted small">Belum ada data penjualan toko</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleDeleteAll = async () => {
    if (!window.confirm('Yakin ingin menghapus SEMUA pesan & saran? Tindakan ini tidak dapat dibatalkan.')) return;
    try { await api.delete('/feedbacks'); fetchFeedbacks(); alert('Semua pesan berhasil dihapus!'); }
    catch { alert('Gagal menghapus semua pesan'); }
  };

  const handleView = (f) => {
    setSelectedFeedback(f);
    setShowModal(true);
  };

  return (
    <div className="container-fluid mt-2">
      <div className="mb-4">
        <h4 className="fw-bold">💬 Pesan & Saran</h4>
        <small className="text-muted">Daftar masukan dan saran masuk dari pelanggan</small>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold border-0 py-3 d-flex justify-content-between align-items-center">
          <span>Pesan & Saran Masuk ({feedbacks.length})</span>
          {feedbacks.length > 0 && (
            <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={handleDeleteAll}>
              🗑️ Hapus Semua
            </button>
          )}
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4 d-none d-md-table-cell" style={{ width: '180px' }}>Tanggal Masuk</th>
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
                    <td className="ps-4 text-muted small d-none d-md-table-cell">
                      {new Date(f.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="text-dark fw-normal" style={{ whiteSpace: 'pre-wrap' }}>{f.message}</td>
                    <td className="text-center pe-4">
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-sm btn-light border" onClick={() => handleView(f)} title="Lihat Detail">
                          <Eye size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(f.id)} title="Hapus">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal Detail Pesan */}
      {showModal && selectedFeedback && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ backgroundColor: '#0f172a' }}>
                <h5 className="modal-title fw-bold text-white">Detail Pesan & Saran</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="fw-semibold text-muted small">Tanggal Masuk</label>
                  <div>{new Date(selectedFeedback.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                  <label className="fw-semibold text-muted small">Isi Saran / Masukan</label>
                  <div className="p-3 bg-light rounded text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedFeedback.message}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  { to: '/admin/dashboard/withdraw', label: 'Tarik Tunai', icon: Wallet },
  { to: '/admin/dashboard/sold-products', label: 'Product Terjual', icon: BarChart2 },
  { to: '/admin/dashboard/salary-book', label: 'Buku Gaji', icon: BookText },
  { to: '/admin/dashboard/product-book', label: 'Buku Product', icon: LineChart },
  { to: '/admin/dashboard/employees', label: 'Karyawan', icon: Users },
];

// ─── Komponen Utama Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 992);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/'); };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  const NavLink = ({ item }) => {
    const active = isActive(item.to, item.exact);
    const Icon = item.icon;
    return (
      <li className="nav-item">
        <Link 
          to={item.to} 
          onClick={handleLinkClick}
          className="nav-link rounded-3 px-3 py-2 d-flex align-items-center gap-2" style={{
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
    <div className="container-fluid p-0 position-relative" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && isMobile && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR FLOATING */}
      <div 
        className="d-flex flex-column p-0 text-white position-fixed top-0 bottom-0 shadow-lg no-print"
        style={{ 
          width: '260px', 
          backgroundColor: '#0f172a', 
          zIndex: 1050, 
          left: isSidebarOpen ? '0' : '-260px',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
        
        {/* Close Button Mobile */}
        {isMobile && (
          <button 
            className="btn btn-link text-white p-2 border-0 position-absolute" 
            style={{ top: '10px', right: '10px', zIndex: 1060 }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-grow-1 px-3 pt-4 pb-3 overflow-auto mt-2" style={{ scrollbarWidth: 'thin' }}>
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
      <div 
        className="d-flex flex-column print-full-width" 
        style={{ 
          marginLeft: (!isMobile && isSidebarOpen) ? '260px' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          width: (!isMobile && isSidebarOpen) ? 'calc(100% - 260px)' : '100%'
        }}
      >
        {/* TOP NAVBAR / HEADER */}
        <div className="bg-white p-3 d-flex align-items-center shadow-sm sticky-top mb-4 no-print" style={{ zIndex: 1030 }}>
          <button 
            className="btn btn-light border-0 me-3 shadow-sm d-flex align-items-center justify-content-center p-2 rounded-3" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={20} className="text-dark" />
          </button>
          <h5 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Dashboard</h5>
        </div>

        {/* MAIN ROUTER CONTENT */}
        <div className="px-3 px-lg-4 pb-5 flex-grow-1">
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
            <Route path="withdraw" element={<WithdrawAdmin />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;