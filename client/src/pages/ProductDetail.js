import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import { Link2, Check, ArrowLeft, ShoppingCart } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [stores, setStores] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copied, setCopied] = useState(false);

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
          <Link to="/" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-2 hover-opacity">
            <ArrowLeft size={16} />
            Kembali ke Katalog
          </Link>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Beranda</Link></li>
              <li className="breadcrumb-item text-muted text-capitalize">{product.category}</li>
              <li className="breadcrumb-item active text-dark fw-medium" aria-current="page">
                {product.name.length > 10 ? product.name.substring(0, 10) + '...' : product.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* Product Inspector Area */}
        <div className="card border-0 shadow-sm p-4 bg-white mb-5" style={{ borderRadius: '16px' }}>

          {/* ── JUDUL BESAR DI PALING ATAS ── */}
          <div className="mb-4 pb-3 border-bottom">
            <h1 className="fw-bold text-dark mb-1" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>{product.name}</h1>
            <h3 className="text-primary fw-bold mb-0">{formatPrice(product.price, product.price_max)}</h3>
          </div>

          <div className="row g-4 md-g-5">
            {/* Left Col: Image (toggle ke video) + Info Produk */}
            <div className="col-md-6">
              {/* Media Area: gambar dulu, klik → video */}
              <div>
                <div
                  className="bg-light-custom rounded-4 d-flex align-items-center justify-content-center border border-light position-relative"
                  style={{ height: '380px', overflow: 'hidden' }}
                >
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="img-fluid"
                    style={{ maxHeight: '90%', objectFit: 'contain' }}
                  />
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="d-flex gap-2 mt-3 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {images.map((img, idx) => (
                      <div 
                        key={idx}
                        className={`rounded-3 border ${idx === activeImageIdx ? 'border-primary border-2' : 'border-light'} overflow-hidden flex-shrink-0 cursor-pointer`}
                        style={{ width: '70px', height: '70px', cursor: 'pointer' }}
                        onClick={() => setActiveImageIdx(idx)}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Produk di bawah Media */}
              <div className="mt-4">
                {/* Kategori sebagai teks biasa */}
                <p className="text-muted small mb-3">
                  <span className="fw-semibold text-dark">Kategori</span> : <span className="text-capitalize">{product.category}</span>
                </p>

                {/* Badges Info */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {product.size && <span className="badge bg-light text-dark border">📐 Ukuran: {product.size}</span>}
                  {product.weight > 0 && <span className="badge bg-light text-dark border">⚖️ Berat: {product.weight}g</span>}
                  {product.shelf_life && <span className="badge bg-light text-dark border">⏳ Masa Simpan: {product.shelf_life}</span>}
                  <span className="badge bg-success bg-opacity-10 text-success">✓ Ready Stock</span>
                </div>

                <h6 className="fw-bold text-dark small text-uppercase" style={{ letterSpacing: '0.5px' }}>Deskripsi Produk</h6>
                <p className="text-secondary small mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {product.description || "Tidak ada deskripsi untuk produk ini."}
                </p>
              </div>
            </div>

            {/* Right Col: Cara Pakai & Beli Produk */}
            <div className="col-md-6 d-flex flex-column">
              <div className="d-flex flex-column flex-grow-1 p-4 rounded-4 border" style={{ backgroundColor: '#f8f9fa' }}>
                {(product.usage_guide_title || videoUrl || product.usage_guide_image_url) ? (
                  <>
                    <h5 className="fw-bold text-dark mb-3">📖 Panduan Cara Pakai</h5>
                    
                    {videoUrl && (
                      <div className="mb-4 rounded-4 overflow-hidden border border-light shadow-sm position-relative bg-dark" style={{ height: '220px' }}>
                        {isYoutube ? (
                          <div className="ratio ratio-16x9" style={{ height: '100%' }}>
                            <iframe
                              src={`${embedUrl}?autoplay=0`}
                              title="Video Panduan"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                      <h6 className="fw-bold text-primary mb-2">{product.usage_guide_title}</h6>
                    )}
                    {product.usage_guide_description && (
                      <p className="text-secondary small mb-3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                        {product.usage_guide_description}
                      </p>
                    )}
                    {product.usage_guide_image_url && (
                      <div className="text-center mb-3">
                        <img
                          src={product.usage_guide_image_url}
                          alt="Gambar Petunjuk"
                          className="img-fluid rounded-3 border shadow-sm"
                          style={{ maxHeight: '240px', objectFit: 'contain', width: '100%' }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-muted text-center py-4">
                    <span style={{ fontSize: '2rem' }}>📋</span>
                    <p className="small mt-2 mb-0">Belum ada panduan cara pakai untuk produk ini.</p>
                  </div>
                )}

                {/* Salin Link — compact, di dalam kartu */}
                <div className="mt-auto pt-3 border-top">
                  <button
                    className={`btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={handleCopyLink}
                    style={{ transition: 'all 0.25s ease', borderRadius: '8px', padding: '8px 16px' }}
                  >
                    {copied ? <><Check size={14} /> Link Tersalin!</> : <><Link2 size={14} /> Salin Link Produk</>}
                  </button>
                </div>
              </div>

              {/* BELI PRODUK SECTION */}
              <div className="mt-4 p-4 rounded-4 bg-white" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
                <h6 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#0f172a' }}>
                  <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle" style={{ width: '32px', height: '32px' }}>
                    <ShoppingCart size={16} className="text-primary"/> 
                  </div>
                  Beli Produk Ini di Marketplace
                </h6>
                {product.store_id && product.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).some(id => product.store_links?.[id] && Object.values(product.store_links[id]).some(u => u)) ? (
                  <div className="d-flex flex-column gap-3">
                    {product.store_id.toString().split(',').map(x => x.trim()).filter(Boolean).map(storeId => {
                      const s = stores.find(x => x.id.toString() === storeId);
                      const links = product.store_links?.[storeId] || {};
                      const hasLinks = Object.values(links).some(url => url && url.trim() !== '');
                      
                      if (!s || !hasLinks) return null;
                      
                      const platformConfig = {
                        shopee: { color: '#ee4d2d', icon: '🛒', label: 'Shopee' },
                        tokopedia: { color: '#00AA5B', icon: '🟢', label: 'Tokopedia' },
                        lazada: { color: '#0f136d', icon: '🔵', label: 'Lazada' },
                        tiktok: { color: '#000000', icon: '🎵', label: 'TikTok Shop' }
                      };
                      
                      return (
                        <div key={storeId} className="p-3 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="small fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#334155' }}>
                            <span style={{ fontSize: '1.2rem' }}>🛍️</span> {s.name}
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {['shopee', 'tokopedia', 'lazada', 'tiktok'].map(platform => {
                              const url = links[platform];
                              const config = platformConfig[platform];
                              if (!url || !config) return null;
                              return (
                                <a 
                                  key={platform} 
                                  href={url.startsWith('http') ? url : `https://${url}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="btn text-white shadow-sm d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
                                  style={{ 
                                    backgroundColor: config.color,
                                    fontSize: '0.85rem',
                                    borderRadius: '10px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = `0 6px 12px ${config.color}40`;
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
                                  }}
                                >
                                  <span style={{ fontSize: '1rem' }}>{config.icon}</span>
                                  {config.label}
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="small text-muted py-4 text-center border rounded-4" style={{ backgroundColor: '#f8fafc', borderStyle: 'dashed !important' }}>
                    Belum ada link pembelian untuk produk ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div>
          <h4 className="fw-bold mb-4 text-dark" style={{ letterSpacing: '-0.5px' }}>
            {related.length > 0 && related[0].category === product.category ? 'Produk Serupa Lainnya' : 'Rekomendasi Produk Lainnya'}
          </h4>
          <div className="row row-cols-2 row-cols-md-4 g-4">
            {related.map(r => (
              <div className="col" key={r.id}>
                <Link to={`/product/${r.name.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || r.id}`} className="text-decoration-none">
                  <div className="card h-100 shadow-sm product-card bg-white" style={{ borderRadius: '12px' }}>
                    <img src={r.image_url ? r.image_url.split(/[,\n]+/)[0].trim() : 'https://via.placeholder.com/200'} className="card-img-top p-3" alt={r.name} style={{ height: '180px', objectFit: 'contain' }} />
                    <div className="card-body text-center p-3 border-top border-light">
                      <div className="text-primary fw-bold mb-1" style={{ fontSize: '0.95rem' }}>{formatPrice(r.price, r.price_max)}</div>
                      <h6 className="card-title fw-normal text-dark small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.name}</h6>
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
    </div>
  );
};

export default ProductDetail;
