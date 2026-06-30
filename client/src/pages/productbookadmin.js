import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { LineChart, Search, Edit3, Save, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const PLATFORMS = ['shopee', 'lazada', 'tiktok', 'tokopedia'];
const PLATFORM_LABELS = { lazada: 'Lazada', shopee: 'Shopee', tiktok: 'TikTok', tokopedia: 'Tokopedia' };
const thisYear = new Date().getFullYear();
const thisMonth = new Date().getMonth() + 1;

const ProductBookAdmin = () => {
  const [stores, setStores] = useState([]);
  const [month, setMonth] = useState(String(thisMonth).padStart(2, '0'));
  const [year, setYear] = useState(String(thisYear));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  const getActivePlatforms = (store) => PLATFORMS.filter(p => store[`is_${p}_active`] !== false);

  useEffect(() => {
    api.get('/stores').then(r => setStores(r.data.filter(s => s.is_active !== false))).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/daily-sales/book?month=${month}&year=${year}`);
      setData(res.data);
      setEdits({});
      setIsEditMode(false);
    } catch { console.error('Gagal memuat buku product'); }
    finally { setLoading(false); }
  }, [month, year]);

  // Auto-load on open with current month
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditChange = (date, storeId, platform, value) => {
    const key = `${date}_${storeId || 'null'}_${platform}`;
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  const saveEdits = async () => {
    const updateKeys = Object.keys(edits);
    if (updateKeys.length === 0) {
      setIsEditMode(false);
      return;
    }

    const password = window.prompt("Masukkan password admin untuk menyimpan perubahan:");
    if (!password) return;

    setSaving(true);
    const updates = updateKeys.map(k => {
      const [date, storeIdStr, platform] = k.split('_');
      return {
        date,
        store_id: storeIdStr === 'null' ? null : storeIdStr,
        platform,
        quantity: Number(edits[k]) || 0
      };
    });

    try {
      await api.post('/daily-sales/book/bulk-update', { password, updates });
      alert('Data produk terjual berhasil diperbarui!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  // Build date × store × platform map
  const allDates = [...new Set(data.map(d => d.sale_date))].sort();

  const getQty = (date, store_id, platform) => {
    const row = data.find(d =>
      d.sale_date === date &&
      String(d.store_id) === String(store_id) &&
      d.platform === platform
    );
    return row ? row.quantity : 0;
  };

  const getDisplayQty = (date, store_id, platform) => {
    const key = `${date}_${store_id || 'null'}_${platform}`;
    if (isEditMode && edits[key] !== undefined) return edits[key];
    return getQty(date, store_id, platform);
  };

  const getDropship = (date) => {
    const row = data.find(d => d.sale_date === date && d.platform === 'dropship' && !d.store_id);
    return row ? row.quantity : 0;
  };

  const getDisplayDropship = (date) => {
    const key = `${date}_null_dropship`;
    if (isEditMode && edits[key] !== undefined) return edits[key];
    return getDropship(date);
  };

  const totalByDate = (date) => {
    return data.filter(d => d.sale_date === date).reduce((s, d) => s + d.quantity, 0);
  };

  const totalByStoreAndPlatform = (store_id, platform) => {
    return data.filter(d => String(d.store_id) === String(store_id) && d.platform === platform)
      .reduce((s, d) => s + d.quantity, 0);
  };

  const grandTotal = data.reduce((s, d) => s + d.quantity, 0);
  const totalDropship = data.filter(d => d.platform === 'dropship').reduce((s, d) => s + d.quantity, 0);

  const handleExport = () => {
    const aoa = [];
    const row1 = ['Tanggal'];
    stores.forEach(store => {
      const activePlats = getActivePlatforms(store);
      if (activePlats.length > 0) {
        row1.push(store.name);
        for (let i = 1; i < activePlats.length; i++) row1.push('');
      }
    });
    row1.push('Dropship', 'Total', 'Uang Cadangan');
    aoa.push(row1);

    const row2 = [''];
    stores.forEach(store => {
      getActivePlatforms(store).forEach(p => {
        row2.push(PLATFORM_LABELS[p]);
      });
    });
    row2.push('', '', ''); // For Dropship, Total and Uang Cadangan empty cells
    aoa.push(row2);

    allDates.forEach(date => {
      const rowData = [date];
      stores.forEach(store => {
        getActivePlatforms(store).forEach(p => {
          rowData.push(getQty(date, store.id, p) || 0);
        });
      });
      const dateTotal = totalByDate(date);
      const uc = (dateTotal - 163) * 400;
      rowData.push(getDropship(date) || 0, dateTotal, uc);
      aoa.push(rowData);
    });

    const totalRow = ['TOTAL'];
    stores.forEach(store => {
      getActivePlatforms(store).forEach(p => {
        totalRow.push(totalByStoreAndPlatform(store.id, p) || 0);
      });
    });
    const totalUC = allDates.reduce((acc, d) => {
      const c = (totalByDate(d) - 163) * 400;
      return acc + (c > 0 ? c : 0);
    }, 0);
    totalRow.push(totalDropship || 0, grandTotal, totalUC);
    aoa.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    
    const merges = [];
    let startCol = 1;
    stores.forEach(store => {
      const activePlats = getActivePlatforms(store);
      if (activePlats.length > 0) {
        merges.push({
          s: { r: 0, c: startCol },
          e: { r: 0, c: startCol + activePlats.length - 1 }
        });
        startCol += activePlats.length;
      }
    });
    merges.push({ s: { r: 0, c: startCol }, e: { r: 1, c: startCol } });
    merges.push({ s: { r: 0, c: startCol + 1 }, e: { r: 1, c: startCol + 1 } });
    merges.push({ s: { r: 0, c: startCol + 2 }, e: { r: 1, c: startCol + 2 } });
    
    ws['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku_Product");
    XLSX.writeFile(wb, `Buku_Product_${month}_${year}.xlsx`);
  };

  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);
  const months = [
    ['01','Januari'],['02','Februari'],['03','Maret'],['04','April'],
    ['05','Mei'],['06','Juni'],['07','Juli'],['08','Agustus'],
    ['09','September'],['10','Oktober'],['11','November'],['12','Desember']
  ];

  return (
    <div className="container-fluid mt-2">
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><LineChart size={20} strokeWidth={1.75} /> Buku Product</h4>
          <small className="text-muted">Rekap akumulasi penjualan produk per bulan — per toko &amp; platform</small>
        </div>
        <div>
          {isEditMode ? (
            <div className="d-flex gap-2">
              <button className="btn btn-light border btn-sm d-flex align-items-center gap-1" onClick={() => { setIsEditMode(false); setEdits({}); }} disabled={saving}>
                <X size={16} /> Batal
              </button>
              <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={saveEdits} disabled={saving}>
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" onClick={handleExport} disabled={allDates.length === 0}>
                <Download size={16} /> Export Excel
              </button>
              <button className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1" onClick={() => setIsEditMode(true)}>
                <Edit3 size={16} /> Mode Edit Cepat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Bulan</label>
              <select className="form-select" value={month} onChange={e => setMonth(e.target.value)} disabled={isEditMode}>
                {months.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold small">Tahun</label>
              <select className="form-select" value={year} onChange={e => setYear(e.target.value)} disabled={isEditMode}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2" onClick={fetchData} disabled={loading || isEditMode}>
                {loading ? 'Memuat...' : <><Search size={15} strokeWidth={1.75} /> Tampilkan</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data.length > 0 && !isEditMode && (
        <div className="row g-3 mb-4">
          <div className="col-sm-4 col-md-2">
            <div className="card border-0 shadow-sm border-start border-4 border-primary">
              <div className="card-body py-3 px-3">
                <div className="text-muted small">📦 Grand Total</div>
                <div className="fw-bold fs-5 text-primary">{grandTotal}</div>
              </div>
            </div>
          </div>
          {stores.map(store => {
            const storeTtl = data.filter(d => String(d.store_id) === String(store.id)).reduce((s, d) => s + d.quantity, 0);
            return (
              <div className="col-sm-4 col-md-2" key={store.id}>
                <div className="card border-0 shadow-sm border-start border-4 border-success">
                  <div className="card-body py-3 px-3">
                    <div className="text-muted small">🏪 {store.name}</div>
                    <div className="fw-bold fs-5">{storeTtl}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="col-sm-4 col-md-2">
            <div className="card border-0 shadow-sm border-start border-4 border-warning">
              <div className="card-body py-3 px-3">
                <div className="text-muted small">📦 Dropship</div>
                <div className="fw-bold fs-5 text-warning-emphasis">{totalDropship}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-dark">
                <tr>
                  <th className="px-1 text-nowrap text-center" rowSpan="2" style={{ width: '40px', position: 'sticky', left: 0, backgroundColor: '#212529', zIndex: 11, borderRight: '1px solid #dee2e6' }}>Tgl</th>
                  {stores.map(store => {
                    const activePlats = getActivePlatforms(store);
                    if (activePlats.length === 0) return null;
                    return (
                      <th key={store.id} colSpan={activePlats.length} className="text-center border-start">
                        {store.name}
                      </th>
                    );
                  })}
                  <th className="text-center border-start" rowSpan="2" style={{ minWidth: 70 }}>Dropship</th>
                  {!isEditMode && <th className="text-center border-start" rowSpan="2">Total</th>}
                  {!isEditMode && <th className="text-center border-start text-success" rowSpan="2">Uang Cadangan</th>}
                </tr>
                <tr>
                  {stores.map(store =>
                    getActivePlatforms(store).map(p => (
                      <th key={`${store.id}_${p}`} className="text-center text-nowrap" style={{ fontWeight: 400, fontSize: '0.78rem', minWidth: 60 }}>
                        {PLATFORM_LABELS[p]}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={stores.reduce((acc, store) => acc + getActivePlatforms(store).length, 0) + 3} className="text-center py-5 text-muted">⏳ Memuat data...</td></tr>
                ) : allDates.length === 0 ? (
                  <tr><td colSpan={stores.reduce((acc, store) => acc + getActivePlatforms(store).length, 0) + 3} className="text-center py-5 text-muted">Belum ada data. Klik <strong>Tampilkan</strong>.</td></tr>
                ) : allDates.map(date => (
                  <tr key={date}>
                    <td className="px-1 fw-semibold text-nowrap text-center text-muted" style={{ width: '40px', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 10, borderRight: '1px solid #dee2e6' }}>
                      {date.slice(8, 10)}
                    </td>
                    {stores.map(store =>
                      getActivePlatforms(store).map(p => {
                        const qty = getDisplayQty(date, store.id, p);
                        return (
                          <td key={`${store.id}_${p}`} className="text-center border-start p-1">
                            {isEditMode ? (
                              <input type="number" className="form-control form-control-sm text-center px-1"
                                value={qty || ''}
                                onChange={e => handleEditChange(date, store.id, p, e.target.value)} />
                            ) : (
                              qty > 0 ? <span className="fw-semibold text-dark">{qty}</span> : <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })
                    )}
                    <td className="text-center border-start p-1 fw-semibold text-warning-emphasis">
                      {isEditMode ? (
                        <input type="number" className="form-control form-control-sm text-center px-1"
                          value={getDisplayDropship(date) || ''}
                          onChange={e => handleEditChange(date, null, 'dropship', e.target.value)} />
                      ) : (
                        getDisplayDropship(date) || <span className="text-muted">—</span>
                      )}
                    </td>
                    {!isEditMode && <td className="text-center border-start fw-bold text-primary">{totalByDate(date)}</td>}
                    {!isEditMode && (
                      <td className={`text-center border-start fw-bold ${totalByDate(date) >= 163 ? 'text-success' : 'text-danger'}`}>
                        {totalByDate(date) >= 163 ? '' : '-'}Rp {Math.abs((totalByDate(date) - 163) * 400).toLocaleString('id-ID')}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {allDates.length > 0 && !isEditMode && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td className="text-center px-1" style={{ position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10, borderRight: '1px solid #dee2e6' }}>TOTAL</td>
                    {stores.map(store =>
                      getActivePlatforms(store).map(p => (
                        <td key={`${store.id}_${p}`} className="text-center border-start text-success">
                          {totalByStoreAndPlatform(store.id, p) || '—'}
                        </td>
                      ))
                    )}
                    <td className="text-center border-start text-warning-emphasis">{totalDropship || '—'}</td>
                    <td className="text-center border-start text-primary fs-6">{grandTotal}</td>
                    <td className="text-center border-start fs-6 text-success">
                      {(() => {
                        const totalPos = allDates.reduce((acc, d) => {
                          const c = (totalByDate(d) - 163) * 400;
                          return acc + (c > 0 ? c : 0);
                        }, 0);
                        return totalPos === 0 ? '—' : `Rp ${totalPos.toLocaleString('id-ID')}`;
                      })()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBookAdmin;
