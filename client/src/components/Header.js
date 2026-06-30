import React from 'react';
import { User } from 'lucide-react';

const Header = ({ stores }) => {
  const token = localStorage.getItem('token');

  return (
    <div className="sticky-top pt-3 pb-2 px-3">
      <nav className="navbar navbar-minimalist shadow-sm" style={{ borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.05)', padding: '0.8rem 1.5rem' }}>
        <div className="container-fluid d-flex justify-content-between align-items-center px-0">
          <a className="navbar-brand fw-bold m-0" href="/" style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
            DIAMOND STORE<span style={{ color: '#b91c1c', marginLeft: '4px' }}>GROUP</span>
          </a>
          
          <a 
            href={token ? "/admin/dashboard" : "/login"} 
            className="btn d-flex align-items-center gap-2"
            style={{ 
              backgroundColor: '#0f172a', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '50px', 
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
          >
            <User size={16} />
            <span className="d-none d-sm-inline">
              {token ? "Dashboard Admin" : "Login Admin"}
            </span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default Header;