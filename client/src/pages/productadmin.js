import React, { useState, useEffect } from 'react';
import api from '../api';
import { Package, Pencil, Trash2, ClipboardCopy, Plus } from 'lucide-react';

const getStoreLogo = (storeName) => {
  if (!storeName) return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
  const name = storeName.toLowerCase();
  if (name.includes('ratu')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59%20(1).jpeg";
  if (name.includes('king')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59.jpeg";
  return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
};

const ProductAdmin = () => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '', name: '', price: '', price_max: '', stock: 9999, category: '', description: '', weight: 0, size: '', shelf_life: '', image_url: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const formatPrice = (min, max) => {
    if (max && Number(max) > Number(min)) {
      return `Rp ${Number(min).toLocaleString()} - Rp ${Number(max).toLocaleString()}`;
    }
    return `Rp ${Number(min).toLocaleString()}`;
  };

  const handleStoreCheck = (storeId, checked) => {
    if (checked) {
      setSelectedStores(prev => [...prev, storeId]);
    } else {
      setSelectedStores(prev => prev.filter(id => id !== storeId));
    }
  };

  const toggleAllStores = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map(s => s.id));
    }
  };

  const handleCategoryCheck = (catName, checked) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, catName]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== catName));
    }
  };

  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/categories', { name: newCategoryName.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const addedCat = res.data;
      await fetchCategories();
      setSelectedCategories(prev => [...prev, addedCat.name]);
      setNewCategoryName('');
      alert("Kategori berhasil ditambahkan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan kategori");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStores();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Gagal mengambil kategori");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Gagal mengambil produk");
    }
  };

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data);
      if (res.data.length > 0 && !formData.store_id) {
        setFormData(prev => ({ ...prev, store_id: res.data[0].id }));
      }
    } catch (err) {
      console.error("Gagal mengambil toko");
    }
  };

  const handleSaveProduct = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || selectedStores.length === 0 || selectedCategories.length === 0) {
      alert("Nama, Harga, Toko, dan Kategori wajib diisi!");
      return;
    }

    try {
      const categoryString = selectedCategories.join(', ');
      const storeString = selectedStores.join(',');
      
      const payload = {
        ...formData,
        store_id: storeString,
        category: categoryString,
        stock: 9999,
        weight: 0
      };

      if (isEditing) {
        await api.put(`/products/${currentId}`, payload);
        alert("Produk berhasil diperbarui!");
      } else {
        await api.post('/products', payload);
        alert("Produk berhasil ditambahkan!");
      }
      setShowModal(false);
      setIsEditing(false);
      setFormData({ store_id: stores[0]?.id || '', name: '', price: '', price_max: '', stock: 9999, category: '', description: '', weight: 0, size: '', shelf_life: '', image_url: '' });
      setSelectedStores([]);
      setSelectedCategories([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan produk");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus produk ini? (Soft Delete)");
    if (!confirmDelete) return;

    const password = window.prompt("Masukkan password administrator untuk mengonfirmasi penghapusan:");
    if (password === null) return; // User clicked Cancel
    if (!password.trim()) {
      alert("Password tidak boleh kosong!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: password }
      });
      fetchProducts();
      alert("Produk berhasil dihapus!");
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal menghapus produk';
      alert(errorMsg);
    }
  };

  const handleEdit = (p) => {
    setFormData(p);
    setCurrentId(p.id);
    const storeIds = p.store_id ? p.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(Number) : [];
    setSelectedStores(storeIds);
    const cats = p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : [];
    setSelectedCategories(cats);
    setIsEditing(true);
    setShowModal(true);
  };

  const copyDescription = (p) => {
    const text = `💎 *${p.name}* 💎\n\n💰 Harga: ${formatPrice(p.price, p.price_max)}\n🏷 Kategori: ${p.category}\n📏 Ukuran: ${p.size || '-'}\n\n📝 Deskripsi:\n${p.description || '-'}\n\nYuk diorder kak! ✨`;
    navigator.clipboard.writeText(text);
    alert("Deskripsi berhasil disalin ke clipboard!");
  };

  const getStoreName = (ids) => {
    if (!ids) return 'No Store';
    const idList = ids.toString().split(',').map(x => x.trim()).filter(Boolean);
    const names = idList.map(id => {
      const s = stores.find(x => x.id.toString() === id.toString());
      return s ? s.name : `Store ${id}`;
    });
    return names.join(', ');
  };

  return (
    <div className="container-fluid mt-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><Package size={20} strokeWidth={1.75} /> Manajemen Produk</h4>
          <small className="text-muted">Kelola inventaris dan katalog Diamond Store Group</small>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setIsEditing(false); setFormData({ store_id: stores[0]?.id || '', name: '', price: '', price_max: '', stock: 9999, category: '', description: '', weight: 0, size: '', shelf_life: '', image_url: '' }); setSelectedStores(stores.map(s => s.id)); setSelectedCategories([]); setShowModal(true); }}>
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="ps-4">Produk</th>
                  <th>Toko</th>
                  <th>Harga</th>
                  <th>Kategori</th>
                  <th className="text-center pe-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={p.image_url ? p.image_url.split(',')[0].trim() : 'https://via.placeholder.com/50'} 
                          alt={p.name} 
                          className="rounded border shadow-sm"
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                        />
                        <div className="fw-semibold">{p.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        {p.store_id && p.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(id => {
                          const s = stores.find(x => x.id.toString() === id.toString());
                          return s ? (
                            <img
                              key={id}
                              src={getStoreLogo(s.name)}
                              alt={s.name}
                              title={s.name}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0' }}
                            />
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td>{formatPrice(p.price, p.price_max)}</td>
                    <td><span className="badge bg-light text-dark border">{p.category}</span></td>
                    <td className="text-center pe-4">
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-sm btn-light border" title="Salin Deskripsi" onClick={() => copyDescription(p)}>
                          <ClipboardCopy size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border" title="Edit" onClick={() => handleEdit(p)}>
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border text-danger" title="Hapus" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH/EDIT PRODUK */}
      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ backgroundColor: '#0f172a' }}>
                <h5 className="modal-title fw-bold text-white">{isEditing ? "Edit Produk" : "Tambah Produk Baru"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row">
                  <div className="col-lg-8">
                    <form id="productForm">
                      <div className="row g-3 mb-3">
                        <div className="col-md-8">
                          <label className="form-label fw-bold">Nama Produk</label>
                          <input type="text" className="form-control" value={formData.name} required onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-bold d-flex justify-content-between align-items-center mb-1">
                            <span>Toko</span>
                            <span 
                              className="text-primary fw-normal" 
                                style={{ cursor: 'pointer', fontSize: '0.8rem', userSelect: 'none' }}
                                onClick={toggleAllStores}
                            >
                              {selectedStores.length === stores.length ? "Hapus Semua" : "Pilih Semua"}
                            </span>
                          </label>
                          <div className="border rounded p-2 bg-white" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                            {stores.map(s => (
                              <div className="form-check" key={s.id}>
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id={`store-${s.id}`} 
                                  checked={selectedStores.includes(s.id)}
                                  onChange={(e) => handleStoreCheck(s.id, e.target.checked)}
                                />
                                <label className="form-check-label text-truncate w-100" htmlFor={`store-${s.id}`} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                  {s.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-md-3">
                          <label className="form-label fw-bold">Harga Min (Rp)</label>
                          <input type="number" className="form-control" value={formData.price} required onChange={(e) => setFormData({...formData, price: e.target.value})} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold">Harga Max (Rp)</label>
                          <input type="number" className="form-control" value={formData.price_max || ''} onChange={(e) => setFormData({...formData, price_max: e.target.value})} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold">Ukuran</label>
                          <input type="text" className="form-control" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-bold d-flex justify-content-between align-items-center mb-1">
                            <span>Kategori</span>
                          </label>
                          <div className="border rounded p-2 bg-white mb-2" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                            {categories.map(c => (
                              <div className="form-check" key={c.id}>
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id={`cat-${c.id}`} 
                                  checked={selectedCategories.includes(c.name)}
                                  onChange={(e) => handleCategoryCheck(c.name, e.target.checked)}
                                />
                                <label className="form-check-label text-truncate w-100" htmlFor={`cat-${c.id}`} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                  {c.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="input-group input-group-sm">
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="+ Kategori Baru" 
                              value={newCategoryName} 
                              onChange={(e) => setNewCategoryName(e.target.value)} 
                            />
                            <button className="btn btn-outline-secondary" type="button" onClick={handleAddCategory}>Tambah</button>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Deskripsi</label>
                        <textarea className="form-control" rows="5" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">URL Gambar (Bisa Multi)</label>
                          <textarea 
                            className="form-control" 
                            rows="3" 
                            placeholder="Pisahkan dengan koma (,) jika lebih dari satu gambar"
                            value={formData.image_url || ''} 
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Masa Simpan</label>
                          <input type="text" className="form-control" placeholder="Contoh: 2 Tahun, 12 Bulan" value={formData.shelf_life || ''} onChange={(e) => setFormData({...formData, shelf_life: e.target.value})} />
                        </div>
                      </div>
                    </form>
                  </div>
                  
                  {/* PREVIEW PANEL */}
                  <div className="col-lg-4 border-start">
                    <div className="p-3 bg-light rounded sticky-top" style={{ top: '0' }}>
                      <h6 className="fw-bold mb-3">Preview Media</h6>
                      {formData.image_url ? (
                        <div className="mt-3 text-center">
                          <img src={formData.image_url.split(',')[0].trim()} alt="Preview" className="img-fluid rounded border shadow-sm" style={{ maxHeight: '200px', width: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div className="border rounded bg-white d-flex align-items-center justify-content-center mb-3" style={{ height: '200px' }}>
                          <span className="text-muted small">No Image Preview</span>
                        </div>
                      )}
                      
                      {formData.usage_guide_title ? (
                        <div className="mt-3 p-3 bg-white rounded border shadow-sm">
                          <span className="badge bg-secondary mb-2">Cara Pakai Terhubung</span>
                          <div className="fw-bold small mb-1">{formData.usage_guide_title}</div>
                          <div className="text-muted mb-2" style={{ fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {formData.usage_guide_description}
                          </div>
                          {formData.usage_guide_video_url && (
                            <div className="ratio ratio-16x9 rounded overflow-hidden border mt-1">
                               <iframe 
                                src={formData.usage_guide_video_url.includes('youtube.com') ? formData.usage_guide_video_url.replace("watch?v=", "embed/") : formData.usage_guide_video_url} 
                                title="Preview Cara Pakai" 
                                allowFullScreen
                              ></iframe>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded bg-white d-flex align-items-center justify-content-center" style={{ height: '150px' }}>
                          <span className="text-muted small">Belum ada Cara Pakai terhubung</span>
                        </div>
                      )}
                      <div className="mt-3 text-muted" style={{ fontSize: '0.8rem' }}>
                        * Cara pakai dikelola melalui menu <strong>Kelola Cara Pakai</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="button" onClick={handleSaveProduct} className="btn btn-primary px-4">
                  {isEditing ? "Perbarui Produk" : "Simpan Produk"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAdmin;