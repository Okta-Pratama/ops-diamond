import React from 'react';
import { User } from 'lucide-react';

const Header = () => {
  const token = localStorage.getItem('token');

  return (
    <div className="sticky-top" style={{ zIndex: 1030 }}>
      <nav 
        className="navbar transition-all" 
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(24px)', 
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
          padding: '1rem 0',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          <a 
            className="navbar-brand d-flex align-items-center m-0 text-decoration-none" 
            href="/" 
            style={{ transition: 'opacity 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div 
              className="d-flex align-items-center justify-content-center me-2"
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '900',
                fontSize: '1.2rem',
                letterSpacing: '-1px'
              }}
            >
              D
            </div>
            <span className="fw-bolder" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px', color: '#0f172a' }}>
              DIAMOND STORE<span style={{ color: '#ef4444' }}>GROUP</span>
            </span>
          </a>
          
          <a 
            href={token ? "/admin/dashboard" : "/login"} 
            className="d-flex align-items-center gap-2 text-decoration-none"
            style={{ 
              backgroundColor: '#0f172a', 
              color: '#ffffff', 
              borderRadius: '50px', 
              padding: '0.6rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.backgroundColor = '#1e293b'; 
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.25)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.transform = 'none'; 
              e.currentTarget.style.backgroundColor = '#0f172a'; 
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)';
            }}
          >
            <User size={16} strokeWidth={2.5} />
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