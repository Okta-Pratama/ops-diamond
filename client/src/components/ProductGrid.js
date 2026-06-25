import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Search, X } from 'lucide-react';

const getStoreLogo = (storeName) => {
  if (!storeName) return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
  const name = storeName.toLowerCase();
  if (name.includes('ratu')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59%20(1).jpeg";
  if (name.includes('king')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59.jpeg";
  return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
};

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [globalMin, setGlobalMin] = useState(0);
  const [globalMax, setGlobalMax] = useState(0);

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
    // Debounce the API call slightly to avoid race conditions when typing
    const delay = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delay);
  }, [category, minPrice, maxPrice]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, storeRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/stores'),
          api.get('/products')
        ]);
        setCategories(catRes.data);
        setStores(storeRes.data);
        
        if (prodRes.data.length > 0) {
          const prices = prodRes.data.map(p => Number(p.price)).filter(p => !isNaN(p));
          const maxPrices = prodRes.data.map(p => Number(p.price_max || p.price)).filter(p => !isNaN(p));
          if (prices.length > 0) setGlobalMin(Math.min(...prices));
          if (maxPrices.length > 0) setGlobalMax(Math.max(...maxPrices));
        }
      } catch (err) {
        console.error("Gagal mengambil data inisial");
      }
    };
    fetchInitialData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* FILTER & SEARCH BAR */}
      <div className="card border-0 shadow-sm mb-4 p-3 rounded-4" style={{ backgroundColor: '#f8fafc' }}>
        <div className="row g-3">
          {/* Search */}
          <div className="col-lg-3">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={18} className="text-muted" /></span>
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                placeholder="Cari produk..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          {/* Category */}
          <div className="col-6 col-lg-2">
            <select 
              className="form-select bg-light border-0" 
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
              className="form-control bg-light border-0" 
              placeholder={globalMin ? `Min: Rp ${globalMin.toLocaleString('id-ID')}` : "Harga Min"} 
              value={minPrice}
              min={globalMin}
              max={globalMax}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div className="col-6 col-lg-2">
            <input 
              type="number" 
              className="form-control bg-light border-0" 
              placeholder={globalMax ? `Max: Rp ${globalMax.toLocaleString('id-ID')}` : "Harga Max"} 
              value={maxPrice}
              min={globalMin}
              max={globalMax}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Reset */}
          <div className="col-12 col-lg-3 d-flex align-items-center justify-content-end gap-2">
            {(category || minPrice || maxPrice || search) && (
              <button 
                className="btn btn-light btn-sm rounded-circle" 
                onClick={() => {
                  setCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSearch('');
                }}
                title="Reset Filter"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GRID PRODUK */}
      <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
        {filteredProducts.map(p => (
          <div className="col" key={p.id}>
            <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
              <div className="card h-100 shadow-sm product-card card-interactive">
                <img src={p.image_url ? p.image_url.split(',')[0].trim() : 'https://via.placeholder.com/300'} className="card-img-top p-3" alt={p.name} style={{ objectFit: 'contain', height: '200px' }} />
                <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '110px' }}>
                  <div>
                    <h6 className="card-title text-dark mb-1">{p.name}</h6>
                    <p className="text-primary fw-bold mb-2">{formatPrice(p.price, p.price_max)}</p>
                  </div>
                  <div className="d-flex flex-wrap gap-1 mt-auto align-items-center">
                    {p.store_id && p.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(id => {
                      const s = stores.find(x => x.id.toString() === id.toString());
                      return s ? (
                        <img
                          key={id}
                          src={getStoreLogo(s.name)}
                          alt={s.name}
                          title={s.name}
                          style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="card-footer bg-white border-0 pb-3">
                  <button className="btn btn-outline-primary w-100">
                    Lihat Detail & Video
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;