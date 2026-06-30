import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { DollarSign, Save, Calendar } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const PayrollAdmin = () => {
  // Input States
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [cadanganStatus, setCadanganStatus] = useState({ id: null, total: 0 });
  const [cadanganWithdraw, setCadanganWithdraw] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [cadanganHistory, setCadanganHistory] = useState([]);
  const [editingWithdraw, setEditingWithdraw] = useState(null);

  const fetchEntries = useCallback(async (d) => {
    try {
      const res = await api.get(`/payroll/daily-entry?date=${d}`);
      setRows(res.data.filter(r => !r.name.toLowerCase().includes('cadangan')).map(r => ({
        ...r,
        bonus: Number(r.bonus) || 0,
        deduction: Number(r.deduction) || 0,
        is_off: r.is_off || false,
        off_reason: r.off_reason || '',
      })));
    } catch { console.error('Gagal memuat data gaji'); }
  }, []);

  const fetchCadanganData = useCallback(async () => {
    try {
      const statusRes = await api.get('/payroll/cadangan/status');
      const cid = statusRes.data.id;
      setCadanganStatus({ id: cid, total: statusRes.data.total_cadangan });
      
      if (cid) {
        const histRes = await api.get('/payroll/withdraw');
        setCadanganHistory(histRes.data.filter(h => h.employee_id === cid));
      }
    } catch { console.error('Gagal memuat status uang cadangan'); }
  }, []);

  useEffect(() => {
    fetchEntries(date);
    fetchCadanganData();
  }, [date, fetchEntries, fetchCadanganData]);

  const handleChange = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const totalFor = (r) => r.is_off ? 0 : (Number(r.base_salary) + Number(r.bonus) - Number(r.deduction));

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = rows.map(r => ({
        employee_id: r.employee_id,
        base_salary: Number(r.base_salary),
        bonus: Number(r.bonus) || 0,
        deduction: Number(r.deduction) || 0,
        is_off: r.is_off,
        off_reason: r.off_reason || '',
      }));
      await api.post('/payroll/daily-entry', { date, entries });
      alert('✅ Data gaji berhasil disimpan!');
      fetchEntries(date);
    } catch { alert('Gagal menyimpan data gaji'); }
    finally { setSaving(false); }
  };

  const handleCadanganWithdraw = async () => {
    if (!cadanganStatus.id) return alert('Data Uang Cadangan tidak ditemukan');
    const amount = Number(cadanganWithdraw);
    if (!amount || amount <= 0) return alert('Masukkan nominal ambil yang valid');
    
    const password = window.prompt("Masukkan password admin untuk memproses penarikan:");
    if (!password) return;

    setWithdrawing(true);
    try {
      await api.post('/payroll/withdraw', {
        employee_id: cadanganStatus.id,
        amount: amount,
        date: date,
        password
      });
      alert('✅ Penarikan Uang Cadangan berhasil disimpan!');
      setCadanganWithdraw('');
      fetchCadanganData();
    } catch (err) { 
      alert(err.response?.data?.message || 'Gagal menyimpan penarikan Uang Cadangan'); 
    } finally { 
      setWithdrawing(false); 
    }
  };

  const handleDeleteCadanganWithdraw = async (id) => {
    if (!window.confirm('Yakin ingin menghapus riwayat penarikan ini?')) return;
    const password = window.prompt("Masukkan password admin untuk menghapus:");
    if (!password) return;

    try {
      await api.delete(`/payroll/withdraw/${id}`, { data: { password } });
      alert('✅ Riwayat penarikan berhasil dihapus');
      fetchCadanganData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus riwayat');
    }
  };

  const handleEditCadanganWithdrawSave = async (id) => {
    const password = window.prompt("Masukkan password admin untuk mengubah riwayat:");
    if (!password) return;

    try {
      await api.put(`/payroll/withdraw/${id}`, {
        amount: Number(editingWithdraw.total_amount),
        date: editingWithdraw.date,
        password
      });
      alert('✅ Riwayat penarikan berhasil diperbarui');
      setEditingWithdraw(null);
      fetchCadanganData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah riwayat');
    }
  };

  const grandTotal = rows.reduce((s, r) => s + totalFor(r), 0);
  const isAllOff = rows.length > 0 && rows.every(r => r.is_off);

  return (
    <div className="container-fluid mt-2">
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <DollarSign size={22} strokeWidth={2} /> Kelola Penggajian
        </h4>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
        <div>
          <small className="text-muted">Input gaji harian — gaji pokok otomatis dari data karyawan</small>
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

      <div className="alert alert-light border py-2 mb-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span>📅</span>
          <span className="small">
            Data gaji untuk tanggal <strong>{new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            {date < today() && <span className="badge bg-warning text-dark ms-2">Retroaktif</span>}
            {date === today() && <span className="badge bg-success ms-2">Hari Ini</span>}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2 pe-3">
          <div className="form-check form-switch m-0 d-flex align-items-center">
            <input className="form-check-input border border-secondary m-0" type="checkbox" role="switch" id="liburSemua" 
              checked={isAllOff} 
              onChange={e => {
                const checked = e.target.checked;
                setRows(prev => prev.map(r => ({ ...r, is_off: checked, off_reason: checked ? (prev[0]?.off_reason || '') : '' })));
              }} 
              style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
            />
            <label className="form-check-label fw-bold text-danger ms-2" htmlFor="liburSemua" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Libur Semua</label>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="ps-2 ps-md-4">Karyawan</th>
                  <th className="d-none d-md-table-cell" style={{ width: 140 }}>Gaji Pokok</th>
                  <th className="d-none d-md-table-cell" style={{ width: 140 }}>Bonus (Rp)</th>
                  <th className="d-none d-md-table-cell" style={{ width: 150 }}>Pengurangan (Rp)</th>
                  <th className="d-none d-md-table-cell" style={{ width: 140 }}>Total Gaji</th>
                  <th className="text-center pe-4 d-none d-md-table-cell" style={{ width: 100 }}>Libur</th>
                  
                  <th className="d-md-none" style={{ width: 110 }}>Bns / Ptg</th>
                  <th className="d-md-none text-center pe-2" style={{ width: 100 }}>Total/Libur</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">Belum ada karyawan. Tambah dulu di menu Karyawan.</td></tr>
                ) : isAllOff ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 bg-light">
                      <div className="d-flex flex-column align-items-center gap-3">
                        <div className="text-danger fw-bold fs-5">🏖️ Semua Karyawan Diliburkan</div>
                        <input type="text" className="form-control text-center shadow-sm border border-secondary-subtle bg-white fw-medium" 
                          placeholder="Masukkan keterangan libur untuk semua (contoh: Hari Raya Idul Fitri)" 
                          style={{ maxWidth: '500px' }}
                          value={rows[0]?.off_reason || ''} 
                          onChange={e => {
                            const val = e.target.value;
                            setRows(prev => prev.map(r => ({ ...r, off_reason: val })));
                          }} 
                        />
                      </div>
                    </td>
                  </tr>
                ) : rows.map((r, idx) => (
                  <tr key={r.employee_id} style={{ opacity: r.is_off ? 0.55 : 1 }}>
                    <td className="ps-2 ps-md-4">
                      <div className="fw-semibold">{r.name}</div>
                      <div className="text-muted small d-md-none">Rp {Number(r.base_salary).toLocaleString('id-ID')}</div>
                    </td>
                    {r.is_off ? (
                      <td colSpan={4} className="d-none d-md-table-cell text-center p-2">
                        <input type="text" className="form-control form-control-sm mx-auto shadow-sm border border-secondary-subtle bg-white fw-medium" 
                          placeholder="Keterangan Libur (contoh: Hari raya)" 
                          style={{ maxWidth: '300px' }}
                          value={r.off_reason || ''} 
                          onChange={e => handleChange(idx, 'off_reason', e.target.value)} />
                      </td>
                    ) : (
                      <>
                        <td className="d-none d-md-table-cell">
                          <span className="text-muted small">Rp {Number(r.base_salary).toLocaleString('id-ID')}</span>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <input
                            type="number" className="form-control form-control-sm border border-secondary-subtle bg-white shadow-sm" min="0" step="1000"
                            value={r.bonus || ''} disabled={r.is_off}
                            onChange={e => handleChange(idx, 'bonus', Number(e.target.value))}
                            style={{ maxWidth: 120 }}
                          />
                        </td>
                        <td className="d-none d-md-table-cell">
                          <input
                            type="number" className="form-control form-control-sm border border-secondary-subtle bg-white shadow-sm" min="0" step="1000"
                            value={r.deduction || ''} disabled={r.is_off}
                            onChange={e => handleChange(idx, 'deduction', Number(e.target.value))}
                            style={{ maxWidth: 130 }}
                          />
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="fw-bold text-success">
                            Rp {totalFor(r).toLocaleString('id-ID')}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="text-center pe-4 d-none d-md-table-cell">
                      <div className="form-check form-switch d-flex justify-content-center mb-0">
                        <input
                          className="form-check-input border border-secondary-subtle" type="checkbox" role="switch"
                          id={`off-${r.employee_id}`}
                          checked={r.is_off}
                          onChange={e => {
                            handleChange(idx, 'is_off', e.target.checked);
                            if (!e.target.checked) handleChange(idx, 'off_reason', '');
                          }}
                          style={{ width: '2rem', height: '1rem', cursor: 'pointer' }}
                        />
                      </div>
                    </td>
                    
                    {r.is_off ? (
                      <td colSpan={2} className="d-md-none p-2 align-middle border-start-0">
                        <input type="text" className="form-control form-control-sm mb-2 shadow-sm border border-secondary-subtle bg-white fw-medium" 
                          placeholder="Keterangan Libur" 
                          value={r.off_reason || ''} 
                          onChange={e => handleChange(idx, 'off_reason', e.target.value)} />
                        <div className="form-check form-switch d-flex justify-content-end mb-0 pe-2">
                          <input
                            className="form-check-input m-0 border border-secondary-subtle" type="checkbox" role="switch"
                            id={`off-mobile-${r.employee_id}`}
                            checked={r.is_off}
                            onChange={e => {
                              handleChange(idx, 'is_off', e.target.checked);
                              if (!e.target.checked) handleChange(idx, 'off_reason', '');
                            }}
                            style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="d-md-none p-1 align-middle">
                          <div className="d-flex flex-column gap-1">
                            <input
                              type="number" className="form-control form-control-sm px-1 border border-secondary-subtle bg-white shadow-sm" min="0" step="1000" placeholder="Bonus"
                              value={r.bonus || ''}
                              onChange={e => handleChange(idx, 'bonus', Number(e.target.value))}
                            />
                            <input
                              type="number" className="form-control form-control-sm px-1 border border-secondary-subtle bg-white shadow-sm" min="0" step="1000" placeholder="Potong"
                              value={r.deduction || ''}
                              onChange={e => handleChange(idx, 'deduction', Number(e.target.value))}
                            />
                          </div>
                        </td>
                        <td className="d-md-none text-center p-1 pe-2 align-middle">
                          <div className="fw-bold small mb-2 text-success" style={{ whiteSpace: 'nowrap' }}>
                            Rp {totalFor(r).toLocaleString('id-ID')}
                          </div>
                          <div className="form-check form-switch d-flex justify-content-center mb-0 ps-0">
                            <input
                              className="form-check-input m-0 border border-secondary-subtle" type="checkbox" role="switch"
                              id={`off-mobile-${r.employee_id}`}
                              checked={r.is_off}
                              onChange={e => {
                                handleChange(idx, 'is_off', e.target.checked);
                                if (!e.target.checked) handleChange(idx, 'off_reason', '');
                              }}
                              style={{ width: '2.5rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="ps-4 fw-bold text-end text-dark d-none d-md-table-cell">Grand Total Gaji Hari Ini:</td>
                    <td colSpan="2" className="fw-bold text-success fs-6 d-none d-md-table-cell">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </td>
                    
                    <td colSpan="2" className="ps-2 pe-1 fw-bold text-end text-dark d-md-none">Total:</td>
                    <td className="fw-bold text-success text-center pe-2 d-md-none" style={{ whiteSpace: 'nowrap' }}>
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="d-flex justify-content-end mb-4">
          <button className="btn btn-dark px-5 d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : <><Save size={16} strokeWidth={1.75} /> Simpan Data Gaji</>}
          </button>
        </div>
      )}

      {/* Uang Cadangan Section */}
      {cadanganStatus.id && (
        <div className="card shadow-sm border-0 border-start border-4 border-success mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3 text-success">💰 Uang Cadangan</h5>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <div className="text-muted small mb-1">Total Uang Cadangan (Terkumpul)</div>
                <div className="fw-bold fs-4 text-dark">
                  Rp {cadanganStatus.total.toLocaleString('id-ID')}
                </div>
              </div>
              
              <div className="d-flex flex-column flex-md-row gap-2 align-items-md-end">
                <div>
                  <label className="form-label text-muted small mb-1">Nominal Ambil (Rp)</label>
                  <input 
                    type="number" 
                    className="form-control bg-white shadow-sm border-secondary-subtle" 
                    placeholder="Contoh: 150000"
                    min="0"
                    step="1000"
                    value={cadanganWithdraw}
                    onChange={(e) => setCadanganWithdraw(e.target.value)}
                  />
                </div>
                <button 
                  className="btn btn-outline-success px-4" 
                  disabled={withdrawing || !cadanganWithdraw || Number(cadanganWithdraw) <= 0}
                  onClick={handleCadanganWithdraw}
                >
                  {withdrawing ? 'Memproses...' : 'Tarik Uang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Cadangan Section */}
      {cadanganStatus.id && cadanganHistory.length > 0 && (
        <div className="card shadow-sm border-0 border-start border-4 border-secondary mb-4">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3 text-secondary">Riwayat Penarikan Uang Cadangan</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="small text-muted fw-semibold">Tanggal (YYYY-MM-DD)</th>
                    <th className="small text-muted fw-semibold">Nominal</th>
                    <th className="small text-muted fw-semibold text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {cadanganHistory.map(h => (
                    <tr key={h.id}>
                      <td>
                        {editingWithdraw?.id === h.id ? (
                          <input 
                            type="date" 
                            className="form-control form-control-sm border-secondary-subtle"
                            value={editingWithdraw.date.split('T')[0]}
                            onChange={e => setEditingWithdraw({...editingWithdraw, date: e.target.value})}
                          />
                        ) : (
                          new Date(h.date).toISOString().split('T')[0]
                        )}
                      </td>
                      <td>
                        {editingWithdraw?.id === h.id ? (
                          <input 
                            type="number" 
                            className="form-control form-control-sm border-secondary-subtle"
                            value={editingWithdraw.total_amount}
                            onChange={e => setEditingWithdraw({...editingWithdraw, total_amount: e.target.value})}
                          />
                        ) : (
                          <span className="fw-medium text-danger">- Rp {Number(h.total_amount).toLocaleString('id-ID')}</span>
                        )}
                      </td>
                      <td className="text-end">
                        {editingWithdraw?.id === h.id ? (
                          <div className="d-flex justify-content-end gap-1">
                            <button className="btn btn-sm btn-success" onClick={() => handleEditCadanganWithdrawSave(h.id)}>Simpan</button>
                            <button className="btn btn-sm btn-light" onClick={() => setEditingWithdraw(null)}>Batal</button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-end gap-1">
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingWithdraw(h)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCadanganWithdraw(h.id)}>Hapus</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAdmin;