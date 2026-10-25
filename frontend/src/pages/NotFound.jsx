import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexDirection: 'column', gap: 20,
    padding: '100px 24px 80px', textAlign: 'center', background: 'transparent',
  }}>
    <div style={{
      fontSize: 120, fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1,
      background: 'linear-gradient(135deg, #5B6EF5, #7C3AED)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>404</div>
    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Page not found</h1>
    <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px',
          borderRadius: 9999, background: 'linear-gradient(135deg,#5B6EF5,#7C3AED)',
          border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(91,110,245,0.30)',
        }}><Home size={14}/> Go home</button>
      </Link>
      <button onClick={() => window.history.back()} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '12px 24px',
        borderRadius: 9999, background: '#fff', border: '1px solid #E5E7EB',
        color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}><ArrowLeft size={14}/> Go back</button>
    </div>
  </div>
);

export default NotFound;
