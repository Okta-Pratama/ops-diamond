import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [username] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Password yang Anda masukkan salah!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light-custom px-3">
      {/* Back Button */}
      <div className="mb-4" style={{ width: '100%', maxWidth: '400px' }}>
        <Link to="/" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-2 hover-opacity">
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>
      </div>

      {/* Login Card */}
      <div className="card login-card p-2" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <div className="card-body p-4 p-md-5">
          {/* Logo & Title */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '56px', height: '56px' }}>
              <span className="fw-bold fs-4">💎</span>
            </div>
            <h4 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Panel Admin</h4>
            <p className="text-muted small">Diamond Store Group</p>
          </div>
          
          {error && (
            <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-4">
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary mb-2">Password Akses</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderRight: 'none' }}>
                  <Lock size={16} />
                </span>
                <input 
                  type="password" 
                  className="form-control border-start-0" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Masukkan password"
                  required 
                  style={{ borderLeft: 'none' }}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2" disabled={loading}>
              {loading ? 'Memvalidasi...' : 'Masuk'}
            </button>
          </form>

          {/* Footer copyright inside card */}
          <div className="mt-4 pt-3 border-top border-light text-center text-muted" style={{ fontSize: '0.72rem' }}>
            © 2026 Diamond Store Group. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;