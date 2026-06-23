import React, { useState, useEffect } from 'react';
import api from '../api';
import { Store, Plus, Pencil, Trash2, Save } from 'lucide-react';

const emptyForm = { name: '', shopee_url: '', lazada_url: '', topedia_url: '', tiktok_url: '', is_active: true, is_shopee_active: true, is_lazada_active: true, is_tokopedia_active: true, is_tiktok_active: true };

const StoreAdmin = () => {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editStore, setEditStore] = useState(null); // null = mode tambah, objek = mode edit
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data);
    } catch (err) {
      console.error('Gagal memuat data toko');
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

  const openAdd = () => {
    setEditStore(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (store) => {
    setEditStore(store);
    setForm({
      name: store.name || '',
      shopee_url: store.shopee_url || '',
      lazada_url: store.lazada_url || '',
      topedia_url: store.topedia_url || '',
      tiktok_url: store.tiktok_url || '',
      is_active: store.is_active !== undefined ? store.is_active : true,
      is_shopee_active: store.is_shopee_active !== undefined ? store.is_shopee_active : true,
      is_lazada_active: store.is_lazada_active !== undefined ? store.is_lazada_active : true,
      is_tokopedia_active: store.is_tokopedia_active !== undefined ? store.is_tokopedia_active : true,
      is_tiktok_active: store.is_tiktok_active !== undefined ? store.is_tiktok_active : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      alert("Nama toko wajib diisi!");
      return;
    }
    setLoading(true);
    try {
      if (editStore) {
        // UPDATE
        await api.put(`/stores/${editStore.id}`, form);
        alert(`Toko "${form.name}" berhasil diperbarui!`);
      } else {
        // CREATE
        await api.post('/stores', form);
        alert(`Toko "${form.name}" berhasil ditambahkan!`);
      }
      setShowModal(false);
      fetchStores();
    } catch (err) {
      alert(editStore ? 'Gagal memperbarui toko' : 'Gagal menambah toko');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (store) => {
    const confirmDelete = window.confirm(`Yakin ingin menghapus toko "${store.name}"?`);
    if (!confirmDelete) return;

    const password = window.prompt("Masukkan password administrator untuk mengonfirmasi penghapusan:");
    if (password === null) return; // User clicked Cancel
    if (!password.trim()) {
      alert("Password tidak boleh kosong!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/stores/${store.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: password }
      });
      fetchStores();
      alert(`Toko "${store.name}" berhasil dihapus!`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal menghapus toko';
      alert(errorMsg);
    }
  };

  return (
    <div className="container-fluid mt-2">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><Store size={20} strokeWidth={1.75} /> Kelola Toko</h4>
          <small className="text-muted">Tambah, edit, dan hapus data toko beserta link marketplace</small>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={openAdd}>
          <Plus size={16} /> Tambah Toko
        </button>
      </div>

      {/* Tabel */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th className="ps-4" style={{ width: 40 }}>#</th>
                <th>Nama Toko</th>
                <th>Status</th>
                <th>Jumlah Produk</th>
                <th>Link Shopee</th>
                <th>Link Lazada</th>
                <th>Link Tokopedia</th>
                <th>Link TikTok</th>
                <th className="text-center pe-4" style={{ width: 160 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    Belum ada toko. Klik <strong>+ Tambah Toko</strong> untuk mulai.
                  </td>
                </tr>
              ) : (
                stores.map((store, i) => {
                  const productCount = products.filter(p => 
                    p.store_id && p.store_id.toString().split(',').map(x => x.trim()).includes(store.id.toString())
                  ).length;
                  
                  return (
                    <tr key={store.id}>
                      <td className="ps-4 text-muted">{i + 1}</td>
                      <td className="fw-semibold">{store.name}</td>
                      <td>
                        {store.is_active === false ? (
                          <span className="badge bg-secondary">Tidak Aktif</span>
                        ) : (
                          <span className="badge bg-success">Aktif</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          📦 {productCount} Produk
                        </span>
                      </td>
                    <td>
                      {store.shopee_url ? (
                        <a href={store.shopee_url} target="_blank" rel="noreferrer" className="text-warning text-decoration-none small">
                          <span className="me-1">🛒</span>
                          <span className="d-inline-block text-truncate align-bottom" style={{ maxWidth: 160 }}>{store.shopee_url}</span>
                        </a>
                      ) : (
                        <span className="text-danger small">— Belum diisi</span>
                      )}
                    </td>
                    <td>
                      {store.lazada_url ? (
                        <a href={store.lazada_url} target="_blank" rel="noreferrer" className="text-primary text-decoration-none small">
                          <span className="me-1">🔵</span>
                          <span className="d-inline-block text-truncate align-bottom" style={{ maxWidth: 160 }}>{store.lazada_url}</span>
                        </a>
                      ) : (
                        <span className="text-danger small">— Belum diisi</span>
                      )}
                    </td>
                    <td>
                      {store.topedia_url ? (
                        <a href={store.topedia_url} target="_blank" rel="noreferrer" className="text-success text-decoration-none small">
                          <span className="me-1">🟢</span>
                          <span className="d-inline-block text-truncate align-bottom" style={{ maxWidth: 160 }}>{store.topedia_url}</span>
                        </a>
                      ) : (
                        <span className="text-danger small">— Belum diisi</span>
                      )}
                    </td>
                    <td>
                      {store.tiktok_url ? (
                        <a href={store.tiktok_url} target="_blank" rel="noreferrer" className="text-dark text-decoration-none small">
                          <span className="me-1">🎵</span>
                          <span className="d-inline-block text-truncate align-bottom" style={{ maxWidth: 160 }}>{store.tiktok_url}</span>
                        </a>
                      ) : (
                        <span className="text-danger small">— Belum diisi</span>
                      )}
                    </td>
                    <td className="text-center pe-4">
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-sm btn-light border" onClick={() => openEdit(store)} title="Edit">
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(store)} title="Hapus">
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-2 text-muted small">Total: {stores.length} toko</div>

      {/* MODAL TAMBAH / EDIT TOKO */}
      {showModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ backgroundColor: '#0f172a' }}>
                <h5 className="modal-title fw-bold text-white">
                  {editStore ? `Edit: ${editStore.name}` : 'Tambah Toko Baru'}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <div>
                <div className="modal-body p-4">
                  {/* Nama Toko */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Nama Toko <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Contoh: Diamond Store Okta"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Status Aktif */}
                  <div className="mb-3 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActiveSwitch"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="isActiveSwitch">
                      Toko Aktif (Tampil di Laporan Penjualan)
                    </label>
                  </div>

                  {/* Link Shopee */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <label className="form-label fw-semibold">
                        <span className="text-warning">🛒</span> Link Shopee
                      </label>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="shopeeActive" checked={form.is_shopee_active} onChange={e => setForm({...form, is_shopee_active: e.target.checked})} />
                        <label className="form-check-label small" htmlFor="shopeeActive">Aktif</label>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://shopee.co.id/namatoko"
                      value={form.shopee_url}
                      onChange={(e) => setForm({ ...form, shopee_url: e.target.value })}
                      disabled={!form.is_shopee_active}
                    />
                  </div>

                  {/* Link Lazada */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <label className="form-label fw-semibold">
                        <span className="text-primary">🔵</span> Link Lazada
                      </label>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="lazadaActive" checked={form.is_lazada_active} onChange={e => setForm({...form, is_lazada_active: e.target.checked})} />
                        <label className="form-check-label small" htmlFor="lazadaActive">Aktif</label>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://www.lazada.co.id/shop/namatoko"
                      value={form.lazada_url}
                      onChange={(e) => setForm({ ...form, lazada_url: e.target.value })}
                      disabled={!form.is_lazada_active}
                    />
                  </div>

                  {/* Link Tokopedia */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <label className="form-label fw-semibold">
                        <span className="text-success">🟢</span> Link Tokopedia
                      </label>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="tokopediaActive" checked={form.is_tokopedia_active} onChange={e => setForm({...form, is_tokopedia_active: e.target.checked})} />
                        <label className="form-check-label small" htmlFor="tokopediaActive">Aktif</label>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://www.tokopedia.com/namatoko"
                      value={form.topedia_url}
                      onChange={(e) => setForm({ ...form, topedia_url: e.target.value })}
                      disabled={!form.is_tokopedia_active}
                    />
                  </div>

                  {/* Link TikTok */}
                  <div className="mb-1">
                    <div className="d-flex justify-content-between">
                      <label className="form-label fw-semibold">
                        <span>🎵</span> Link TikTok Shop
                      </label>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="tiktokActive" checked={form.is_tiktok_active} onChange={e => setForm({...form, is_tiktok_active: e.target.checked})} />
                        <label className="form-check-label small" htmlFor="tiktokActive">Aktif</label>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://www.tiktok.com/@namatoko"
                      value={form.tiktok_url}
                      onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                      disabled={!form.is_tiktok_active}
                    />
                  </div>
                  <div className="form-text mt-1">Link marketplace bersifat opsional.</div>
                </div>

                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className={`btn ${editStore ? 'btn-primary' : 'btn-success'}`}
                    disabled={loading}
                  >
                    {loading
                    ? 'Menyimpan...'
                    : editStore ? <><Save size={15} className="me-1" />Simpan Perubahan</> : <><Plus size={15} className="me-1" />Tambah Toko</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreAdmin;
