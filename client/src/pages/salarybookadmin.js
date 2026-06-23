import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { BookText, Search, Edit3, Save, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const thisYear = new Date().getFullYear();
const thisMonth = new Date().getMonth() + 1;

const SalaryBookAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [filterMode, setFilterMode] = useState('month');
  const [month, setMonth] = useState(String(thisMonth).padStart(2, '0'));
  const [year, setYear] = useState(String(thisYear));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/payroll/employees').then(r => setEmployees(r.data)).catch(console.error);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMode === 'month') { params.append('month', month); params.append('year', year); }
      else if (filterMode === 'year') { params.append('year', year); }
      else if (filterMode === 'range' && startDate && endDate) {
        params.append('start_date', startDate); params.append('end_date', endDate);
      }
      const res = await api.get(`/payroll/salary-book?${params.toString()}`);
      setData(res.data);
      setEdits({});
      setIsEditMode(false);
    } catch { console.error('Gagal memuat buku gaji'); }
    finally { setLoading(false); }
  }, [filterMode, month, year, startDate, endDate]);

  // Auto-load on open
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditChange = (date, empId, field, value) => {
    const key = `${date}_${empId}`;
    setEdits(prev => {
      const current = prev[key] || {
        ...getCell(date, empId) || { base_salary: getEmpBase(empId), bonus: 0, deduction: 0, is_off: false }
      };
      return { ...prev, [key]: { ...current, [field]: value } };
    });
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
      const [date, empId] = k.split('_');
      const val = edits[k];
      return {
        employee_id: empId,
        date: date,
        base_salary: Number(val.base_salary) || 0,
        bonus: Number(val.bonus) || 0,
        deduction: Number(val.deduction) || 0,
        is_off: val.is_off
      };
    });

    try {
      await api.post('/payroll/salary-book/bulk-update', { password, updates });
      alert('Data gaji berhasil diperbarui!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  // All unique dates from data
  const allDates = [...new Set(data.map(d => d.work_date))].sort();

  // Employees that appear in data
  const activeEmployees = employees.filter(emp =>
    data.some(d => String(d.employee_id) === String(emp.id))
  );

  const getEmpBase = (empId) => {
    const emp = employees.find(e => String(e.id) === String(empId));
    return emp ? emp.base_salary : 0;
  };

  // Get row data for a given date + employee
  const getCell = (date, empId) =>
    data.find(d => d.work_date === date && String(d.employee_id) === String(empId));

  // Get displayed cell (merge with edits if exist)
  const getDisplayCell = (date, empId) => {
    const key = `${date}_${empId}`;
    if (isEditMode && edits[key]) return edits[key];
    const c = getCell(date, empId);
    if (c) return c;
    // Default empty cell
    return { base_salary: getEmpBase(empId), bonus: 0, deduction: 0, is_off: true };
  };

  // Totals per employee
  const getTotals = (empId) => {
    const rows = data.filter(d => String(d.employee_id) === String(empId));
    return {
      base: rows.reduce((s, r) => s + (r.is_off ? 0 : Number(r.base_salary)), 0),
      bonus: rows.reduce((s, r) => s + Number(r.bonus), 0),
      deduction: rows.reduce((s, r) => s + Number(r.deduction), 0),
      net: rows.reduce((s, r) => s + (r.is_off ? 0 : Number(r.base_salary)) + Number(r.bonus) - Number(r.deduction), 0),
      workDays: rows.filter(r => !r.is_off).length,
      offDays: rows.filter(r => r.is_off).length,
    };
  };

  const handleExport = () => {
    const aoa = [];
    const row1 = ['Tanggal'];
    activeEmployees.forEach(emp => { row1.push(emp.name, '', '', ''); });
    aoa.push(row1);
    
    const row2 = [''];
    activeEmployees.forEach(() => { row2.push('Gaji Pokok', 'Bonus', 'Potongan', 'Keterangan'); });
    aoa.push(row2);

    allDates.forEach(date => {
      const rowData = [date];
      activeEmployees.forEach(emp => {
        const cell = getDisplayCell(date, emp.id);
        const isOff = cell.is_off;
        let keterangan = '';
        if (cell.withdrawal_id) keterangan = 'Withdraw';
        else if (isOff) keterangan = 'Libur';
        else if (Number(cell.deduction) > 0) keterangan = 'Potongan';

        rowData.push(
          isOff ? 0 : Number(cell.base_salary),
          isOff ? 0 : Number(cell.bonus),
          Number(cell.deduction),
          keterangan
        );
      });
      aoa.push(rowData);
    });

    const totalRow = ['TOTAL'];
    activeEmployees.forEach(emp => {
      const t = getTotals(emp.id);
      totalRow.push(t.base, t.bonus, t.deduction, t.net);
    });
    aoa.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = activeEmployees.map((_, i) => ({
      s: { r: 0, c: i * 4 + 1 },
      e: { r: 0, c: i * 4 + 4 }
    }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku_Gaji");
    XLSX.writeFile(wb, `Buku_Gaji_${month}_${year}.xlsx`);
  };

  const years = Array.from({ length: 5 }, (_, i) => thisYear - i);
  const months = [
    ['01','Januari'],['02','Februari'],['03','Maret'],['04','April'],
    ['05','Mei'],['06','Juni'],['07','Juli'],['08','Agustus'],
    ['09','September'],['10','Oktober'],['11','November'],['12','Desember']
  ];

  const fmtRp = (n) => n > 0 ? `Rp ${Number(n).toLocaleString('id-ID')}` : '—';
  const totalCols = activeEmployees.length * 4 + 1;

  return (
    <div className="container-fluid mt-2">
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><BookText size={20} strokeWidth={1.75} /> Buku Gaji</h4>
          <small className="text-muted">Laporan rekap gaji karyawan per bulan</small>
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

      {/* Filter Panel */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-md-2">
              <label className="form-label fw-semibold small">Mode Filter</label>
              <select className="form-select" value={filterMode} onChange={e => setFilterMode(e.target.value)} disabled={isEditMode}>
                <option value="month">Per Bulan</option>
                <option value="year">Per Tahun</option>
                <option value="range">Rentang Tanggal</option>
              </select>
            </div>
            {filterMode === 'month' && (<>
              <div className="col-md-2">
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
            </>)}
            {filterMode === 'year' && (
              <div className="col-md-2">
                <label className="form-label fw-semibold small">Tahun</label>
                <select className="form-select" value={year} onChange={e => setYear(e.target.value)} disabled={isEditMode}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
            {filterMode === 'range' && (<>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">Dari Tanggal</label>
                <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={isEditMode} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold small">Sampai Tanggal</label>
                <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={isEditMode} />
              </div>
            </>)}
            <div className="col-md-2">
              <button className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2" onClick={fetchData} disabled={loading || isEditMode}>
                {loading ? 'Memuat...' : <><Search size={15} strokeWidth={1.75} /> Tampilkan</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {activeEmployees.length > 0 && data.length > 0 && !isEditMode && (
        <div className="row g-3 mb-4">
          {activeEmployees.map(emp => {
            const t = getTotals(emp.id);
            return (
              <div className="col-sm-6 col-xl-3" key={emp.id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body py-3 px-3">
                    <div className="fw-bold text-dark mb-2" style={{ fontSize: '0.85rem' }}>{emp.name}</div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Hari Kerja</span><span className="fw-semibold text-dark">{t.workDays} hari</span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Gaji Pokok</span><span className="fw-semibold">Rp {t.base.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Bonus</span><span className="fw-semibold text-success">Rp {t.bonus.toLocaleString('id-ID')}</span>
                    </div>
                    {t.deduction > 0 && (
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Potongan</span><span className="fw-semibold text-danger">Rp {t.deduction.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="border-top pt-2 mt-2 d-flex justify-content-between">
                      <span className="small fw-bold">Total</span>
                      <span className="fw-bold text-primary">Rp {t.net.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cross-tab Table */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0" style={{ fontSize: '0.8rem' }}>
              <thead className="table-dark">
                <tr>
                  <th className="text-nowrap text-center px-1" rowSpan="2" style={{ width: '40px' }}>Tgl</th>
                  {activeEmployees.map(emp => (
                    <th key={emp.id} colSpan={4} className="text-center border-start">
                      {emp.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  {activeEmployees.map(emp => (
                    ['Gaji Pokok', 'Bonus', 'Potongan', 'Keterangan'].map(col => (
                      <th key={`${emp.id}_${col}`} className="text-center text-nowrap"
                        style={{ fontWeight: 400, fontSize: '0.73rem', color: '#adb5bd', width: col==='Keterangan' ? '60px' : '80px' }}>
                        {col}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={totalCols} className="text-center py-5 text-muted">Memuat data...</td></tr>
                ) : allDates.length === 0 ? (
                  <tr><td colSpan={totalCols} className="text-center py-5 text-muted">
                    Belum ada data. Klik <strong>Tampilkan</strong>.
                  </td></tr>
                ) : allDates.map(date => {
                  const isFullOff = activeEmployees.length > 0 && activeEmployees.every(emp => {
                    const c = getDisplayCell(date, emp.id);
                    return c.is_off;
                  });
                  return (
                    <tr key={date} style={isFullOff && !isEditMode ? { backgroundColor: '#fff5f5' } : {}}>
                      <td className="px-1 fw-semibold text-nowrap text-center" style={{ width: '40px', color: isFullOff && !isEditMode ? '#dc3545' : '#374151' }}>
                        {date.slice(8, 10)}
                        {isFullOff && !isEditMode && <div><span className="badge" style={{ backgroundColor: '#dc3545', fontSize: '0.6rem' }}>Libur</span></div>}
                      </td>
                      {activeEmployees.map(emp => {
                        const cell = getDisplayCell(date, emp.id);
                        const isOff = cell.is_off;
                        const offStyle = isOff && !isEditMode ? { backgroundColor: '#ffe5e5' } : {};
                        return (
                          <React.Fragment key={emp.id}>
                            {/* Gaji Pokok */}
                            <td className="text-center border-start p-1" style={offStyle}>
                              {isEditMode ? (
                                <input type="number" className="form-control form-control-sm text-center px-1"
                                  value={cell.base_salary}
                                  onChange={e => handleEditChange(date, emp.id, 'base_salary', e.target.value)}
                                  disabled={isOff} />
                              ) : (
                                isOff ? <span className="text-danger" style={{ fontSize: '0.7rem' }}>—</span>
                                  : <span className="text-dark">{fmtRp(cell.base_salary)}</span>
                              )}
                            </td>
                            {/* Bonus */}
                            <td className="text-center p-1" style={offStyle}>
                              {isEditMode ? (
                                <input type="number" className="form-control form-control-sm text-center px-1"
                                  value={cell.bonus}
                                  onChange={e => handleEditChange(date, emp.id, 'bonus', e.target.value)}
                                  disabled={isOff} />
                              ) : (
                                isOff ? <span className="text-danger" style={{ fontSize: '0.7rem' }}>—</span>
                                  : Number(cell.bonus) > 0
                                    ? <span className="text-success fw-semibold">{fmtRp(cell.bonus)}</span>
                                    : <span className="text-muted">—</span>
                              )}
                            </td>
                            {/* Potongan */}
                            <td className="text-center p-1" style={offStyle}>
                              {isEditMode ? (
                                <input type="number" className="form-control form-control-sm text-center px-1"
                                  value={cell.deduction}
                                  onChange={e => handleEditChange(date, emp.id, 'deduction', e.target.value)}
                                  disabled={isOff} />
                              ) : (
                                Number(cell.deduction) > 0
                                  ? <span className="text-danger fw-semibold">{fmtRp(cell.deduction)}</span>
                                  : <span className="text-muted">—</span>
                              )}
                            </td>
                            {/* Keterangan */}
                            <td className="text-center p-1" style={offStyle}>
                              {isEditMode ? (
                                <div className="form-check form-switch d-flex justify-content-center m-0">
                                  <input className="form-check-input" type="checkbox" role="switch"
                                    checked={isOff}
                                    onChange={e => handleEditChange(date, emp.id, 'is_off', e.target.checked)} />
                                </div>
                              ) : (
                                cell.withdrawal_id 
                                  ? <span className="badge" style={{ backgroundColor: '#6366f1', fontSize: '0.65rem' }}>Withdraw</span>
                                  : isOff
                                    ? <span className="badge" style={{ backgroundColor: '#dc3545', fontSize: '0.65rem' }}>Libur</span>
                                    : Number(cell.deduction) > 0
                                      ? <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>Potongan</span>
                                      : <span className="text-muted" style={{ fontSize: '0.72rem' }}>—</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              {allDates.length > 0 && !isEditMode && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td className="text-center text-dark px-1">TOTAL</td>
                    {activeEmployees.map(emp => {
                      const t = getTotals(emp.id);
                      return (
                        <React.Fragment key={emp.id}>
                          <td className="text-center border-start text-dark">{fmtRp(t.base)}</td>
                          <td className="text-center text-success">{fmtRp(t.bonus)}</td>
                          <td className="text-center text-danger">{t.deduction > 0 ? fmtRp(t.deduction) : '—'}</td>
                          <td className="text-center text-primary">{fmtRp(t.net)}</td>
                        </React.Fragment>
                      );
                    })}
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

export default SalaryBookAdmin;
