import React, { useState, useEffect } from 'react';
import api from '../api';
import Header from '../components/Header';
import ProductGrid from '../components/ProductGrid';
import Faq from '../components/Faq';
import Contact from '../components/Contact';
import { Clock, Truck } from 'lucide-react';

import { getStoreLogo } from '../utils/logos';

const Home = () => {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get('/stores');
        setStores(res.data);
      } catch (err) {
        console.error("Gagal mengambil data toko");
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="bg-white min-vh-100 overflow-x-hidden">
      <Header stores={stores} />
      
      {/* HERO SECTION / STORE PROFILING */}
      <div 
        className="position-relative text-white py-5 mb-5 d-flex align-items-center" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.85)), url('https://ik.imagekit.io/rxvi2ripqh/hero.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '480px',
          marginBottom: '3rem'
        }}
      >
        <div className="container py-4 position-relative z-1">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6">
              {/* Subtitle above Diamond Store Group */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill" style={{ backgroundColor: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                <span className="fw-semibold text-uppercase small" style={{ letterSpacing: '1px', color: '#f87171', fontSize: '0.75rem' }}>
                  Official Directory & Catalog
                </span>
              </div>
              
              <h1 className="display-4 fw-bolder mb-3 text-white" style={{ letterSpacing: '-1.5px', lineHeight: '1.1', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                Diamond Store Group
              </h1>
              
              <p className="lead mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.7', maxWidth: '480px', color: '#cbd5e1' }}>
                Pusat Grosir & Eceran Aksesoris Gigi, Lem, dan Perlengkapan Kecantikan Terlengkap & Terpercaya.
              </p>

              {/* PART 1B: Operational & Shipping Info (Visible ONLY on Desktop >= 992px) */}
              <div className="d-none d-lg-block mt-4">
                <div className="d-flex flex-wrap gap-4 p-3 rounded-4 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-10 rounded-3 text-white d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, flexShrink: 0 }}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-white-50 small" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jam Operasional</div>
                      <div className="fw-semibold small text-white" style={{ fontSize: '0.85rem' }}>Senin - Minggu (08.00 - 21.00 WIB)</div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-10 rounded-3 text-white d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, flexShrink: 0 }}>
                      <Truck size={16} />
                    </div>
                    <div>
                      <div className="text-white-50 small" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jadwal Pengiriman</div>
                      <div className="fw-semibold small text-white" style={{ fontSize: '0.85rem' }}>Harian s/d 15.00 WIB</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              {/* Unified Glassmorphic Card containing Operational Info + Store Branches (Info is merged only on mobile) */}
              <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)' }}>
                
                {/* PART 1A: Operational & Shipping Info (Visible ONLY on Mobile/Tablet < 992px) */}
                <div className="d-block d-lg-none mb-4">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="d-flex align-items-start gap-3">
                        <div className="p-2 bg-white bg-opacity-10 rounded-3 text-white mt-0.5 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, flexShrink: 0 }}>
                          <Clock size={15} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-white mb-1 small text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '0.72rem' }}>Jam Operasional</h6>
                          <p className="mb-0 text-white-50 small" style={{ lineHeight: '1.4', fontSize: '0.78rem' }}>
                            <strong>Senin - Minggu</strong><br />
                            08.00 - 21.00 WIB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-sm-6">
                      <div className="d-flex align-items-start gap-3">
                        <div className="p-2 bg-white bg-opacity-10 rounded-3 text-white mt-0.5 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, flexShrink: 0 }}>
                          <Truck size={15} />
                        </div>
                        <div>
                          <h6 className="fw-bold text-white mb-1 small text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '0.72rem' }}>Jadwal Pengiriman</h6>
                          <p className="mb-0 text-white-50 small" style={{ lineHeight: '1.4', fontSize: '0.78rem' }}>
                            Sebelum 15.00 WIB dikirim hari yang sama. Libur tanggal merah.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Divider line inside card (Mobile only) */}
                  <hr className="my-3 opacity-10" style={{ margin: '1rem 0', borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                </div>

                {/* PART 2: Kunjungi Cabang Resmi */}
                <div>
                  <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                     Kunjungi Cabang Resmi Kami
                  </h5>
                  
                  <div className="d-flex flex-column gap-2">
                    {stores.filter(s => s.is_active !== false).map(store => (
                      <div 
                        key={store.id} 
                        className="p-2 px-3 rounded-3 d-flex flex-row justify-content-between align-items-center gap-2 transition-all store-branch-card" 
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          {/* Logo Toko */}
                          <img 
                            src={getStoreLogo(store.name)} 
                            alt={`${store.name} Logo`} 
                            style={{ height: '35px', width: '35px', objectFit: 'cover', flexShrink: 0, borderRadius: '50%' }}
                          />
                          <div>
                            <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '0.9rem' }}>{store.name}</h6>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-2 align-items-center">
                          {store.shopee_url && store.is_shopee_active !== false && (
                            <a
                              href={store.shopee_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Shopee"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)', transition: 'transform 0.2s, background 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
                            >
                              <img src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/assets/icon_favicon_1_32.9cd61b2e90c0f104.png" alt="Shopee" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            </a>
                          )}
                          {store.lazada_url && store.is_lazada_active !== false && (
                            <a
                              href={store.lazada_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Lazada"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)', transition: 'transform 0.2s, background 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
                            >
                              <img src="https://www.lazada.co.id/favicon.ico" alt="Lazada" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            </a>
                          )}
                          {store.topedia_url && store.is_tokopedia_active !== false && (
                            <a
                              href={store.topedia_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Tokopedia"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)', transition: 'transform 0.2s, background 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
                            >
                              <img src="https://p16-images-comn-sg.tokopedia-static.net/tos-alisg-i-zr7vqa5nfb-sg/assets-tokopedia-lite/prod/icon144.png~tplv-zr7vqa5nfb-image.image" alt="Tokopedia" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            </a>
                          )}
                          {store.tiktok_url && store.is_tiktok_active !== false && (
                            <a
                              href={store.tiktok_url}
                              target="_blank"
                              rel="noreferrer"
                              title="TikTok Shop"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.12)', transition: 'transform 0.2s, background 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
                            >
                              <img src="https://www.tiktok.com/favicon.ico" alt="TikTok" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Catalog Section Header */}
        <div className="d-flex justify-content-between align-items-end mb-4 border-bottom pb-3">
          <div>
            <h3 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Katalog Produk</h3>
            <p className="text-muted small mb-0 mt-1">Daftar produk terbaik dari seluruh cabang resmi Diamond Store Group</p>
          </div>
        </div>
        
        {/* Katalog Utama */}
        <ProductGrid />

        <hr className="my-4 border-light" />

        {/* FAQ & Kontak */}
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="mb-5">
              <h4 className="fw-bold mb-4 text-dark text-center" style={{ letterSpacing: '-0.5px' }}>Pertanyaan yang Sering Diajukan (FAQ)</h4>
              <Faq />
            </div>
            
            <Contact />
          </div>
        </div>
      </div>

      <footer className="bg-white border-top text-center py-4 mt-4 text-muted small">
        <div className="container">
          <p className="mb-0">© 2026 Diamond Store Group - Okta Pratama. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;