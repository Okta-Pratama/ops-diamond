import React from 'react';
import { User } from 'lucide-react';

const Header = ({ stores }) => {
  const token = localStorage.getItem('token');

  return (
    <nav className="navbar navbar-minimalist sticky-top">
      <div className="container d-flex justify-content-between align-items-center">
        <a className="navbar-brand fw-bold" href="/">
          DIAMOND STORE<span>GROUP</span>
        </a>
        
        <a 
          href={token ? "/admin/dashboard" : "/login"} 
          className="btn btn-sm d-flex align-items-center gap-2"
          style={{ 
            backgroundColor: '#000000', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '8px 14px',
            fontSize: '0.85rem',
            fontWeight: '600',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <User size={15} />
          <span className="d-none d-sm-inline">
            {token ? "Dashboard Admin" : "Login Admin"}
          </span>
        </a>
      </div>
    </nav>
  );
};

export default Header;