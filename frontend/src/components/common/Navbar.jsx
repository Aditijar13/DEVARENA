import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Bell, Menu, X, LogOut, Plus, ChevronDown, Zap, LayoutDashboard, User, Award, MessageSquare } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { generateAvatar, getLevelInfo } from '../../utils/helpers';
import NotificationDropdown from '../dashboard/NotificationDropdown';
import { setNotifications } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import '../../styles/navbar.css';

const Navbar = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, isAuthenticated, loading: authLoading, initializing } = useSelector(s => s.auth);
  const { unreadCount } = useSelector(s => s.notifications);
  const unreadChat = useSelector(s => s.chat?.unreadCount || 0);

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [scrolled,     setScrolled]     = useState(false);

  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);
  const authPending = initializing || authLoading;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/notifications?limit=15')
        .then(({ data }) => {
          dispatch(setNotifications({ notifications: data.notifications || [], unreadCount: data.unreadCount || 0 }));
        })
        .catch(() => {});
    }
  }, [isAuthenticated, dispatch]);

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) { navigate('/explore?search=' + encodeURIComponent(search.trim())); setSearch(''); }
  };

  const { initials, color } = generateAvatar(user?.name || '');
  const levelInfo = user ? getLevelInfo(user.points || 0) : null;
  const isActive  = p => location.pathname === p || location.pathname.startsWith(p + '/');

  const navLinks = [
    { to: '/explore',     label: 'Explore'     },
    { to: '/leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated && (user?.role === 'organizer' || user?.role === 'admin')
      ? [{ to: '/organizer', label: 'Organizer' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const menuItems = [
    { to: '/dashboard',    icon: <LayoutDashboard size={14}/>, label: 'Dashboard'    },
    { to: '/profile',      icon: <User size={14}/>,            label: 'My Profile'   },
    { to: '/certificates', icon: <Award size={14}/>,           label: 'Certificates' },
    { to: '/chat',         icon: <MessageSquare size={14}/>,   label: 'Messages',    badge: unreadChat > 0 ? unreadChat : null },
  ];

  const renderRight = () => {
    if (authPending) return (
      <div style={{ width: 80, height: 34, borderRadius: 9999, background: 'var(--da-surface-3)', animation: 'shimmer 1.4s infinite' }}/>
    );
    if (isAuthenticated && user) return (
      <>
        {(user.role === 'organizer' || user.role === 'admin') && (
          <Link to="/events/create" className="hide-mobile" style={{ textDecoration: 'none' }}>
            <button className="navbar__create-btn"><Plus size={13}/> Create</button>
          </Link>
        )}
        <Link to="/chat" style={{ textDecoration: 'none' }}>
          <button className="navbar__icon-btn" title="Messages">
            <MessageSquare size={15} strokeWidth={1.6}/>
            {unreadChat > 0 && <span className="navbar__badge">{unreadChat > 9 ? '9+' : unreadChat}</span>}
          </button>
        </Link>
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="navbar__icon-btn" onClick={() => setNotifOpen(o => !o)} title="Notifications">
            <Bell size={15} strokeWidth={1.6}/>
            {unreadCount > 0 && <span className="navbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)}/>}
        </div>
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button className="navbar__user" onClick={() => setUserMenuOpen(o => !o)}>
            {user.avatar
              ? <img src={user.avatar} alt="" className="navbar__user-av"/>
              : <div className="navbar__user-av" style={{ background: color }}>{initials}</div>
            }
            <span className="navbar__user-name hide-mobile">{user.name?.split(' ')[0]}</span>
            <ChevronDown size={11} className={`navbar__caret${userMenuOpen ? ' navbar__caret--open' : ''}`}/>
          </button>
          {userMenuOpen && (
            <div className="navbar__dropdown">
              <div className="navbar__dd-head">
                <p className="navbar__dd-name">{user.name}</p>
                <p className="navbar__dd-email">{user.email}</p>
                {levelInfo && (
                  <div className="navbar__dd-level"><Zap size={10}/> Lv.{levelInfo.level} · {levelInfo.title}</div>
                )}
              </div>
              <div className="navbar__dd-items">
                {menuItems.map(item => (
                  <Link key={item.to} to={item.to} className="navbar__dd-item" onClick={() => setUserMenuOpen(false)}>
                    {item.icon} {item.label}
                    {item.badge && <span className="navbar__dd-item-badge">{item.badge}</span>}
                  </Link>
                ))}
                <div className="navbar__dd-sep"/>
                <button className="navbar__dd-item navbar__dd-item--danger"
                  onClick={() => { dispatch(logout()); navigate('/'); setUserMenuOpen(false); }}>
                  <LogOut size={14}/> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
    return (
      <>
        <Link to="/login"><button className="navbar__btn-login">Log in</button></Link>
        <Link to="/register"><button className="navbar__btn-signup">Join for free <Zap size={12}/></button></Link>
      </>
    );
  };

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo">
            <div className="navbar__logo-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
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
            Dev<span className="navbar__logo-accent">Arena</span>
          </Link>

          <div className="navbar__links">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`navbar__link${isActive(l.to) ? ' navbar__link--active' : ''}`}>
                {l.label}
              </Link>
            ))}
          </div>

          <form className="navbar__search-form" onSubmit={handleSearch}>
            <div className="navbar__search-wrap">
              <Search size={13} className="navbar__search-icon"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search events, skills, people…" className="navbar__search-input"/>
            </div>
          </form>

          <div className="navbar__right">{renderRight()}</div>

          <button className="navbar__hamburger" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </nav>

      <div className={`navbar__mobile${mobileOpen ? ' navbar__mobile--open' : ''}`}>
        {navLinks.map(l => (
          <Link key={l.to} to={l.to} className={`navbar__mobile-link${isActive(l.to) ? ' navbar__mobile-link--active' : ''}`}>
            {l.label}
          </Link>
        ))}
        {!isAuthenticated && (
          <div className="navbar__mobile-auth">
            <Link to="/login"><button className="navbar__btn-login" style={{ width: '100%' }}>Log in</button></Link>
            <Link to="/register"><button className="navbar__btn-signup" style={{ width: '100%', justifyContent: 'center' }}>Join free</button></Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
