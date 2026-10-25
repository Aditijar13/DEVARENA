import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Grid, List, SlidersHorizontal, Sparkles } from 'lucide-react';
import { fetchEvents, fetchRecommended } from '../store/slices/eventSlice';
import EventCard from '../components/events/EventCard';
import { EmptyState } from '../components/common/index';
import WebGLBackground from '../components/common/WebGLBackground';
import { debounce } from '../utils/helpers';
import '../styles/explore.css';

const CATS   = ['all','hackathon','workshop','webinar','conference','competition','seminar','meetup','bootcamp','startup','open-source','networking'];
const MODES  = [['all','Any mode'],['online','Online'],['offline','In-person'],['hybrid','Hybrid']];
const PRICES = [['all','Free & Paid'],['false','Free only'],['true','Paid only']];
const SORTS  = [['newest','Newest first'],['upcoming','Starting soon'],['popular','Most popular'],['registrations','Most registered']];

const Skel = () => (
  <div className="explore-skeleton">
    <div className="explore-skeleton__img"/>
    <div className="explore-skeleton__body">
      <div className="skeleton" style={{ height:10, width:'36%', borderRadius:6 }}/>
      <div className="skeleton" style={{ height:14, width:'88%', borderRadius:6 }}/>
      <div className="skeleton" style={{ height:11, width:'58%', borderRadius:6 }}/>
      <div className="skeleton" style={{ height:11, width:'48%', borderRadius:6 }}/>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        <div className="skeleton" style={{ height:10, width:'40%', borderRadius:6 }}/>
        <div className="skeleton" style={{ height:10, width:'20%', borderRadius:6 }}/>
      </div>
    </div>
  </div>
);

const Explore = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { events, loading, total, totalPages, currentPage } = useSelector(s => s.events);
  const { isAuthenticated } = useSelector(s => s.auth);

  const [q,       setQ]       = useState(searchParams.get('search') || '');
  const [view,    setView]    = useState('grid');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    mode: 'all', isPaid: 'all', sortBy: 'newest', page: 1,
  });

  const load = useCallback((f, search) => {
    const p = { ...f };
    if (search) p.search = search;
    dispatch(fetchEvents(p));
  }, [dispatch]);

  useEffect(() => { load(filters, q); }, [filters]); // eslint-disable-line
  useEffect(() => { if (isAuthenticated) dispatch(fetchRecommended()); }, [isAuthenticated, dispatch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedQ = useCallback(debounce(val => {
    setFilters(p => { const n = { ...p, page:1 }; load(n, val); return n; });
  }, 380), [load]);

  const setF     = (k, v) => setFilters(p => ({ ...p, [k]:v, page:1 }));
  const clearAll = () => { setQ(''); setFilters({ category:'all', mode:'all', isPaid:'all', sortBy:'newest', page:1 }); };
  const hasFilter = q || filters.category !== 'all' || filters.mode !== 'all' || filters.isPaid !== 'all';

  return (
    <div className="explore-root">

      {/* ── Header with WebGL Background ── */}
      <div className="explore-hero">
        <WebGLBackground intensity={0.55} />
        <div className="explore-hero__inner">
          <div className="explore-hero__badge">
            <Sparkles size={13} color="#5B6EF5" />
            <span>Discover &bull; Compete &bull; Earn Certs</span>
          </div>
          <h1 className="explore-hero__title">
            Explore <span className="explore-hero__title-grad">Developer Events</span>
          </h1>
          <p className="explore-hero__sub">
            Browse hackathons, algorithm workshops, webinars and tech meetups across the globe.
          </p>

          {/* Search bar inside hero */}
          <div className="explore-hero__search-box">
            <Search size={16} className="explore-search-icon" />
            <input
              className="explore-search-input"
              value={q}
              onChange={e => { setQ(e.target.value); debouncedQ(e.target.value); }}
              placeholder="Search 40+ events by name, tech stack, skill, or organizer..."
            />
            {q && (
              <button className="explore-search-clear" onClick={() => { setQ(''); debouncedQ(''); }}>
                <X size={15} />
              </button>
            )}
            <div className="explore-hero__count-pill">
              {total > 0 ? `${total} events` : 'Browse'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Subnav: Categories & View switcher ── */}
      <div className="explore-subnav">
        <div className="explore-subnav__inner">
          <div className="explore-tabs">
            {CATS.map(c => (
              <button key={c}
                className={`explore-tab explore-tab--${filters.category===c?'on':'off'}`}
                onClick={() => setF('category', c)}>
                {c === 'all' ? 'All Events' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <div className="explore-view-btns">
            <button className={`explore-view-btn explore-view-btn--${view==='grid'?'on':'off'}`} onClick={() => setView('grid')} title="Grid view"><Grid size={14}/></button>
            <button className={`explore-view-btn explore-view-btn--${view==='list'?'on':'off'}`} onClick={() => setView('list')} title="List view"><List size={14}/></button>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="explore-filters">
        <div className="explore-filters-inner">
          <SlidersHorizontal size={13} style={{ color:'#9CA3AF', flexShrink:0 }}/>
          <select className="explore-select" value={filters.mode}   onChange={e => setF('mode',   e.target.value)}>
            {MODES.map(([v,l])  => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="explore-select" value={filters.isPaid} onChange={e => setF('isPaid', e.target.value)}>
            {PRICES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="explore-select" value={filters.sortBy} onChange={e => setF('sortBy', e.target.value)}>
            {SORTS.map(([v,l])  => <option key={v} value={v}>{l}</option>)}
          </select>
          {hasFilter && (
            <button className="explore-clear-btn" onClick={clearAll}>
              <X size={11}/> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="explore-body">
        {!loading && events.length > 0 && (
          <div className="explore-meta">
            <span className="explore-meta__text">
              Showing&nbsp;<strong style={{ color:'#111827' }}>{events.length}</strong>&nbsp;of&nbsp;
              <strong style={{ color:'#111827' }}>{total.toLocaleString()}</strong>&nbsp;events
            </span>
          </div>
        )}

        {loading ? (
          <div className={`explore-grid${view==='list'?' explore-grid--list':''}`}>
            {Array.from({ length: 8 }).map((_, i) => <Skel key={i}/>)}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding:'60px 0' }}>
            <EmptyState
              icon={<Search size={20} strokeWidth={1.5}/>}
              title="No events found"
              description="Try different keywords or clear your filters."
              action={hasFilter && (
                <button onClick={clearAll} style={{ marginTop:10, padding:'9px 22px', borderRadius:999, background:'linear-gradient(135deg,#5B6EF5,#7C3AED)', color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  Clear filters
                </button>
              )}
            />
          </div>
        ) : (
          <>
            <div className={`explore-grid${view==='list'?' explore-grid--list':''}`}>
              {events.map(ev => (
                <EventCard key={ev._id} event={ev} size={view==='list'?'compact':'default'}/>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="explore-pagination">
                <button className="explore-pg"
                  disabled={currentPage === 1}
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
                  ← Prev
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pg = i + 1;
                  if (totalPages > 7) {
                    if      (currentPage <= 4)              pg = i + 1;
                    else if (currentPage >= totalPages - 3) pg = totalPages - 6 + i;
                    else                                    pg = currentPage - 3 + i;
                  }
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button key={pg}
                      className={`explore-pg${currentPage===pg?' explore-pg--on':''}`}
                      onClick={() => setFilters(f => ({ ...f, page: pg }))}>
                      {pg}
                    </button>
                  );
                })}

                <button className="explore-pg"
                  disabled={currentPage === totalPages}
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
