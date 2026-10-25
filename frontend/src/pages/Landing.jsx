import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Search, Zap } from 'lucide-react';
import { fetchTrending } from '../store/slices/eventSlice';
import EventCard from '../components/events/EventCard';
import '../styles/landing.css';

/* ─── SVG icon per category (no emojis) ─────────────────── */
const CatSVG = ({ slug, color, size = 18 }) => {
  const p = { fill:'none', stroke:color, strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' };
  const s = { width:size, height:size };
  switch (slug) {
    case 'hackathon':   return <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case 'workshop':    return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    case 'conference':  return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'competition': return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
    case 'bootcamp':    return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    case 'meetup':      return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'webinar':     return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
    case 'open-source': return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    default:            return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  }
};

/* ─── Bento SVG icons ───────────────────────────────────── */
const BIcon = ({ type, color = '#5B6EF5', size = 22 }) => {
  const p = { fill:'none', stroke:color, strokeWidth:'2', strokeLinecap:'round', strokeLinejoin:'round' };
  const s = { width:size, height:size };
  switch (type) {
    case 'search': return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    case 'users':  return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'award':  return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
    case 'code':   return <svg style={s} viewBox="0 0 24 24" {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    case 'chart':  return <svg style={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'msg':    return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    default:       return null;
  }
};

/* ─── Data ──────────────────────────────────────────────── */
const CATS = [
  { name:'Hackathon',   slug:'hackathon',   color:'#5B6EF5', bg:'rgba(91,110,245,0.09)'  },
  { name:'Workshop',    slug:'workshop',    color:'#10B981', bg:'rgba(16,185,129,0.09)'  },
  { name:'Conference',  slug:'conference',  color:'#F59E0B', bg:'rgba(245,158,11,0.09)'  },
  { name:'Competition', slug:'competition', color:'#EF4444', bg:'rgba(239,68,68,0.09)'   },
  { name:'Bootcamp',    slug:'bootcamp',    color:'#7C3AED', bg:'rgba(124,58,237,0.09)'  },
  { name:'Meetup',      slug:'meetup',      color:'#EC4899', bg:'rgba(236,72,153,0.09)'  },
  { name:'Webinar',     slug:'webinar',     color:'#06B6D4', bg:'rgba(6,182,212,0.09)'   },
  { name:'Open Source', slug:'open-source', color:'#22C55E', bg:'rgba(34,197,94,0.09)'   },
];

const TICKER_ITEMS = [
  'Hackathon','Workshop','Conference','Competition',
  'Bootcamp','Meetup','Webinar','Open Source','Networking','Seminar',
];

const HERO_STATS = [
  { num:'4.2K+', label:'Dev Interactions'  },
  { num:'40+',   label:'Curated Events'    },
  { num:'98%',   label:'Verified Certs'    },
  { num:'4.9★',  label:'Community Rating'  },
];

const AV = ['#5B6EF5','#7C3AED','#10B981','#F59E0B','#EF4444'];

/* ─── Floating card ─────────────────────────────────────── */
const HCard = ({ pos, title, cat, catColor, date, location, count }) => (
  <div className={`hero__card hero__card--${pos}`}>
    <div className="hcard__band" style={{ background:`linear-gradient(90deg,${catColor},${catColor}99)` }}/>
    <div className="hcard__body">
      <div className="hcard__cat-row">
        <span className="hcard__cat" style={{ color:catColor }}>{cat}</span>
        <span className="hcard__free">FREE</span>
      </div>
      <p className="hcard__title">{title}</p>
      <p className="hcard__meta">{date} · {location}</p>
      <div className="hcard__foot">
        <div style={{ display:'flex', alignItems:'center' }}>
          <div className="hcard__avs">
            {AV.slice(0,3).map((c,i) => (
              <div key={i} className="hcard__av" style={{ background:c }}>{String.fromCharCode(65+i)}</div>
            ))}
          </div>
          <span style={{ fontSize:10, color:'#6B7280', marginLeft:6 }}>+{count}</span>
        </div>
        <span style={{ fontSize:10, color:'#5B6EF5', fontWeight:600 }}>Register</span>
      </div>
    </div>
  </div>
);

/* ─── Skeleton card ─────────────────────────────────────── */
const SkelCard = () => (
  <div style={{ background:'#fff', border:'1px solid rgba(91,110,245,0.10)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(91,110,245,0.06)' }}>
    <div style={{ height:164, background:'linear-gradient(90deg,#EBEBF8 25%,#F4F4FF 50%,#EBEBF8 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
    <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
      <div className="skeleton" style={{ height:10, width:'36%', borderRadius:6 }}/>
      <div className="skeleton" style={{ height:14, width:'88%', borderRadius:6 }}/>
      <div className="skeleton" style={{ height:11, width:'56%', borderRadius:6 }}/>
    </div>
  </div>
);

/* ─── Main ───────────────────────────────────────────────── */
const Landing = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(s => s.auth);
  const { trending } = useSelector(s => s.events);
  const [q, setQ] = useState('');

  useEffect(() => { dispatch(fetchTrending()); }, [dispatch]);

  const handleSearch = e => {
    e.preventDefault();
    navigate('/explore' + (q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''));
  };

  return (
    <div className="lp lp-hero">

      {/* ══════════ HERO ══════════ */}
      <div className="hero">
        {/* Left */}
        <div>
          <div className="hero__eyebrow">
            <span className="hero__dot"/>
            40+ Curated Developer Events & Hackathons
          </div>

          <h1 className="hero__h1">
            The arena<br/>where devs<br/><span>compete.</span>
          </h1>

          <p className="hero__sub">
            Discover hackathons, workshops and competitions.
            Build your team, earn verifiable certificates,
            and climb the leaderboard.
          </p>

          <form className="hero__search-form" onSubmit={handleSearch}>
            <div className="hero__search">
              <Search size={14} style={{ color:'#9CA3AF', flexShrink:0 }}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search hackathons, workshops…"/>
              <button type="submit" className="hero__search-btn">
                Search <ArrowRight size={13}/>
              </button>
            </div>
          </form>

          <div className="hero__tags">
            <span className="hero__tag-label">Popular:</span>
            {['AI/ML','Web3','Blockchain','DevOps','UI/UX'].map(t => (
              <button key={t} className="hero__tag" onClick={() => navigate(`/explore?search=${t}`)}>{t}</button>
            ))}
          </div>

          <div className="hero__ctas">
            <Link to="/explore" className="hero__btn-primary">
              Explore Events <ArrowRight size={14}/>
            </Link>
            <button className="hero__btn-ghost" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}>
              {isAuthenticated ? 'My Dashboard' : 'Join for free'}
            </button>
          </div>

          <div className="hero__stats">
            {HERO_STATS.map((s, i) => (
              <div key={i} className="hero__stat">
                <p className="hero__stat-num">{s.num}</p>
                <p className="hero__stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — floating cards */}
        <div className="hero__right">
          <HCard pos="a" title="HackIndia 2025 — National Finals" cat="Hackathon" catColor="#5B6EF5" date="Mar 15" location="Online" count="1.2K"/>
          <HCard pos="b" title="Build with AI Workshop Series"   cat="Workshop"  catColor="#10B981" date="May 18" location="Bengaluru" count="642"/>
          <HCard pos="c" title="CyberArena CTF 2025"            cat="Competition" catColor="#EF4444" date="Oct 15" location="Online" count="856"/>

          <div className="hero__badge hero__badge--tr">
            <span className="hero__badge-dot"/>
            Leaderboard Live
          </div>
          <div className="hero__badge hero__badge--br">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5B6EF5" strokeWidth="2.5" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
            AI Matched
          </div>
        </div>
      </div>

      {/* ══════════ TICKER ══════════ */}
      <div className="lp-ticker">
        <div className="lp-ticker__track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="lp-ticker__item">
              <span className="lp-ticker__dot"/>{item}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════ PLATFORM FEATURES ══════════ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-head">
            <div>
              <p className="lp-eyebrow">Platform capabilities</p>
              <h2 className="lp-title">Built for how<br/>developers <em>win.</em></h2>
            </div>
            <Link to="/explore" className="lp-all">Explore events <ArrowRight size={12}/></Link>
          </div>

          <div className="bento">
            {/* AI Recs — span 2 */}
            <div className="bento__cell bento__cell--blue bento__cell--span2">
              <span className="bento__chip bento__chip--new">New</span>
              <div className="bento__icon"><BIcon type="search" color="#5B6EF5" size={24}/></div>
              <p className="bento__title">AI Recommendations</p>
              <p className="bento__desc">A custom scoring engine matched to your skills, tech stack, event history, and bookmarks.</p>
              <p className="bento__metric">87%<span className="bento__metric-sub">match rate</span></p>
            </div>

            {/* Team Formation */}
            <div className="bento__cell">
              <span className="bento__chip bento__chip--live">Live</span>
              <div className="bento__icon"><BIcon type="users" color="#10B981" size={24}/></div>
              <p className="bento__title">Team Formation</p>
              <p className="bento__desc">Post what your team needs. Fill the gap before the deadline.</p>
            </div>

            {/* Active number */}
            <div className="bento__cell bento__cell--blue">
              <span className="bento__chip bento__chip--live">Live</span>
              <p className="bento__big">40+</p>
              <p className="bento__big-label">Curated Events<br/>&amp; Hackathons</p>
            </div>

            {/* Certificates */}
            <div className="bento__cell">
              <span className="bento__chip bento__chip--live">Live</span>
              <div className="bento__icon"><BIcon type="award" color="#7C3AED" size={24}/></div>
              <p className="bento__title">Verifiable Certificates</p>
              <p className="bento__desc">Cryptographic QR codes, instant validation, export to PDF.</p>
            </div>

            {/* Real-time Chat */}
            <div className="bento__cell">
              <span className="bento__chip bento__chip--live">Socket.io</span>
              <div className="bento__icon"><BIcon type="msg" color="#EC4899" size={24}/></div>
              <p className="bento__title">Real-time Team Chat</p>
              <p className="bento__desc">Socket powered — typing indicators, reactions, instant delivery.</p>
            </div>

            {/* 3x faster — span 2 */}
            <div className="bento__cell bento__cell--span2">
              <span className="bento__chip bento__chip--new">Smart Match</span>
              <p className="bento__big">3x</p>
              <p className="bento__big-label">Faster team formation vs manual discord/slack search</p>
            </div>

            {/* Leaderboard */}
            <div className="bento__cell">
              <div className="bento__icon"><BIcon type="chart" color="#F59E0B" size={24}/></div>
              <p className="bento__title">Leaderboard</p>
              <p className="bento__desc">Points, badges and levels based on participation and wins.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section className="lp-section" style={{ paddingTop:0 }}>
        <div className="lp-section-inner">
          <div className="lp-head">
            <div>
              <p className="lp-eyebrow">Browse by type</p>
              <h2 className="lp-title">Find your<br/>next challenge.</h2>
            </div>
            <Link to="/explore" className="lp-all">See all <ArrowRight size={12}/></Link>
          </div>
          <div className="cats">
            {CATS.map(c => (
              <Link key={c.slug} to={`/explore?category=${c.slug}`} className="cat-item">
                <div className="cat-item__icon" style={{ background:c.bg }}>
                  <CatSVG slug={c.slug} color={c.color}/>
                </div>
                <span className="cat-item__name">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TRENDING EVENTS ══════════ */}
      <section className="lp-section" style={{ paddingTop:0 }}>
        <div className="lp-section-inner">
          <div className="lp-head">
            <div>
              <p className="lp-eyebrow">Happening now</p>
              <h2 className="lp-title">Trending events</h2>
            </div>
            <Link to="/explore" className="lp-all">View all <ArrowRight size={12}/></Link>
          </div>

          <div className="trending-grid">
            {trending && trending.length > 0
              ? trending.slice(0, 6).map(ev => <EventCard key={ev._id} event={ev}/>)
              : Array.from({ length: 3 }).map((_, i) => <SkelCard key={i}/>)
            }
          </div>
        </div>
      </section>

      {/* ══════════ SOCIAL PROOF ══════════ */}
      <section className="lp-section" style={{ paddingTop:0 }}>
        <div className="lp-section-inner">
          <div className="social-proof" style={{ marginBottom: 24 }}>
            <div className="social-proof__avs">
              {AV.map((c, i) => (
                <div key={i} className="social-proof__av" style={{ background:c }}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <p className="social-proof__text">
              Rated <strong>4.9 / 5</strong> by <strong>1,400+ developer participants</strong> across algorithmic contests and hackathons.
            </p>
            <div className="social-proof__stars">
              {Array.from({ length:5 }).map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
              <span style={{ marginLeft:7, fontSize:13, fontWeight:700, color:'#374151' }}>4.9 / 5</span>
            </div>
          </div>

          {/* Testimonial Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              {
                name: 'Arjun Sharma', role: 'Full-Stack Developer', av: '#5B6EF5',
                review: 'The real-time leaderboard updates and verifiable PDF certificates with QR codes made participating in CodeArena seamless.'
              },
              {
                name: 'Priya Nair', role: 'ML Engineer', av: '#10B981',
                review: 'Found 3 teammates for the IndiaML Summit within minutes using the Team Formation tool. Clean interface and fast socket chat!'
              },
              {
                name: 'Vikram Deshmukh', role: 'Event Organizer', av: '#7C3AED',
                review: 'Managing 200+ hackathon registrations, approving submissions, and issuing instant certificates took zero manual overhead.'
              }
            ].map((t, idx) => (
              <div key={idx} style={{
                background: '#fff',
                border: '1px solid var(--da-border)',
                borderRadius: 16,
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{t.review}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.av, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TECH STACK & ARCHITECTURE ══════════ */}
      <div className="partners">
        <div className="lp-section-inner">
          <p className="partners__label">Engineered with Production-Grade Architecture</p>
          <div className="partners__logos" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { name: 'React 19', color: '#61DAFB' },
              { name: 'Node.js', color: '#68A063' },
              { name: 'Socket.io', color: '#010101' },
              { name: 'MongoDB', color: '#47A248' },
              { name: 'Redux Toolkit', color: '#764ABC' },
              { name: 'Express', color: '#333333' },
              { name: 'Razorpay', color: '#0C2340' },
              { name: 'Cloudinary', color: '#3448C5' },
            ].map(p => (
              <span key={p.name} style={{
                padding: '6px 14px',
                borderRadius: 9999,
                background: '#fff',
                border: '1px solid rgba(91,110,245,0.14)',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}/>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-cta">
            <div className="lp-cta__text">
              <h2 className="lp-cta__title">Ready to enter<br/>the arena?</h2>
              <p className="lp-cta__sub">
                Thousands of developers are competing right now.<br/>
                Your next breakthrough starts here.
              </p>
            </div>
            <div className="lp-cta__btns">
              <Link to="/register" className="lp-cta__btn-white">
                Start for free <ArrowRight size={13}/>
              </Link>
              <Link to="/leaderboard" className="lp-cta__btn-outline">
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
