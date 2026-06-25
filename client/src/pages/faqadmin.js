import React, { useState, useEffect } from 'react';
import api from '../api';
import { HelpCircle, Plus, Pencil, Trash2, Save, Eye } from 'lucide-react';

const FaqAdmin = () => {
  const [faqs, setFaqs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await api.get('/faqs');
      setFaqs(res.data);
    } catch (err) {
      console.error('Gagal memuat FAQ');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      alert("Pertanyaan dan Jawaban wajib diisi!");
      return;
    }
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/faqs/${currentId}`, form);
        alert('FAQ berhasil diperbarui!');
      } else {
        await api.post('/faqs', form);
        alert('FAQ berhasil ditambahkan!');
      }
      setShowModal(false);
      setForm({ question: '', answer: '' });
      setIsEditing(false);
      setIsViewing(false);
      fetchFaqs();
    } catch (err) {
      alert('Gagal menyimpan FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq) => {
    setForm({ question: faq.question, answer: faq.answer });
    setCurrentId(faq.id);
    setIsEditing(true);
    setIsViewing(false);
    setShowModal(true);
  };

  const handleView = (faq) => {
    setForm({ question: faq.question, answer: faq.answer });
    setCurrentId(faq.id);
    setIsEditing(false);
    setIsViewing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus FAQ ini?')) return;
    try {
      await api.delete(`/faqs/${id}`);
      fetchFaqs();
    } catch (err) {
      alert('Gagal menghapus FAQ');
    }
  };

  return (
    <div className="container-fluid mt-2">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><HelpCircle size={20} strokeWidth={1.75} /> Kelola FAQ</h4>
          <small className="text-muted">Pertanyaan yang sering diajukan pelanggan</small>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setIsEditing(false); setIsViewing(false); setForm({ question: '', answer: '' }); setShowModal(true); }}>
          <Plus size={16} /> Tambah FAQ
        </button>
      </div>

      {/* Tabel */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="ps-4 d-none d-md-table-cell" style={{ width: '40px' }}>#</th>
                <th>Pertanyaan</th>
                <th className="d-none d-md-table-cell">Jawaban</th>
                <th className="text-center pe-4" style={{ width: '180px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-muted">
                    Belum ada FAQ. Klik <strong>+ Tambah FAQ</strong> untuk mulai.
                  </td>
                </tr>
              ) : (
                faqs.map((faq, i) => (
                  <tr key={faq.id}>
                    <td className="ps-4 text-muted d-none d-md-table-cell">{i + 1}</td>
                    <td className="fw-semibold" style={{ maxWidth: '300px' }}>{faq.question}</td>
                    <td className="text-secondary d-none d-md-table-cell" style={{ maxWidth: '400px' }}>
                      <span className="d-inline-block text-truncate" style={{ maxWidth: '380px' }}>
                        {faq.answer}
                      </span>
                    </td>
                    <td className="text-center pe-4">
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-sm btn-light border" title="Lihat Detail" onClick={() => handleView(faq)}>
                          <Eye size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border" title="Edit" onClick={() => handleEdit(faq)}>
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border text-danger" title="Hapus" onClick={() => handleDelete(faq.id)}>
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badge total */}
      <div className="mt-2 text-muted small">Total: {faqs.length} FAQ</div>

      {/* MODAL TAMBAH/EDIT FAQ */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ backgroundColor: '#0f172a' }}>
                <h5 className="modal-title fw-bold text-white">{isViewing ? "Detail FAQ" : (isEditing ? "Edit FAQ" : "Tambah FAQ Baru")}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div>
                <div className="modal-body p-4">
                  <fieldset disabled={isViewing}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Pertanyaan <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Contoh: Apakah produk sudah termasuk ongkir?"
                      value={form.question}
                      onChange={(e) => setForm({ ...form, question: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Jawaban <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Tulis jawaban lengkap di sini..."
                      value={form.answer}
                      onChange={(e) => setForm({ ...form, answer: e.target.value })}
                      required
                    />
                  </div>
                  </fieldset>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{isViewing ? "Tutup" : "Batal"}</button>
                  {!isViewing && (
                    <button type="button" onClick={handleSubmit} className={`btn ${isEditing ? 'btn-primary' : 'btn-success'}`} disabled={loading}>
                      {loading ? 'Menyimpan...' : <><Save size={15} className="me-1" />Simpan FAQ</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqAdmin;
