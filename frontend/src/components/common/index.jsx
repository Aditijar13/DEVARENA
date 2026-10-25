import React from 'react';
import { BarChart2 } from 'lucide-react';

/* ── Spinner ── */
export const Spinner = ({ size = 18, color = '#5B6EF5' }) => (
  <div style={{
    width: size, height: size,
    border: `2px solid rgba(91,110,245,0.15)`,
    borderTopColor: color,
    borderRadius: '9999px',
    animation: 'spin 0.65s linear infinite',
    flexShrink: 0, display: 'inline-block',
  }}/>
);

/* ── LoadingScreen ── */
export const LoadingScreen = () => (
  <div style={{
    position: 'fixed', inset: 0, background: '#F4F4FF',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 9999,
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: 'linear-gradient(135deg,#5B6EF5,#7C3AED)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(91,110,245,0.35)',
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
        <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
        <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
        <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
      </svg>
    </div>
    <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827', fontFamily: "'Space Grotesk', sans-serif" }}>
      Dev<span style={{ color: '#5B6EF5' }}>Arena</span>
    </p>
    <div style={{ display: 'flex', gap: 6 }}>
      {[['#5B6EF5',0],['#7C3AED',0.15],['#EC4899',0.30]].map(([c,d],i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: c,
          animation: `loading-bounce 1.2s ease-in-out ${d}s infinite`,
        }}/>
      ))}
    </div>
  </div>
);

/* ── EmptyState ── */
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign:'center', padding:'48px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
    <div style={{
      width:56, height:56, borderRadius:16,
      background:'rgba(91,110,245,0.07)', border:'1px solid rgba(91,110,245,0.15)',
      display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF',
    }}>
      {icon || <BarChart2 size={22} strokeWidth={1.5}/>}
    </div>
    <div>
      <h3 style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:6 }}>{title || 'Nothing here yet'}</h3>
      <p style={{ fontSize:13, color:'#6B7280', maxWidth:280, margin:'0 auto', lineHeight:1.6 }}>{description}</p>
    </div>
    {action}
  </div>
);

/* ── Footer ── */
export const Footer = () => {
  const cols = [
    { title:'Platform',  links:['Explore Events','Hackathons','Workshops','Contests','Leaderboard'] },
    { title:'Resources', links:['Blog','Guidelines','Help Center','Terms of Service','Privacy Policy'] },
    { title:'Company',   links:['About Us','Careers','Contact Us','Partners','Press Kit'] },
  ];
  return (
    <footer style={{ background:'#fff', borderTop:'1px solid rgba(91,110,245,0.10)', marginTop:'auto', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 24px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr repeat(3,1fr) 1.6fr', gap:40, marginBottom:40 }}>
          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#5B6EF5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                  <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                  <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
                  <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
                </svg>
              </div>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16, color:'#111827' }}>
                Dev<span style={{ color:'#5B6EF5' }}>Arena</span>
              </span>
            </div>
            <p style={{ fontSize:13, color:'#6B7280', lineHeight:1.65, maxWidth:200, marginBottom:16 }}>
              The ultimate platform for developers to compete, learn and grow together.
            </p>
            <div style={{ display:'flex', gap:8 }}>
              {['GH','X','LI','DC'].map((s,i) => (
                <span key={i} style={{
                  width:28, height:28, borderRadius:7,
                  background:'#F3F4F6', border:'1px solid #E5E7EB',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:9, fontWeight:800, color:'#6B7280', textDecoration:'none',
                }}>{s}</span>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#374151', marginBottom:14 }}>{col.title}</p>
              {col.links.map(l => (
                <span key={l} style={{ display:'block', fontSize:13, color:'#6B7280', marginBottom:9, cursor:'pointer' }}>{l}</span>
              ))}
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'#374151', marginBottom:14 }}>Newsletter</p>
            <p style={{ fontSize:13, color:'#6B7280', marginBottom:12, lineHeight:1.55 }}>Get the latest events and updates right in your inbox.</p>
            <div style={{ display:'flex', gap:6 }}>
              <input placeholder="Enter your email" style={{
                flex:1, padding:'9px 14px', borderRadius:9999,
                border:'1px solid #E5E7EB', background:'#F9FAFB',
                fontSize:13, color:'#374151', outline:'none',
              }}/>
              <button style={{
                width:34, height:34, borderRadius:'50%',
                background:'linear-gradient(135deg,#5B6EF5,#7C3AED)', border:'none',
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', flexShrink:0,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(0,0,0,0.06)', padding:'16px 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <p style={{ fontSize:12, color:'#9CA3AF' }}>© {new Date().getFullYear()} DevArena. All rights reserved.</p>
          <p style={{ fontSize:12, color:'#9CA3AF' }}>Built for developers, by developers.</p>
        </div>
      </div>
    </footer>
  );
};


/* ── StatCard ── */
export const StatCard = ({ icon, label, value, color = '#5B6EF5' }) => (
  <div style={{
    background: '#fff', border: '1px solid rgba(91,110,245,0.10)',
    borderRadius: 16, padding: '20px 22px', flex: 1,
    boxShadow: '0 2px 12px rgba(91,110,245,0.07)',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '0 0 16px 16px' }}/>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF' }}>{label}</p>
      {icon && (
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(91,110,245,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
      )}
    </div>
    <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: '#111827', lineHeight: 1 }}>{value ?? '--'}</p>
  </div>
);

/* ── Modal ── */
export const Modal = ({ isOpen, onClose, title, children, footer, width = 480 }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: width, background: '#fff',
        borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        overflow: 'hidden', animation: 'dd-in 180ms ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(91,110,245,0.08)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: '1px solid #E5E7EB',
            background: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#6B7280', lineHeight: 1,
          }}>&#x2715;</button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 22px' }}>{children}</div>
        {/* Footer */}
        {footer && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 22px', borderTop: '1px solid rgba(91,110,245,0.08)', background: '#F9FAFB' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export { default as ProtectedRoute } from './ProtectedRoute';
export { BadgeIcon, DevBadge, RankMedal, PrizeBadge } from './BadgeIcon';
