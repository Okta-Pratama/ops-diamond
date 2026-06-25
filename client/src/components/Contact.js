import React, { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../api';

const Contact = () => {
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    try {
      await api.post('/feedbacks', { message: msg.trim() });
      alert("Terima kasih atas sarannya! Masukan Anda sangat berarti bagi kami.");
      setMsg('');
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim pesan, coba lagi nanti.");
    }
  };

  return (
    <div className="card p-4 border-0 shadow-sm" style={{ borderRadius: '16px', backgroundColor: '#f8fafc' }}>
      <div className="row align-items-center g-3">
        <div className="col-md-6">
          <h4 className="fw-bold mb-1 text-dark">Hubungi Kami & Beri Saran</h4>
          <p className="small text-muted mb-0">Kami selalu berusaha memberikan pelayanan terbaik untuk Anda.</p>
        </div>
        <div className="col-md-6">
          <form onSubmit={handleSubmit} className="input-group">
            <input 
              type="text" 
              className="form-control rounded-0" 
              placeholder="Tulis pesan atau saran Anda..." 
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              required
            />
            <button className="btn btn-primary rounded-0 d-flex align-items-center justify-content-center" type="submit">
              <Send size={18} className="me-0 me-md-2"/>
              <span className="d-none d-md-inline">Kirim</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;