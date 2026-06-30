import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Plus, Pencil, Trash2, Save, Eye } from 'lucide-react';

const emptyForm = { name: '', base_salary: 25000 };

const EmployeeAdmin = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [isViewing, setIsViewing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/payroll/employees');
      setEmployees(res.data.filter(e => !e.name.toLowerCase().includes('cadangan')));
    } catch { console.error('Gagal memuat karyawan'); }
  };

  const openAdd = () => { setEditEmp(null); setIsViewing(false); setForm(emptyForm); setShowModal(true); };
  const openEdit = (emp) => { setEditEmp(emp); setIsViewing(false); setForm({ name: emp.name, base_salary: emp.base_salary }); setShowModal(true); };
  const handleView = (emp) => { setEditEmp(emp); setIsViewing(true); setForm({ name: emp.name, base_salary: emp.base_salary }); setShowModal(true); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('Nama karyawan wajib diisi!'); return; }
    setLoading(true);
    try {
      if (editEmp) {
        await api.put(`/payroll/employees/${editEmp.id}`, form);
        alert(`Karyawan "${form.name}" berhasil diperbarui!`);
      } else {
        await api.post('/payroll/employees', form);
        alert(`Karyawan "${form.name}" berhasil ditambahkan!`);
      }
      setShowModal(false); fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data karyawan');
    } finally { setLoading(false); }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Hapus karyawan "${emp.name}"? Semua data gaji terkait juga akan dihapus.`)) return;
    const password = window.prompt('Masukkan password administrator:');
    if (!password) return;
    try {
      await api.delete(`/payroll/employees/${emp.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { password }
      });
      alert('Karyawan berhasil dihapus!');
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus karyawan');
    }
  };

  return (
    <div className="container-fluid mt-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><Users size={20} strokeWidth={1.75} /> Karyawan</h4>
          <small className="text-muted">Master data karyawan — atur nama dan gaji pokok</small>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openAdd}>
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="ps-4 d-none d-md-table-cell" style={{ width: 40 }}>#</th>
                <th>Nama Karyawan</th>
                <th className="d-none d-md-table-cell">Gaji Pokok / Hari</th>
                <th className="text-center pe-4" style={{ width: 160 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-5 text-muted">Belum ada karyawan. Klik <strong>+ Tambah Karyawan</strong>.</td></tr>
              ) : employees.map((emp, i) => (
                <tr key={emp.id}>
                  <td className="ps-4 text-muted d-none d-md-table-cell">{i + 1}</td>
                  <td className="fw-semibold">{emp.name}</td>
                  <td className="d-none d-md-table-cell">
                    <span className="fw-bold text-success">Rp {Number(emp.base_salary).toLocaleString('id-ID')}</span>
                    <span className="text-muted small ms-1">/ hari</span>
                  </td>
                  <td className="text-center pe-4">
                    <div className="d-flex gap-1 justify-content-center">
                      <button className="btn btn-sm btn-light border" onClick={() => handleView(emp)} title="Lihat Detail"><Eye size={14} strokeWidth={1.75} /></button>
                      <button className="btn btn-sm btn-light border" onClick={() => openEdit(emp)} title="Edit"><Pencil size={14} strokeWidth={1.75} /></button>
                      <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(emp)} title="Hapus"><Trash2 size={14} strokeWidth={1.75} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 text-muted small">Total: {employees.length} karyawan</div>

      {/* MODAL TAMBAH / EDIT */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ backgroundColor: '#0f172a' }}>
                <h5 className="modal-title fw-bold text-white">
                  {isViewing ? `Detail: ${editEmp?.name}` : (editEmp ? `Edit: ${editEmp.name}` : 'Tambah Karyawan Baru')}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                <fieldset disabled={isViewing}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nama Karyawan <span className="text-danger">*</span></label>
                  <input
                    type="text" className="form-control" placeholder="Contoh: Budi Santoso"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="mb-1">
                  <label className="form-label fw-semibold">Gaji Pokok / Hari (Rp)</label>
                  <input
                    type="number" className="form-control" min="0" step="1000"
                    placeholder="25000" value={form.base_salary}
                    onChange={e => setForm({ ...form, base_salary: Number(e.target.value) })}
                  />
                  <div className="form-text">Default: Rp 25.000 / hari. Akan digunakan otomatis di halaman Penggajian.</div>
                </div>
                </fieldset>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{isViewing ? "Tutup" : "Batal"}</button>
                {!isViewing && (
                  <button className={`btn ${editEmp ? 'btn-primary' : 'btn-success'}`} onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Menyimpan...' : editEmp ? <><Save size={15} className="me-1" />Simpan Perubahan</> : <><Plus size={15} className="me-1" />Tambah Karyawan</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAdmin;
