import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { DollarSign, Save, Calendar, Wallet } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const PayrollAdmin = () => {
  const [activeTab, setActiveTab] = useState('input'); // 'input' or 'withdraw'

  // Input States
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  // Withdraw States
  const [employees, setEmployees] = useState([]);
  const [wdDate, setWdDate] = useState(today());
  const [wdEmp, setWdEmp] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdSaving, setWdSaving] = useState(false);

  const fetchEntries = useCallback(async (d) => {
    try {
      const res = await api.get(`/payroll/daily-entry?date=${d}`);
      setRows(res.data.map(r => ({
        ...r,
        bonus: Number(r.bonus) || 0,
        deduction: Number(r.deduction) || 0,
        is_off: r.is_off || false,
      })));
    } catch { console.error('Gagal memuat data gaji'); }
  }, []);

  const fetchEmployeesStatus = useCallback(async () => {
    try {
      const res = await api.get('/payroll/employees/status');
      setEmployees(res.data);
    } catch { console.error('Gagal memuat data karyawan'); }
  }, []);

  useEffect(() => {
    if (activeTab === 'input') {
      fetchEntries(date);
    } else {
      fetchEmployeesStatus();
    }
  }, [activeTab, date, fetchEntries, fetchEmployeesStatus]);

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
      }));
      await api.post('/payroll/daily-entry', { date, entries });
      alert('✅ Data gaji berhasil disimpan!');
      fetchEntries(date);
    } catch { alert('Gagal menyimpan data gaji'); }
    finally { setSaving(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!wdEmp || !wdAmount) return alert('Pilih karyawan dan masukkan nominal');
    
    const password = window.prompt("Masukkan password admin untuk memproses pencairan:");
    if (!password) return;

    setWdSaving(true);
    try {
      await api.post('/payroll/withdraw', {
        employee_id: wdEmp,
        date: wdDate,
        amount: Number(wdAmount),
        password
      });
      alert('✅ Pencairan berhasil dicatat! Saldo telah dipotong.');
      setWdAmount('');
      fetchEmployeesStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pencairan');
    } finally {
      setWdSaving(false);
    }
  };

  const grandTotal = rows.reduce((s, r) => s + totalFor(r), 0);
  const selectedEmp = employees.find(e => String(e.id) === String(wdEmp));

  return (
    <div className="container-fluid mt-2">
      {/* Header & Tabs */}
      <div className="mb-4">
        <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <DollarSign size={22} strokeWidth={2} /> Kelola Penggajian
        </h4>
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button 
              className={`nav-link fw-medium ${activeTab === 'input' ? 'active bg-dark text-white' : 'bg-light text-dark border'}`}
              onClick={() => setActiveTab('input')}
              style={{ borderRadius: '8px' }}>
              Input Harian
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link fw-medium d-flex align-items-center gap-2 ${activeTab === 'withdraw' ? 'active bg-dark text-white' : 'bg-light text-dark border'}`}
              onClick={() => setActiveTab('withdraw')}
              style={{ borderRadius: '8px' }}>
              <Wallet size={16} /> Tarik Tunai (Withdraw)
            </button>
          </li>
        </ul>
      </div>

      {activeTab === 'input' && (
        <>
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

          <div className="alert alert-light border d-flex align-items-center gap-2 py-2 mb-3">
            <span>📅</span>
            <span className="small">
              Data gaji untuk tanggal <strong>{new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              {date < today() && <span className="badge bg-warning text-dark ms-2">Retroaktif</span>}
              {date === today() && <span className="badge bg-success ms-2">Hari Ini</span>}
            </span>
          </div>

          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th className="ps-4">Nama Karyawan</th>
                      <th style={{ width: 140 }}>Gaji Pokok</th>
                      <th style={{ width: 140 }}>Bonus (Rp)</th>
                      <th style={{ width: 150 }}>Pengurangan (Rp)</th>
                      <th style={{ width: 140 }}>Total Gaji</th>
                      <th className="text-center pe-4" style={{ width: 100 }}>Libur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-5 text-muted">Belum ada karyawan. Tambah dulu di menu Karyawan.</td></tr>
                    ) : rows.map((r, idx) => (
                      <tr key={r.employee_id} style={{ opacity: r.is_off ? 0.55 : 1 }}>
                        <td className="ps-4 fw-semibold">{r.name}</td>
                        <td>
                          <span className="text-muted small">Rp {Number(r.base_salary).toLocaleString('id-ID')}</span>
                        </td>
                        <td>
                          <input
                            type="number" className="form-control form-control-sm" min="0" step="1000"
                            value={r.bonus} disabled={r.is_off}
                            onChange={e => handleChange(idx, 'bonus', Number(e.target.value))}
                            style={{ maxWidth: 120 }}
                          />
                        </td>
                        <td>
                          <input
                            type="number" className="form-control form-control-sm" min="0" step="1000"
                            value={r.deduction} disabled={r.is_off}
                            onChange={e => handleChange(idx, 'deduction', Number(e.target.value))}
                            style={{ maxWidth: 130 }}
                          />
                        </td>
                        <td>
                          <span className={`fw-bold ${r.is_off ? 'text-muted' : 'text-success'}`}>
                            Rp {totalFor(r).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="text-center pe-4">
                          <div className="form-check d-flex justify-content-center mb-0">
                            <input
                              className="form-check-input" type="checkbox" role="switch"
                              id={`off-${r.employee_id}`}
                              checked={r.is_off}
                              onChange={e => handleChange(idx, 'is_off', e.target.checked)}
                              style={{ width: '2rem', height: '1rem', cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="4" className="ps-4 fw-bold text-end text-dark">Grand Total Gaji Hari Ini:</td>
                        <td colSpan="2" className="fw-bold text-success fs-6">
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
            <div className="d-flex justify-content-end">
              <button className="btn btn-dark px-5 d-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : <><Save size={16} strokeWidth={1.75} /> Simpan Data Gaji</>}
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'withdraw' && (
        <div className="row justify-content-center mt-3">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary" style={{ width: 48, height: 48 }}>
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">Pencairan Gaji</h5>
                    <small className="text-muted">Potong saldo karyawan saat penarikan tunai</small>
                  </div>
                </div>

                <form onSubmit={handleWithdraw}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Pilih Karyawan</label>
                    <select className="form-select" value={wdEmp} onChange={e => setWdEmp(e.target.value)} required>
                      <option value="">-- Pilih --</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedEmp && (
                    <div className="alert bg-light border mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small fw-medium text-muted">Total Saldo Saat Ini:</span>
                        <span className={`fs-5 fw-bold ${Number(selectedEmp.total_saldo) > 0 ? 'text-success' : 'text-danger'}`}>
                          Rp {Number(selectedEmp.total_saldo).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Tanggal Pencairan</label>
                    <input type="date" className="form-control" value={wdDate} onChange={e => setWdDate(e.target.value)} max={today()} required />
                    <div className="form-text" style={{ fontSize: '0.7rem' }}>Tanggal ini akan tercatat di Buku Gaji sebagai hari dilakukannya penarikan.</div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold small">Nominal Penarikan (Rp)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light fw-medium">Rp</span>
                      <input type="number" className="form-control fs-5 fw-semibold" placeholder="0" 
                        value={wdAmount} onChange={e => setWdAmount(e.target.value)} required min="1" />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={wdSaving}>
                    {wdSaving ? 'Memproses...' : 'Cairkan Gaji Sekarang'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAdmin;