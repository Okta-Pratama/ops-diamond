import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Wallet, Printer, CheckCircle2, History } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const WithdrawAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [wdDate, setWdDate] = useState(today());
  const [wdEmp, setWdEmp] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdSaving, setWdSaving] = useState(false);
  const [successData, setSuccessData] = useState(null); // Data for printing receipt
  const [history, setHistory] = useState([]);

  const fetchEmployeesStatus = useCallback(async () => {
    try {
      const res = await api.get('/payroll/employees/status');
      setEmployees(res.data.filter(e => !e.name.toLowerCase().includes('cadangan')));
    } catch { console.error('Gagal memuat data karyawan'); }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/payroll/withdraw');
      setHistory(res.data.filter(h => !h.name?.toLowerCase().includes('cadangan')));
    } catch { console.error('Gagal memuat riwayat withdraw'); }
  }, []);

  useEffect(() => {
    fetchEmployeesStatus();
    fetchHistory();
  }, [fetchEmployeesStatus, fetchHistory]);

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
      
      const empName = employees.find(e => String(e.id) === String(wdEmp))?.name || 'Karyawan';
      
      let masuk = 0, libur = 0, gajiPokok = 0, bonus = 0, totalGaji = 0;
      try {
        const d = new Date(wdDate);
        const statRes = await api.get(`/payroll/salary-book?month=${d.getMonth()+1}&year=${d.getFullYear()}&employee_id=${wdEmp}`);
        const logs = statRes.data;
        masuk = logs.filter(r => !r.is_off && Number(r.base_salary) > 0).length;
        libur = logs.filter(r => r.is_off).length;
        gajiPokok = logs.reduce((sum, r) => sum + (!r.is_off ? Number(r.base_salary) : 0), 0);
        bonus = logs.reduce((sum, r) => sum + Number(r.bonus || 0), 0);
        totalGaji = gajiPokok + bonus;
      } catch (e) { console.error('Failed to fetch stats', e); }

      setSuccessData({
        name: empName,
        date: wdDate,
        amount: Number(wdAmount),
        timestamp: new Date().toLocaleString('id-ID'),
        masuk, libur, gajiPokok, bonus, totalGaji
      });
      
      setWdAmount('');
      setWdDate(today());
      fetchEmployeesStatus();
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pencairan');
    } finally {
      setWdSaving(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date(successData.date).toISOString().split('T')[0];
    const nameStr = successData.name.replace(/\s+/g, '_').toLowerCase();
    document.title = `slipgaji_${nameStr}_${dateStr}`;
    
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const handlePrintHistory = async (h) => {
    let masuk = 0, libur = 0, gajiPokok = 0, bonus = 0, totalGaji = 0;
    try {
      const d = new Date(h.date);
      const statRes = await api.get(`/payroll/salary-book?month=${d.getMonth()+1}&year=${d.getFullYear()}&employee_id=${h.employee_id}`);
      const logs = statRes.data;
      masuk = logs.filter(r => !r.is_off && Number(r.base_salary) > 0).length;
      libur = logs.filter(r => r.is_off).length;
      gajiPokok = logs.reduce((sum, r) => sum + (!r.is_off ? Number(r.base_salary) : 0), 0);
      bonus = logs.reduce((sum, r) => sum + Number(r.bonus || 0), 0);
      totalGaji = gajiPokok + bonus;
    } catch (e) { console.error('Failed to fetch stats', e); }

    setSuccessData({
      name: h.name,
      amount: Number(h.total_amount),
      date: h.date,
      timestamp: new Date().toLocaleString('id-ID'),
      isHistory: true,
      masuk, libur, gajiPokok, bonus, totalGaji
    });
  };

  const selectedEmp = employees.find(e => String(e.id) === String(wdEmp));

  return (
    <div className="container-fluid mt-2 position-relative">
      {/* Hide this entire container when printing so only the receipt prints */}
      <div className="no-print">
        <div className="mb-4">
          <h4 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Wallet size={22} strokeWidth={2} /> Tarik Tunai (Withdraw)
          </h4>
          <p className="text-muted small">Kelola penarikan gaji karyawan secara terpisah dari input harian.</p>
        </div>

        {successData ? (
          <div className="row justify-content-center mt-3">
            <div className="col-md-8 col-lg-6">
              <div className="card border-0 shadow-sm text-center p-5" style={{ borderRadius: '16px' }}>
                <div className="mb-4 d-flex justify-content-center">
                  <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success" style={{ width: 80, height: 80 }}>
                    <CheckCircle2 size={48} />
                  </div>
                </div>
                <h4 className="fw-bold text-success mb-2">
                  {successData.isHistory ? 'Slip Siap Dicetak!' : 'Penarikan Berhasil!'}
                </h4>
                <p className="text-muted mb-4">
                  {successData.isHistory 
                    ? `Slip penarikan atas nama ${successData.name} sebesar Rp ${successData.amount.toLocaleString('id-ID')} siap untuk dicetak.`
                    : `Dana sebesar Rp ${successData.amount.toLocaleString('id-ID')} telah berhasil ditarik oleh ${successData.name}.`
                  }
                </p>
                <div className="d-flex flex-column gap-3">
                  <button onClick={handlePrint} className="btn btn-primary py-3 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '12px' }}>
                    <Printer size={20} /> Cetak Slip Gaji (PDF)
                  </button>
                  <button onClick={() => setSuccessData(null)} className="btn btn-light py-3 fw-medium text-muted" style={{ borderRadius: '12px' }}>
                    Kembali ke Form Penarikan
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="row justify-content-center mt-3">
              <div className="col-md-8 col-lg-6">
                <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <div className="card-body p-4 p-md-5">
                  <form onSubmit={handleWithdraw}>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>Pilih Karyawan</label>
                      <select className="form-select form-select-lg bg-light border-0" value={wdEmp} onChange={e => setWdEmp(e.target.value)} required style={{ borderRadius: '12px' }}>
                        <option value="">-- Pilih Karyawan --</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedEmp && (
                      <div className="alert bg-white border mb-4 p-3 shadow-sm" style={{ borderRadius: '12px', borderColor: '#e2e8f0' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small fw-semibold text-muted">Sisa Saldo Saat Ini:</span>
                          <span className={`fs-4 fw-bold ${Number(selectedEmp.total_saldo) > 0 ? 'text-dark' : 'text-danger'}`}>
                            Rp {Number(selectedEmp.total_saldo).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>Tanggal Penarikan</label>
                      <input type="date" className="form-control form-control-lg bg-light border-0" value={wdDate} onChange={e => setWdDate(e.target.value)} max={today()} required style={{ borderRadius: '12px' }} />
                    </div>

                    <div className="mb-5">
                      <label className="form-label fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>Nominal Penarikan</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-light border-0 fw-bold text-muted" style={{ borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>Rp</span>
                        <input type="number" className="form-control bg-light border-0 fs-4 fw-bold" placeholder="0" 
                          value={wdAmount} onChange={e => setWdAmount(e.target.value)} required min="1" 
                          max={selectedEmp ? Math.max(0, Number(selectedEmp.total_saldo)) : undefined} />
                        {selectedEmp && Number(selectedEmp.total_saldo) > 0 && (
                          <button 
                            type="button" 
                            className="btn btn-primary fw-bold px-4" 
                            onClick={() => setWdAmount(selectedEmp.total_saldo)}
                            style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}
                          >
                            Tarik Semua
                          </button>
                        )}
                        {(!selectedEmp || Number(selectedEmp.total_saldo) <= 0) && (
                           <span className="input-group-text bg-light border-0" style={{ borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}></span>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-dark w-100 py-3 fs-5 fw-bold" disabled={wdSaving} style={{ borderRadius: '12px', transition: 'all 0.2s' }}>
                      {wdSaving ? 'Memproses...' : 'Tarik Tunai'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="row justify-content-center mt-5">
            <div className="col-md-10 col-lg-8">
              <h5 className="mb-4 fw-bold text-dark d-flex align-items-center">
                <History className="me-2 text-primary" size={22} /> Riwayat Tarik Tunai
              </h5>
              <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3 px-4 border-0 text-uppercase small fw-bold text-muted">Tanggal</th>
                        <th className="py-3 border-0 text-uppercase small fw-bold text-muted">Karyawan</th>
                        <th className="py-3 px-4 border-0 text-end text-uppercase small fw-bold text-muted">Nominal</th>
                        <th className="py-3 px-4 border-0 text-center text-uppercase small fw-bold text-muted">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {history.length > 0 ? history.map(h => (
                        <tr key={h.id}>
                          <td className="px-4 py-3 border-bottom-0 text-muted">{h.date.split('T')[0]}</td>
                          <td className="py-3 border-bottom-0 fw-semibold text-dark">{h.name}</td>
                          <td className="px-4 py-3 border-bottom-0 text-end fw-bold text-success">
                            Rp {Number(h.total_amount).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 border-bottom-0 text-center">
                            <button 
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                              onClick={() => handlePrintHistory(h)}
                              title="Cetak Slip"
                            >
                              <Printer size={14} /> Cetak
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="text-center py-4 text-muted">Belum ada riwayat penarikan</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
        )}
      </div>

      {/* Printable Receipt (Only visible when printing) */}
      {successData && (
        <div className="print-only">
          <div style={{ padding: '40px', maxWidth: '100%', margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', color: '#111', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Logo Placeholder */}
                <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <Wallet color="white" size={28} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Slip Penarikan Tunai</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    {new Date(successData.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Tanggal Cetak</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#334155' }}>
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            {/* Employee Info Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '30px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{successData.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Karyawan</p>
              </div>
              <div style={{ display: 'flex', gap: '30px', textAlign: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{successData.masuk || 0} Hari</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Jumlah Masuk</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{successData.libur || 0} Hari</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Jumlah Libur</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Sukses</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Status</p>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#818cf8', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>DESKRIPSI</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>KETERANGAN</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>NOMINAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="3" style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>PENDAPATAN BULAN {new Date(successData.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 16px', fontSize: '14px', color: '#334155' }}>Gaji Pokok</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    {successData.masuk} Hari
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '14px', color: '#334155' }}>
                    Rp {(successData.gajiPokok || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 16px', fontSize: '14px', color: '#334155' }}>Bonus</td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    -
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '14px', color: '#334155' }}>
                    Rp {(successData.bonus || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Total Pendapatan (Bulan Ini)</td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                    Rp {(successData.totalGaji || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                
                <tr>
                  <td colSpan="3" style={{ padding: '16px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>TRANSAKSI PENARIKAN</td>
                </tr>
                {/* Total Row */}
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <td colSpan="2" style={{ padding: '16px', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>TOTAL PENARIKAN</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    Rp {successData.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signature Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px' }}>
              <div style={{ textAlign: 'center', width: '250px' }}>
                <p style={{ margin: '0 0 70px 0', fontSize: '14px', color: '#334155' }}>
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div style={{ borderBottom: '1px solid #1e293b', marginBottom: '8px', marginX: '20px' }}></div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Nur Hidayati</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>CEO DIAMOND GROUP</p>
              </div>
            </div>
            
          </div>

        </div>
      )}
    </div>
  );
};

export default WithdrawAdmin;
