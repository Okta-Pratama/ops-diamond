import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import { Link2, Check, ArrowLeft, ShoppingCart, ExternalLink, Store } from 'lucide-react';

const getStoreLogo = (storeName) => {
  if (!storeName) return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
  const name = storeName.toLowerCase();
  if (name.includes('ratu')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59%20(1).jpeg";
  if (name.includes('king')) return "https://ik.imagekit.io/rxvi2ripqh/WhatsApp%20Image%202026-06-24%20at%2001.24.59.jpeg";
  return "https://ik.imagekit.io/rxvi2ripqh/OPW.png?updatedAt=1782216119711";
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [stores, setStores] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    api.get('/stores').then(res => setStores(res.data)).catch(console.error);
    api.get(`/products`).then(res => {
      const p = res.data.find(x => {
        const slug = x.name.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return slug === id || x.id.toString() === id.toString();
      });
      setProduct(p);
      if (p) {
        let rel = res.data.filter(x => x.category === p.category && x.id !== p.id);
        if (rel.length === 0) {
          rel = res.data.filter(x => x.id !== p.id);
        }
        setRelated(rel.slice(0, 4));
      }
    }).catch(console.error);
  }, [id]);

  if (!product) {
    return (
      <div className="bg-light-custom min-vh-100 pb-5">
        <Header stores={stores} />
        <div className="container py-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-grow text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-dark fw-bold" style={{ letterSpacing: '-0.5px' }}>Menyiapkan Data Produk</h5>
          <p className="text-muted small">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price, priceMax) => {
    if (!price) return 'Harga tidak tersedia';
    const numPrice = Number(price);
    const numMax = Number(priceMax);
    if (numMax > numPrice) {
      return `Rp${numPrice.toLocaleString('id-ID')} - Rp${numMax.toLocaleString('id-ID')}`;
    }
    return `Rp${numPrice.toLocaleString('id-ID')}`;
  };

  const images = product.image_url ? product.image_url.split(/[,\n]+/).map(u => u.trim()).filter(Boolean) : [];
  const mainImage = images.length > 0 ? images[activeImageIdx] : 'https://via.placeholder.com/400';

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    return url;
  };

  const videoUrl = product.usage_guide_video_url;
  const embedUrl = getEmbedUrl(videoUrl);
  const isYoutube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));

  return (
    <div className="bg-light-custom min-vh-100 pb-5">
      <Header stores={stores} />

      <div className="container py-4">
        {/* Breadcrumbs / Back button */}
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
          <Link to="/" className="text-decoration-none text-dark fw-medium small d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm bg-white" style={{ border: '1px solid #e2e8f0', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateX(-3px)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'none'; }}>
            <ArrowLeft size={16} />
            Kembali ke Katalog
          </Link>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small" style={{ backgroundColor: 'transparent', padding: 0 }}>
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none" style={{ color: '#64748b' }}>Beranda</Link></li>
              <li className="breadcrumb-item text-capitalize" style={{ color: '#64748b' }}>{product.category}</li>
              <li className="breadcrumb-item active fw-semibold" style={{ color: '#0f172a' }} aria-current="page">
                {product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* Product Inspector Area */}
        <div className="card border-0 shadow-sm p-4 bg-white mb-5" style={{ borderRadius: '16px' }}>

          <div className="row g-4 md-g-5">
            {/* Left Col: Media (Gambar & Panduan Cara Pakai) */}
            <div className="col-md-5 col-lg-5">
              {/* Media Area: gambar dulu */}
              <div>
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center position-relative shadow-sm"
                  style={{ height: '400px', overflow: 'hidden', backgroundColor: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="img-fluid p-4"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
                  />
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="d-flex gap-2 mt-3 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {images.map((img, idx) => (
                      <div 
                        key={idx}
                        className={`rounded-4 border overflow-hidden flex-shrink-0 cursor-pointer shadow-sm`}
                        style={{ 
                          width: '75px', 
                          height: '75px', 
                          cursor: 'pointer',
                          borderColor: idx === activeImageIdx ? '#b91c1c' : 'rgba(0,0,0,0.08)',
                          borderWidth: idx === activeImageIdx ? '2px' : '1px',
                          opacity: idx === activeImageIdx ? '1' : '0.6',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#f8fafc'
                        }}
                        onClick={() => setActiveImageIdx(idx)}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseOut={(e) => { if (idx !== activeImageIdx) e.currentTarget.style.opacity = '0.6'; }}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-100 h-100 p-1" style={{ objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panduan Cara Pakai pindah ke bawah gambar */}
              {(product.usage_guide_title || videoUrl || product.usage_guide_image_url) && (
                <div className="mt-4 p-4 rounded-4" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <h6 className="fw-bolder text-dark mb-4 d-flex align-items-center gap-2" style={{ letterSpacing: '-0.5px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📖</span> Panduan Cara Pakai
                  </h6>
                  
                  {videoUrl && (
                    <div className="mb-4 rounded-4 overflow-hidden border border-light shadow-sm position-relative bg-dark" style={{ height: '240px' }}>
                      {isYoutube ? (
                        <div className="ratio ratio-16x9" style={{ height: '100%' }}>
                          <iframe
                            src={`${embedUrl}?autoplay=0`}
                            title="Video Panduan"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            style={{ border: 'none' }}
                          />
                        </div>
                      ) : (
                        <video
                          src={videoUrl}
                          controls
                          className="w-100 h-100"
                          style={{ objectFit: 'contain' }}
                        />
                      )}
                    </div>
                  )}

                  {product.usage_guide_title && (
                    <h6 className="fw-bold mb-2" style={{ color: '#b91c1c' }}>{product.usage_guide_title}</h6>
                  )}
                  {product.usage_guide_description && (
                    <p className="text-secondary small mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#475569' }}>
                      {product.usage_guide_description}
                    </p>
                  )}
                  {product.usage_guide_image_url && (
                    <div className="text-center mb-4">
                      <img
                        src={product.usage_guide_image_url}
                        alt="Gambar Petunjuk"
                        className="img-fluid rounded-4 border shadow-sm"
                        style={{ maxHeight: '280px', objectFit: 'contain', width: '100%', backgroundColor: '#f8fafc' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: Judul, Info Produk & Beli Produk */}
            <div className="col-md-7 col-lg-7 d-flex flex-column">
              {/* Judul & Harga */}
              <div className="mb-4 pb-4 border-bottom border-light">
                <h1 className="fw-bolder text-dark mb-3" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px', lineHeight: '1.2' }}>{product.name}</h1>
                <h2 className="fw-bold mb-0" style={{ color: '#b91c1c', letterSpacing: '-0.5px', fontSize: '1.8rem' }}>{formatPrice(product.price, product.price_max)}</h2>
              </div>

              {/* Kategori & Badges Info */}
              <div className="mb-4 pb-4 border-bottom border-light">
                <p className="text-muted small mb-3">
                  <span className="fw-semibold text-dark">Kategori</span> : <span className="text-capitalize">{product.category}</span>
                </p>

                <div className="d-flex flex-wrap gap-2">
                  {product.size && <span className="badge rounded-pill text-dark border shadow-sm" style={{ backgroundColor: '#ffffff', fontWeight: '500', padding: '8px 14px' }}>📐 Ukuran: {product.size}</span>}
                  {product.weight > 0 && <span className="badge rounded-pill text-dark border shadow-sm" style={{ backgroundColor: '#ffffff', fontWeight: '500', padding: '8px 14px' }}>⚖️ Berat: {product.weight}g</span>}
                  {product.shelf_life && <span className="badge rounded-pill text-dark border shadow-sm" style={{ backgroundColor: '#ffffff', fontWeight: '500', padding: '8px 14px' }}>⏳ Masa Simpan: {product.shelf_life}</span>}
                  <span className="badge rounded-pill text-success border border-success border-opacity-25 shadow-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', fontWeight: '600', padding: '8px 14px' }}>✓ Ready Stock</span>
                </div>
              </div>

              {/* Deskripsi Produk */}
              <div className="mb-4 pb-4 border-bottom border-light">
                <h6 className="fw-bolder text-dark mb-3" style={{ letterSpacing: '-0.5px', fontSize: '1.1rem' }}>Deskripsi Produk</h6>
                <p className="text-secondary mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#334155', fontSize: '0.95rem' }}>
                  {product.description || "Tidak ada deskripsi untuk produk ini."}
                </p>
              </div>

              {/* BELI PRODUK SECTION */}
              {product.store_id && product.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).some(id => product.store_links?.[id] && Object.values(product.store_links[id]).some(u => u)) && (
                <div className="mt-2 pt-2">
                  <button 
                    className="btn btn-danger w-100 rounded-pill fw-semibold shadow-sm d-flex justify-content-center align-items-center gap-2" 
                    style={{ padding: '14px 0', fontSize: '1.1rem' }}
                    onClick={() => setShowBuyModal(true)}
                  >
                    <ShoppingCart size={22} /> Beli Langsung
                  </button>
                </div>
              )}

              {/* Salin Link — compact, di luar kartu Beli */}
              <div className="mt-3">
                <button
                  className={`btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={handleCopyLink}
                  style={{ transition: 'all 0.25s ease', borderRadius: '50px', padding: '12px 16px', border: copied ? 'none' : '1px solid #cbd5e1', backgroundColor: copied ? '' : '#ffffff' }}
                >
                  {copied ? <><Check size={16} /> Link Tersalin!</> : <><Link2 size={16} /> Salin Link Produk ke Clipboard</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-5">
          <div className="d-flex align-items-center gap-3 mb-4">
            <h4 className="fw-bolder m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
              {related.length > 0 && related[0].category === product.category ? 'Produk Serupa Lainnya' : 'Rekomendasi Produk Lainnya'}
            </h4>
            <div className="flex-grow-1 border-top border-light"></div>
          </div>
          
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
            {related.map(r => (
              <div className="col" key={r.id}>
                <Link to={`/product/${r.name.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || r.id}`} className="text-decoration-none text-dark">
                  <div className="card h-100 product-card card-interactive" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div className="p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8fafc', height: '200px' }}>
                      <img src={r.image_url ? r.image_url.split(/[,\n]+/)[0].trim() : 'https://via.placeholder.com/300'} alt={r.name} style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%', mixBlendMode: 'multiply' }} />
                    </div>
                    
                    <div className="card-body p-4 text-center d-flex flex-column justify-content-between">
                      <div>
                        <h6 className="card-title text-dark mb-2 fw-bold" style={{ lineHeight: '1.4', fontSize: '1.05rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.name}</h6>
                        <h5 className="fw-bolder mb-0" style={{ color: '#b91c1c', letterSpacing: '-0.5px' }}>
                          {formatPrice(r.price, r.price_max)}
                        </h5>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            {related.length === 0 && (
              <div className="col-12 text-muted small py-3">Belum ada rekomendasi produk saat ini.</div>
            )}
          </div>
        </div>
      </div>
      
      {/* MODAL BELI LANGSUNG */}
      {showBuyModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055, backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <ShoppingCart size={22} className="text-danger" /> Pilih Toko Pembelian
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBuyModal(false)}></button>
              </div>
              <div className="modal-body px-4 py-4">
                <div className="d-flex flex-column gap-3">
                  {product.store_id && product.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(storeId => {
                    const s = stores.find(x => x.id.toString() === storeId);
                    const links = product.store_links?.[storeId] || {};
                    const hasLinks = Object.values(links).some(url => url && url.trim() !== '');
                    
                    if (!s || !hasLinks) return null;
                    
                    const platformConfig = {
                      shopee: { color: '#ee4d2d', icon: '🛒', label: 'Shopee' },
                      tokopedia: { color: '#00AA5B', icon: '🟢', label: 'Tokopedia' },
                      lazada: { color: '#0f146d', icon: '💙', label: 'Lazada' },
                      tiktok: { color: '#000000', icon: '🎵', label: 'TikTok Shop' },
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
                            const conf = platformConfig[platform.toLowerCase()] || { color: '#64748b', icon: '🔗', label: platform };
                            return (
                              <a 
                                key={platform}
                                href={url.startsWith('http') ? url : `https://${url}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-sm text-white d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                style={{ backgroundColor: conf.color, borderRadius: '8px', padding: '8px 12px', fontWeight: '500', transition: 'all 0.2s', border: 'none' }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${conf.color}40`; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                              >
                                <span>{conf.icon}</span> {conf.label} <ExternalLink size={14} className="ms-1 opacity-75"/>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!product.store_id || !product.store_id.toString().split(',').some(id => product.store_links?.[id] && Object.values(product.store_links[id]).some(u => u))) && (
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

export default ProductDetail;
