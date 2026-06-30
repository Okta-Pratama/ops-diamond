import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Search, X, ShoppingCart, ExternalLink, Store } from 'lucide-react';

import { getStoreLogo, marketplaceLogos } from '../utils/logos';

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProductForBuy, setSelectedProductForBuy] = useState(null);

  const formatPrice = (min, max) => {
    if (max && Number(max) > Number(min)) {
      return `Rp ${Number(min).toLocaleString()} - Rp ${Number(max).toLocaleString()}`;
    }
    return `Rp ${Number(min).toLocaleString()}`;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `/products?category=${category}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
        const res = await api.get(url);
        setProducts(res.data);
      } catch (err) {
        console.error("Gagal mengambil produk");
      }
    };
    fetchProducts();
  }, [category, minPrice, maxPrice]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Gagal mengambil kategori");
      }
    };
    const fetchStores = async () => {
      try {
        const res = await api.get('/stores');
        setStores(res.data);
      } catch (err) {
        console.error("Gagal mengambil data toko");
      }
    };
    fetchCategories();
    fetchStores();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* FILTER & SEARCH BAR */}
      <div className="card border-0 shadow-sm mb-4 p-3 rounded-4" style={{ backgroundColor: '#f8fafc' }}>
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-12 col-lg-4">
            <div className="input-group shadow-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <span className="input-group-text bg-white border-0 pe-2"><Search size={16} className="text-muted" /></span>
              <input 
                type="text" 
                className="form-control bg-white border-0 ps-1" 
                placeholder="Cari produk..." 
                style={{ fontSize: '0.9rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          {/* Category */}
          <div className="col-12 col-lg-3">
            <select 
              className="form-select bg-white border-0 shadow-sm" 
              style={{ fontSize: '0.9rem', borderRadius: '8px' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="col-6 col-lg-2">
            <input 
              type="number" 
              className="form-control bg-white border-0 shadow-sm" 
              style={{ fontSize: '0.9rem', borderRadius: '8px' }}
              placeholder="Harga Min" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div className="col-6 col-lg-2">
            <input 
              type="number" 
              className="form-control bg-white border-0 shadow-sm" 
              style={{ fontSize: '0.9rem', borderRadius: '8px' }}
              placeholder="Harga Max" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Reset */}
          <div className="col-12 col-lg-1 d-flex justify-content-end">
            {(category || minPrice || maxPrice || search) && (
              <button 
                className="btn btn-danger btn-sm shadow-sm d-flex align-items-center justify-content-center w-100" 
                style={{ borderRadius: '8px', height: '36px' }}
                onClick={() => {
                  setCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSearch('');
                }}
                title="Reset Filter"
              >
                <X size={16} /> <span className="d-lg-none ms-1">Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GRID PRODUK */}
      <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
        {filteredProducts.map(p => (
          <div className="col" key={p.id}>
            <Link to={`/product/${p.name.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || p.id}`} className="text-decoration-none text-dark">
              <div className="card h-100 product-card card-interactive" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                {/* Image Container with off-white background */}
                <div className="p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8fafc', height: '220px' }}>
                  <img src={p.image_url ? p.image_url.split(/[,\n]+/)[0].trim() : 'https://via.placeholder.com/300'} alt={p.name} style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%', mixBlendMode: 'multiply' }} />
                </div>
                
                <div className="card-body d-flex flex-column justify-content-between p-4" style={{ minHeight: '130px' }}>
                  <div>
                    <h6 className="card-title text-dark mb-2 fw-bold" style={{ lineHeight: '1.4', fontSize: '1.1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h6>
                    <h5 className="fw-bolder mb-3" style={{ color: '#b91c1c', letterSpacing: '-0.5px' }}>
                      {formatPrice(p.price, p.price_max)}
                    </h5>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-auto align-items-center pt-2 border-top border-light">
                    {p.store_id && p.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(id => {
                      const s = stores.find(x => x.id.toString() === id.toString());
                      return s ? (
                        <img
                          key={id}
                          src={getStoreLogo(s.name)}
                          alt={s.name}
                          title={s.name}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0', backgroundColor: '#000', padding: '1px' }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="card-footer bg-white border-0 px-4 pb-4 pt-0 d-flex flex-column gap-2">
                  <div 
                    className="btn btn-danger w-100 rounded-pill fw-semibold shadow-sm d-flex justify-content-center align-items-center gap-2" 
                    style={{ padding: '10px 0' }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProductForBuy(p); }}
                  >
                    <ShoppingCart size={18} /> Beli Langsung
                  </div>
                  <div className="btn btn-outline-secondary w-100 rounded-pill fw-semibold" style={{ transition: 'all 0.2s', padding: '10px 0' }}>
                    Lihat Detail & Video
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      {/* MODAL BELI LANGSUNG */}
      {selectedProductForBuy && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055, backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <ShoppingCart size={22} className="text-danger" /> Pilih Toko Pembelian
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedProductForBuy(null)}></button>
              </div>
              <div className="modal-body px-4 py-4">
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <img src={selectedProductForBuy.image_url ? selectedProductForBuy.image_url.split(/[,\n]+/)[0].trim() : 'https://via.placeholder.com/300'} alt={selectedProductForBuy.name} style={{ width: '60px', height: '60px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                  <div>
                    <h6 className="fw-semibold mb-1" style={{ fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{selectedProductForBuy.name}</h6>
                    <div className="fw-bold text-danger">{formatPrice(selectedProductForBuy.price, selectedProductForBuy.price_max)}</div>
                  </div>
                </div>
                
                <div className="d-flex flex-column gap-3">
                  {selectedProductForBuy.store_id && selectedProductForBuy.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(storeId => {
                    const s = stores.find(x => x.id.toString() === storeId);
                    const links = selectedProductForBuy.store_links?.[storeId] || {};
                    const hasLinks = Object.values(links).some(url => url && url.trim() !== '');
                    
                    if (!s || !hasLinks) return null;
                    
                    const platformConfig = {
                      shopee: { color: '#ee4d2d', image: marketplaceLogos.shopee, label: 'Shopee' },
                      tokopedia: { color: '#00AA5B', image: marketplaceLogos.tokopedia, label: 'Tokopedia' },
                      lazada: { color: '#0f146d', image: marketplaceLogos.lazada, label: 'Lazada' },
                      tiktok: { color: '#000000', image: marketplaceLogos.tiktok, label: 'TikTok Shop' },
                      whatsapp: { color: '#25D366', icon: '💬', label: 'WhatsApp' }
                    };
                    
                    return (
                      <div key={storeId} className="border rounded-4 p-3 shadow-sm bg-white" style={{ borderColor: '#e2e8f0' }}>
                        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                          <img src={getStoreLogo(s.name)} alt={s.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'contain', border: '1px solid #e2e8f0', backgroundColor: '#000', padding: '2px' }} />
                          <span className="fw-bold text-dark">{s.name}</span>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(links).map(([platform, url]) => {
                            if (!url || url.trim() === '') return null;
                            const platformKey = `is_${platform.toLowerCase()}_active`;
                            if (s[platformKey] === false) return null;
                            const conf = platformConfig[platform.toLowerCase()] || { color: '#64748b', icon: '🔗', label: platform };
                            return (
                              <a 
                                key={platform}
                                href={url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-sm text-white d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                style={{ backgroundColor: conf.color, borderRadius: '8px', padding: '8px 12px', fontWeight: '500', transition: 'all 0.2s', border: 'none' }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${conf.color}40`; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                              >
                                {conf.image ? <img src={conf.image} alt={conf.label} style={{width: 16, height: 16, objectFit: 'contain', borderRadius: '50%'}} /> : <span>{conf.icon}</span>} {conf.label} <ExternalLink size={14} className="ms-1 opacity-75"/>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!selectedProductForBuy.store_id || !selectedProductForBuy.store_id.toString().split(',').some(id => selectedProductForBuy.store_links?.[id] && Object.values(selectedProductForBuy.store_links[id]).some(u => u))) && (
                    <div className="text-center py-4 bg-light rounded-4">
                      <Store size={32} className="text-muted mb-2 opacity-50" />
                      <p className="text-muted mb-0 small">Belum ada link pembelian untuk produk ini.</p>
                    </div>
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

export default ProductGrid;