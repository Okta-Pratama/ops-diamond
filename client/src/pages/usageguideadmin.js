import React, { useState, useEffect } from 'react';
import api from '../api';
import { BookOpen, Plus, Pencil, Trash2, Save, Eye } from 'lucide-react';

const UsageGuideAdmin = () => {
  const [usageGuides, setUsageGuides] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    title: '',
    description: '',
    video_url: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchUsageGuides();
    fetchProducts();
  }, []);

  const fetchUsageGuides = async () => {
    try {
      const res = await api.get('/usage-guides');
      setUsageGuides(res.data);
    } catch (err) {
      console.error('Gagal memuat data cara pakai');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Gagal memuat data produk');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.product_id || !form.title.trim()) {
      alert("Produk dan Judul Cara Pakai wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (isEditing) {
        await api.put(`/usage-guides/${currentId}`, form, { headers });
        alert('Cara Pakai berhasil diperbarui!');
      } else {
        await api.post('/usage-guides', form, { headers });
        alert('Cara Pakai berhasil ditambahkan!');
      }
      setShowModal(false);
      setForm({ product_id: '', title: '', description: '', video_url: '', image_url: '' });
      setIsEditing(false);
      setIsViewing(false);
      fetchUsageGuides();
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal menyimpan data';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (guide) => {
    setForm({
      product_id: guide.product_id,
      title: guide.title,
      description: guide.description || '',
      video_url: guide.video_url || '',
      image_url: guide.image_url || ''
    });
    setCurrentId(guide.id);
    setIsEditing(true);
    setIsViewing(false);
    setShowModal(true);
  };

  const handleView = (guide) => {
    setForm({
      product_id: guide.product_id,
      title: guide.title,
      description: guide.description || '',
      video_url: guide.video_url || '',
      image_url: guide.image_url || ''
    });
    setCurrentId(guide.id);
    setIsEditing(false);
    setIsViewing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus Cara Pakai ini?");
    if (!confirmDelete) return;

    const password = window.prompt("Masukkan password administrator untuk mengonfirmasi penghapusan:");
    if (password === null) return;
    if (!password.trim()) {
      alert("Password tidak boleh kosong!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/usage-guides/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: password }
      });
      fetchUsageGuides();
      alert("Cara Pakai berhasil dihapus!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal menghapus data';
      alert(errorMsg);
    }
  };

  // Filter produk yang belum memiliki Cara Pakai (kecuali produk dari guide yang sedang diedit)
  const getAvailableProducts = () => {
    return products.filter(p => {
      if (isEditing && p.id === form.product_id) return true;
      const alreadyHasGuide = usageGuides.some(g => g.product_id === p.id);
      return !alreadyHasGuide;
    });
  };

  return (
    <div className="container-fluid mt-2">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><BookOpen size={20} strokeWidth={1.75} /> Kelola Cara Pakai</h4>
          <small className="text-muted">Manajemen panduan pemakaian produk secara interaktif</small>
        </div>
        <button
          className="btn btn-dark d-flex align-items-center gap-2"
          onClick={() => {
            setIsEditing(false);
            setIsViewing(false);
            const avail = getAvailableProducts();
            setForm({ product_id: avail[0]?.id || '', title: '', description: '', video_url: '', image_url: '' });
            setShowModal(true);
          }}
          disabled={products.length === 0}
        >
          <Plus size={16} /> Tambah Cara Pakai
        </button>
      </div>

      {/* Tabel */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="ps-4 d-none d-md-table-cell" style={{ width: '40px' }}>#</th>
                  <th className="d-none d-md-table-cell">Produk Terkait</th>
                  <th>Judul Panduan</th>
                  <th className="d-none d-md-table-cell">Deskripsi</th>
                  <th className="text-center" style={{ width: '150px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {usageGuides.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      Belum ada data Cara Pakai. Klik <strong>+ Tambah Cara Pakai</strong> untuk mulai.
                    </td>
                  </tr>
                ) : (
                  usageGuides.map((guide, i) => (
                    <tr key={guide.id}>
                      <td className="ps-4 text-muted d-none d-md-table-cell">{i + 1}</td>
                      <td className="d-none d-md-table-cell">
                        <span className="fw-semibold">{guide.product_name || `Produk ID: ${guide.product_id}`}</span>
                      </td>
                      <td>{guide.title}</td>
                      <td className="d-none d-md-table-cell">
                        <span className="d-inline-block text-truncate text-secondary" style={{ maxWidth: '280px' }}>
                          {guide.description || '-'}
                        </span>
                      </td>
                      <td className="text-center pe-4">
                        <div className="d-flex gap-1 justify-content-center">
                          <button className="btn btn-sm btn-light border" title="Lihat Detail" onClick={() => handleView(guide)}>
                            <Eye size={14} strokeWidth={1.75} />
                          </button>
                          <button className="btn btn-sm btn-light border" title="Edit" onClick={() => handleEdit(guide)}>
                            <Pencil size={14} strokeWidth={1.75} />
                          </button>
                          <button className="btn btn-sm btn-light border text-danger" title="Hapus" onClick={() => handleDelete(guide.id)}>
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
      </div>

      <div className="mt-2 text-muted small">Total: {usageGuides.length} Cara Pakai</div>

      {/* MODAL TAMBAH/EDIT */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ backgroundColor: '#0f172a' }}>
                <h5 className="modal-title fw-bold text-white">{isViewing ? "Detail Cara Pakai" : (isEditing ? "Edit Cara Pakai" : "Tambah Cara Pakai Baru")}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="row">
                  <div className="col-lg-8">
                    <form id="usageGuideForm" onSubmit={handleSubmit}>
                      <fieldset disabled={isViewing}>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Pilih Produk <span className="text-danger">*</span></label>
                        <select 
                          className="form-select"
                          value={form.product_id}
                          onChange={(e) => setForm({ ...form, product_id: parseInt(e.target.value) })}
                          required
                        >
                          <option value="" disabled>-- Pilih Produk --</option>
                          {getAvailableProducts().map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <small className="text-muted">
                          Hanya produk yang belum memiliki panduan pemakaian yang akan muncul di daftar.
                        </small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Judul Cara Pakai <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Contoh: Cara Pakai Lem Gigi Akrilik"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Langkah-Langkah (Deskripsi)</label>
                        <textarea
                          className="form-control"
                          rows="6"
                          placeholder="Tulis langkah-langkah penggunaan di sini..."
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">URL Gambar Petunjuk</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="https://example.com/image.jpg"
                            value={form.image_url}
                            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">URL Video Petunjuk (YouTube)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={form.video_url}
                            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                          />
                        </div>
                      </div>
                      </fieldset>
                    </form>
                  </div>

                  {/* PREVIEW MEDIA PANEL */}
                  <div className="col-lg-4 border-start">
                    <div className="p-3 bg-light rounded sticky-top" style={{ top: '0' }}>
                      <h6 className="fw-bold mb-3">Preview Media Cara Pakai</h6>
                      
                      {form.image_url ? (
                        <div className="mb-3">
                          <img src={form.image_url} alt="Preview Cara Pakai" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '200px', width: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div className="border rounded bg-white d-flex align-items-center justify-content-center mb-3" style={{ height: '180px' }}>
                          <span className="text-muted small">No Image Preview</span>
                        </div>
                      )}

                      {form.video_url ? (
                        <div className="ratio ratio-16x9 rounded overflow-hidden border shadow-sm">
                           <iframe 
                            src={form.video_url.includes('youtube.com') ? form.video_url.replace("watch?v=", "embed/") : form.video_url} 
                            title="Preview Video Cara Pakai" 
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="border rounded bg-white d-flex align-items-center justify-content-center" style={{ height: '130px' }}>
                          <span className="text-muted small">No Video Preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{isViewing ? "Tutup" : "Batal"}</button>
                {!isViewing && (
                  <button type="button" onClick={handleSubmit} className={`btn ${isEditing ? 'btn-primary' : 'btn-success'}`} disabled={loading}>
                    {loading ? 'Menyimpan...' : <><Save size={15} className="me-1" />Simpan Cara Pakai</>}
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

export default UsageGuideAdmin;
