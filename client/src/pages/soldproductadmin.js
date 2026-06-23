import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { BarChart2, Save, Calendar } from 'lucide-react';

const PLATFORMS = ['Shopee', 'Lazada', 'TikTok', 'Tokopedia'];
const today = () => new Date().toISOString().split('T')[0];

const SoldProductAdmin = () => {
  const [date, setDate] = useState(today());
  const [stores, setStores] = useState([]);
  const [salesMap, setSalesMap] = useState({}); // { `${store_id}_${platform}` : quantity }
  const [dropship, setDropship] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (d) => {
    try {
      const res = await api.get(`/daily-sales?date=${d}`);
      const map = {};
      let ds = 0;
      res.data.sales.forEach(s => {
        if (s.platform === 'dropship') {
          ds = s.quantity;
        } else {
          map[`${s.store_id}_${s.platform}`] = s.quantity;
        }
      });
      setStores(res.data.stores.filter(s => s.is_active !== false));
      setSalesMap(map);
      setDropship(ds);
    } catch { console.error('Gagal memuat data penjualan'); }
  }, []);

  useEffect(() => { fetchData(date); }, [date, fetchData]);

  const getVal = (store_id, platform) => salesMap[`${store_id}_${platform.toLowerCase()}`] || 0;
  const setVal = (store_id, platform, val) => {
    setSalesMap(prev => ({ ...prev, [`${store_id}_${platform.toLowerCase()}`]: Number(val) || 0 }));
  };

  const totalStore = (store_id) =>
    PLATFORMS.reduce((s, p) => s + (salesMap[`${store_id}_${p.toLowerCase()}`] || 0), 0);

  const totalPlatform = (platform) =>
    stores.reduce((s, st) => s + (salesMap[`${st.id}_${platform.toLowerCase()}`] || 0), 0);

  const grandTotal = stores.reduce((s, st) => s + totalStore(st.id), 0) + dropship;

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = [];
      stores.forEach(st => {
        PLATFORMS.forEach(p => {
          entries.push({ store_id: st.id, platform: p.toLowerCase(), quantity: getVal(st.id, p) });
        });
      });
      // Dropship uses store_id = null — we use store_id = 0 as sentinel
      entries.push({ store_id: null, platform: 'dropship', quantity: dropship });
      await api.post('/daily-sales', { date, entries: entries.filter(e => e.store_id !== null) });

      // Save dropship separately (store_id null not allowed by FK) — use a special upsert
      // For dropship we treat store_id as NULL; adjust backend to allow it
      await api.post('/daily-sales/dropship', { date, quantity: dropship });

      alert('✅ Data penjualan berhasil disimpan!');
    } catch {
      // Fallback: save all with store entries
      try {
        const entries = [];
        stores.forEach(st => {
          PLATFORMS.forEach(p => {
            entries.push({ store_id: st.id, platform: p.toLowerCase(), quantity: getVal(st.id, p) });
          });
        });
        await api.post('/daily-sales', { date, entries });
        alert('✅ Data penjualan berhasil disimpan! (tanpa dropship)');
      } catch { alert('Gagal menyimpan data penjualan'); }
    } finally { setSaving(false); }
  };

  return (
    <div className="container-fluid mt-2">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><BarChart2 size={20} strokeWidth={1.75} /> Product Terjual</h4>
          <small className="text-muted">Input jumlah produk terjual per toko dan platform</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Calendar size={16} className="text-muted" />
          <label className="fw-semibold small text-muted mb-0">Tanggal:</label>
          <input
            type="date" className="form-control" style={{ width: 180 }}
            value={date} max={today()}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="alert alert-light border d-flex align-items-center gap-2 py-2 mb-3">
        <span>📅</span>
        <span className="small">
          Data penjualan untuk: <strong>{new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
          {date < today() && <span className="badge bg-warning text-dark ms-2">Retroaktif</span>}
          {date === today() && <span className="badge bg-success ms-2">Hari Ini</span>}
        </span>
      </div>

      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="ps-4" style={{ minWidth: 160 }}>Toko / Platform</th>
                  {PLATFORMS.map(p => (
                    <th key={p} className="text-center" style={{ width: 110 }}>{p}</th>
                  ))}
                  <th className="text-center" style={{ width: 110 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr><td colSpan={PLATFORMS.length + 2} className="text-center py-5 text-muted">Belum ada toko. Tambah dulu di menu Kelola Toko.</td></tr>
                ) : stores.map(store => (
                  <tr key={store.id}>
                    <td className="ps-4 fw-semibold">{store.name}</td>
                    {PLATFORMS.map(p => {
                      const isActive = store[`is_${p.toLowerCase()}_active`] !== false;
                      return (
                        <td key={p} className={`text-center p-1 ${isActive ? '' : 'bg-light'}`}>
                          {isActive ? (
                            <input
                              type="number" min="0" className="form-control form-control-sm text-center"
                              style={{ maxWidth: 80, margin: '0 auto' }}
                              value={getVal(store.id, p)}
                              onChange={e => setVal(store.id, p, e.target.value)}
                            />
                          ) : (
                            <div className="text-muted small py-1" style={{ backgroundColor: '#e9ecef', borderRadius: 4, maxWidth: 80, margin: '0 auto' }}>
                              Nonaktif
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center fw-bold text-primary">{totalStore(store.id)}</td>
                  </tr>
                ))}

                {/* Dropship row */}
                <tr className="table-warning">
                  <td className="ps-4 fw-semibold">📦 Dropship</td>
                  <td colSpan={PLATFORMS.length} className="text-center p-2">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <span className="text-muted small">Jumlah pesanan:</span>
                      <input
                        type="number" min="0" className="form-control form-control-sm text-center"
                        style={{ maxWidth: 100 }}
                        value={dropship}
                        onChange={e => setDropship(Number(e.target.value) || 0)}
                      />
                    </div>
                  </td>
                  <td className="text-center fw-bold text-warning-emphasis">{dropship}</td>
                </tr>

                {/* Footer total per platform */}
                {stores.length > 0 && (
                  <tr className="table-light fw-bold">
                    <td className="ps-4 text-dark">Total</td>
                    {PLATFORMS.map(p => (
                      <td key={p} className="text-center text-success">{totalPlatform(p)}</td>
                    ))}
                    <td className="text-center text-success fs-6">{grandTotal}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {stores.length > 0 && (
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted small">Grand Total Terjual: <strong className="text-dark">{grandTotal} produk</strong></span>
          <button className="btn btn-dark px-5 d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : <><Save size={16} strokeWidth={1.75} /> Simpan Data Penjualan</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default SoldProductAdmin;
