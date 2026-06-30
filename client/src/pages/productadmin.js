import React, { useState, useEffect } from 'react';
import api from '../api';
import { Package, Pencil, Trash2, ClipboardCopy, Plus, Eye } from 'lucide-react';

const getStoreLogo = (storeName) => {
  if (!storeName) return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
  const name = storeName.toLowerCase();
  if (name.includes('ratu') && name.includes('diamond')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59%20(1).jpeg?updatedAt=1782240717214";
  if (name.includes('king') && name.includes('diamond')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59.jpeg?updatedAt=1782240717449";
  if (name.includes('okta') || name.includes('pratama')) return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
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
  const [isViewing, setIsViewing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [storeLinks, setStoreLinks] = useState({});


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
        weight: 0,
        store_links: storeLinks
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
      setIsViewing(false);
      setFormData({ store_id: stores[0]?.id || '', name: '', price: '', price_max: '', stock: 9999, category: '', description: '', weight: 0, size: '', shelf_life: '', image_url: '' });
      setSelectedStores([]);
      setSelectedCategories([]);
      setStoreLinks({});
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
    setStoreLinks(p.store_links || {});
    setIsEditing(true);
    setIsViewing(false);
    setShowModal(true);
  };

  const handleView = (p) => {
    setFormData(p);
    setCurrentId(p.id);
    const storeIds = p.store_id ? p.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(Number) : [];
    setSelectedStores(storeIds);
    const cats = p.category ? p.category.split(',').map(c => c.trim()).filter(Boolean) : [];
    setSelectedCategories(cats);
    setStoreLinks(p.store_links || {});
    setIsEditing(false);
    setIsViewing(true);
    setShowModal(true);
  };

  const copyDescription = (p) => {
    const text = `💎 *${p.name}* 💎\n\n💰 Harga: ${formatPrice(p.price, p.price_max)}\n🏷 Kategori: ${p.category}\n📏 Ukuran: ${p.size || '-'}\n\n📝 Deskripsi:\n${p.description || '-'}\n\nYuk diorder kak! ✨`;
    navigator.clipboard.writeText(text);
    alert("Deskripsi berhasil disalin ke clipboard!");
  };


  return (
    <div className="container-fluid mt-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2"><Package size={20} strokeWidth={1.75} /> Manajemen Produk</h4>
          <small className="text-muted">Kelola inventaris dan katalog Diamond Store Group</small>
        </div>
        <button className="btn btn-dark d-flex align-items-center gap-2" onClick={() => { setIsEditing(false); setIsViewing(false); setFormData({ store_id: stores[0]?.id || '', name: '', price: '', price_max: '', stock: 9999, category: '', description: '', weight: 0, size: '', shelf_life: '', image_url: '' }); setSelectedStores(stores.map(s => s.id)); setSelectedCategories([]); setStoreLinks({}); setShowModal(true); }}>
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
                  <th className="d-none d-md-table-cell">Toko</th>
                  <th className="d-none d-md-table-cell">Harga</th>
                  <th className="d-none d-md-table-cell">Kategori</th>
                  <th className="text-center pe-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={p.image_url ? p.image_url.split(/[,\n]+/)[0].trim() : 'https://via.placeholder.com/50'} 
                          alt={p.name} 
                          className="rounded border shadow-sm"
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                        />
                        <div className="fw-semibold">{p.name}</div>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
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
                    <td className="d-none d-md-table-cell">{formatPrice(p.price, p.price_max)}</td>
                    <td className="d-none d-md-table-cell"><span className="badge bg-light text-dark border">{p.category}</span></td>
                    <td className="text-center pe-4">
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-sm btn-light border" title="Salin Deskripsi" onClick={() => copyDescription(p)}>
                          <ClipboardCopy size={14} strokeWidth={1.75} />
                        </button>
                        <button className="btn btn-sm btn-light border" title="Lihat Detail" onClick={() => handleView(p)}>
                          <Eye size={14} strokeWidth={1.75} />
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
                <h5 className="modal-title fw-bold text-white">{isViewing ? "Detail Produk" : (isEditing ? "Edit Produk" : "Tambah Produk Baru")}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-0" style={{ backgroundColor: '#f8fafc' }}>
                <div className="row g-0">
                  {/* FORM PANEL */}
                  <div className="col-lg-8 border-end" style={{ backgroundColor: '#ffffff' }}>
                    <div className="p-4 p-md-5">
                      <form id="productForm">
                        <fieldset disabled={isViewing}>
                          
                          {/* SECTION 1: INFO UTAMA */}
                          <div className="mb-5">
                            <h6 className="fw-bolder mb-3 text-primary border-bottom pb-2" style={{ letterSpacing: '-0.5px' }}>1. Informasi Utama</h6>
                            
                            <div className="mb-4">
                              <label className="form-label fw-bold text-dark">Nama Produk</label>
                              <input type="text" className="form-control form-control-lg bg-light" style={{ fontSize: '1rem', borderRadius: '10px' }} value={formData.name} required onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Masukkan nama produk..." />
                            </div>

                            <div className="mb-4">
                              <label className="form-label fw-bold text-dark d-flex align-items-center justify-content-between">
                                <span>Kategori</span>
                              </label>
                              <div className="d-flex flex-wrap gap-2 mb-3">
                                {categories.map(c => {
                                  const isSelected = selectedCategories.includes(c.name);
                                  return (
                                    <div 
                                      key={c.id} 
                                      className={`px-3 py-2 rounded-pill border ${isSelected ? 'bg-primary text-white border-primary fw-bold' : 'bg-white text-secondary'}`}
                                      style={{ cursor: isViewing ? 'default' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                      onClick={() => !isViewing && handleCategoryCheck(c.name, !isSelected)}
                                    >
                                      {c.name}
                                    </div>
                                  );
                                })}
                              </div>
                              {!isViewing && (
                                <div className="input-group" style={{ maxWidth: '300px' }}>
                                  <input 
                                    type="text" 
                                    className="form-control bg-light" 
                                    placeholder="+ Tambah kategori baru..." 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    style={{ borderRadius: '8px 0 0 8px' }}
                                  />
                                  <button className="btn btn-outline-primary fw-bold" type="button" onClick={handleAddCategory} style={{ borderRadius: '0 8px 8px 0' }}>Tambah</button>
                                </div>
                              )}
                            </div>

                            <div className="mb-4">
                              <label className="form-label fw-bold text-dark d-flex align-items-center justify-content-between">
                                <span>Tersedia di Toko</span>
                                {!isViewing && (
                                  <span 
                                    className="text-primary fw-normal" 
                                    style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                    onClick={toggleAllStores}
                                  >
                                    {selectedStores.length === stores.length ? "Batal Pilih Semua" : "Pilih Semua"}
                                  </span>
                                )}
                              </label>
                              <div className="d-flex flex-wrap gap-3">
                                {stores.map(s => {
                                  const isSelected = selectedStores.includes(s.id);
                                  return (
                                    <div 
                                      key={s.id}
                                      className={`d-flex align-items-center gap-2 p-2 px-3 rounded-pill border ${isSelected ? 'border-primary bg-primary text-white shadow-sm' : 'bg-white text-muted'}`}
                                      style={{ cursor: isViewing ? 'default' : 'pointer', transition: 'all 0.2s' }}
                                      onClick={() => !isViewing && handleStoreCheck(s.id, !isSelected)}
                                    >
                                      <img src={getStoreLogo(s.name)} alt={s.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain', backgroundColor: '#000', padding: '1px' }} />
                                      <span className={isSelected ? 'fw-bold text-white' : 'fw-semibold'}>{s.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* SECTION 2: HARGA & SPESIFIKASI */}
                          <div className="mb-5">
                            <h6 className="fw-bolder mb-3 text-primary border-bottom pb-2" style={{ letterSpacing: '-0.5px' }}>2. Harga & Spesifikasi</h6>
                            
                            <div className="row g-4 mb-3">
                              <div className="col-sm-6">
                                <label className="form-label fw-bold text-dark">Harga (Min)</label>
                                <div className="input-group">
                                  <span className="input-group-text bg-light fw-bold">Rp</span>
                                  <input type="number" className="form-control bg-light" value={formData.price} required onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0" />
                                </div>
                              </div>
                              <div className="col-sm-6">
                                <label className="form-label fw-bold text-dark">Harga (Max) <span className="text-muted fw-normal" style={{ fontSize: '0.8rem' }}>*Opsional</span></label>
                                <div className="input-group">
                                  <span className="input-group-text bg-light fw-bold">Rp</span>
                                  <input type="number" className="form-control bg-light" value={formData.price_max || ''} onChange={(e) => setFormData({...formData, price_max: e.target.value})} placeholder="0" />
                                </div>
                              </div>
                            </div>

                            <div className="row g-4">
                              <div className="col-sm-6">
                                <label className="form-label fw-bold text-dark">Ukuran</label>
                                <input type="text" className="form-control bg-light" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} placeholder="Misal: S, M, L atau 3ml" />
                              </div>
                              <div className="col-sm-6">
                                <label className="form-label fw-bold text-dark">Masa Simpan</label>
                                <input type="text" className="form-control bg-light" value={formData.shelf_life || ''} onChange={(e) => setFormData({...formData, shelf_life: e.target.value})} placeholder="Misal: 1 Tahun" />
                              </div>
                            </div>
                          </div>

                          {/* SECTION 3: DESKRIPSI & MEDIA */}
                          <div className="mb-5">
                            <h6 className="fw-bolder mb-3 text-primary border-bottom pb-2" style={{ letterSpacing: '-0.5px' }}>3. Deskripsi & Media</h6>
                            
                            <div className="mb-4">
                              <label className="form-label fw-bold text-dark">Deskripsi Produk</label>
                              <textarea className="form-control bg-light" rows="6" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Tuliskan deskripsi lengkap produk..."></textarea>
                            </div>

                            <div className="mb-4">
                              <label className="form-label fw-bold text-dark">URL Gambar (Bisa Multi)</label>
                              <textarea 
                                className="form-control bg-light" 
                                rows="3" 
                                placeholder="Pisahkan dengan koma (,) jika lebih dari satu gambar"
                                value={formData.image_url || ''} 
                                onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                              />
                            </div>
                          </div>

                          {/* SECTION 4: LINK MARKETPLACE */}
                          <div className="mb-4">
                            <h6 className="fw-bolder mb-3 text-primary border-bottom pb-2" style={{ letterSpacing: '-0.5px' }}>4. Tautan Marketplace</h6>
                            
                            {selectedStores.length === 0 ? (
                              <div className="alert alert-light border text-center text-muted p-4 rounded-4">
                                🛒 Silakan pilih minimal satu toko di Bagian 1 untuk menambahkan tautan marketplace.
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-3">
                                {selectedStores.map(storeId => {
                                  const s = stores.find(x => x.id.toString() === storeId.toString());
                                  if (!s) return null;
                                  return (
                                    <div className="card border-0 rounded-4 shadow-sm" key={storeId} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                      <div className="card-header bg-transparent border-bottom-0 pt-3 pb-0">
                                        <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                          <img src={getStoreLogo(s.name)} alt={s.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain', backgroundColor: '#000', padding: '1px' }} />
                                          {s.name}
                                        </div>
                                      </div>
                                      <div className="card-body">
                                        <div className="row g-3">
                                          {['shopee', 'tokopedia', 'lazada', 'tiktok'].map(platform => (
                                            <div className="col-md-6" key={platform}>
                                              <div className="input-group">
                                                <span className="input-group-text bg-white text-capitalize text-muted" style={{ width: '100px', fontSize: '0.85rem' }}>{platform}</span>
                                                <input 
                                                  type="url" 
                                                  className="form-control bg-white" 
                                                  placeholder="https://..." 
                                                  value={storeLinks[storeId]?.[platform] || ''}
                                                  onChange={(e) => setStoreLinks({
                                                    ...storeLinks,
                                                      [storeId]: {
                                                        ...(storeLinks[storeId] || {}),
                                                        [platform]: e.target.value
                                                      }
                                                  })}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </fieldset>
                      </form>
                    </div>
                  </div>
                  
                  {/* PREVIEW PANEL */}
                  <div className="col-lg-4">
                    <div className="p-4 p-md-5 sticky-top" style={{ top: '0', height: '100vh', overflowY: 'auto' }}>
                      <h6 className="fw-bolder mb-4 text-dark border-bottom pb-2" style={{ letterSpacing: '-0.5px' }}>Preview Layar Pengguna</h6>
                      
                      {/* PREVIEW GAMBAR */}
                      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                        <div className="card-header bg-transparent border-bottom-0 pt-3 pb-2 text-muted fw-bold small">
                          Media Utama
                        </div>
                        <div className="card-body p-3 pt-0">
                          {formData.image_url ? (
                            <div className="text-center rounded-4 overflow-hidden bg-light border d-flex align-items-center justify-content-center" style={{ height: '240px' }}>
                              <img src={formData.image_url.split(/[,\n]+/)[0].trim()} alt="Preview" className="img-fluid" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <div className="rounded-4 bg-light border d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: '240px', borderStyle: 'dashed !important' }}>
                              <span style={{ fontSize: '2rem' }}>🖼️</span>
                              <span className="small mt-2">Belum ada gambar</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* PREVIEW CARA PAKAI */}
                      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: '#ffffff' }}>
                         <div className="card-header bg-transparent border-bottom-0 pt-3 pb-2 text-muted fw-bold small">
                          Panduan Penggunaan
                        </div>
                        <div className="card-body p-3 pt-0">
                          {formData.usage_guide_title ? (
                            <div className="p-3 bg-light rounded-4 border">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">Terhubung</span>
                              </div>
                              <div className="fw-bold mb-1 text-dark" style={{ fontSize: '0.95rem' }}>{formData.usage_guide_title}</div>
                              <div className="text-secondary mb-3" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {formData.usage_guide_description}
                              </div>
                              {formData.usage_guide_video_url && (
                                <div className="ratio ratio-16x9 rounded-3 overflow-hidden border bg-dark">
                                   <iframe 
                                    src={formData.usage_guide_video_url.includes('youtube.com') ? formData.usage_guide_video_url.replace("watch?v=", "embed/") : formData.usage_guide_video_url} 
                                    title="Preview Cara Pakai" 
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-4 bg-light border d-flex flex-column align-items-center justify-content-center text-muted p-4 text-center" style={{ borderStyle: 'dashed !important' }}>
                              <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📖</span>
                              <span className="small">Produk ini belum dihubungkan dengan Panduan Cara Pakai.</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="alert border bg-light text-dark small rounded-4 p-3 d-flex align-items-start gap-2 shadow-sm" style={{ borderColor: '#cbd5e1' }}>
                        <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                        <div>
                          <strong>Info:</strong> Cara pakai dikelola melalui menu <strong>Kelola Cara Pakai</strong>.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top bg-white px-5 py-3">
                <button type="button" className="btn btn-light px-4 py-2 fw-semibold border" style={{ borderRadius: '10px' }} onClick={() => setShowModal(false)}>{isViewing ? "Tutup" : "Batal"}</button>
                {!isViewing && (
                  <button type="button" onClick={handleSaveProduct} className="btn btn-dark px-4 py-2 fw-semibold" style={{ borderRadius: '10px' }}>
                    {isEditing ? "Perbarui Data Produk" : "Simpan Produk Baru"}
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

export default ProductAdmin;