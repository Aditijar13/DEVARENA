import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, MapPin, Clock, Bookmark, BookmarkCheck, Wifi, Building2, Shuffle } from 'lucide-react';
import { toggleBookmark } from '../../store/slices/eventSlice';
import { toggleBookmarkInStore } from '../../store/slices/authSlice';
import { formatDate, daysUntil, getCategoryColor, getEventStatus, truncate } from '../../utils/helpers';
import '../../styles/eventcard.css';

const AV_COLORS = ['#5B6EF5','#7C3AED','#10B981','#F59E0B','#EF4444','#06B6D4'];

const CAT_BG = {
  hackathon:'rgba(91,110,245,0.09)', workshop:'rgba(16,185,129,0.09)',
  webinar:'rgba(6,182,212,0.09)', conference:'rgba(245,158,11,0.09)',
  competition:'rgba(239,68,68,0.09)', seminar:'rgba(139,92,246,0.09)',
  meetup:'rgba(236,72,153,0.09)', bootcamp:'rgba(124,58,237,0.09)',
  startup:'rgba(20,184,166,0.09)', 'open-source':'rgba(34,197,94,0.09)',
  networking:'rgba(168,85,247,0.09)', cultural:'rgba(251,146,60,0.09)',
  other:'rgba(107,114,128,0.09)',
};

const STATUS_STYLE = {
  success: { bg:'rgba(16,185,129,0.12)',  color:'#059669', border:'rgba(16,185,129,0.25)' },
  primary: { bg:'rgba(91,110,245,0.10)',  color:'#4F46E5', border:'rgba(91,110,245,0.22)' },
  warning: { bg:'rgba(245,158,11,0.10)',  color:'#D97706', border:'rgba(245,158,11,0.22)' },
  danger:  { bg:'rgba(239,68,68,0.10)',   color:'#DC2626', border:'rgba(239,68,68,0.22)'  },
  muted:   { bg:'rgba(107,114,128,0.10)', color:'#6B7280', border:'rgba(107,114,128,0.18)'},
};

const EventCard = ({ event, size = 'default' }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(s => s.auth);

  const isBookmarked = user?.bookmarkedEvents?.includes(event._id) || event.isBookmarked;
  const status   = getEventStatus(event);
  const deadline = daysUntil(event.registrationDeadline);
  const compact  = size === 'compact';
  const catColor = getCategoryColor(event.category);
  const catBg    = CAT_BG[event.category] || 'rgba(107,114,128,0.09)';
  const ss       = STATUS_STYLE[status.color] || STATUS_STYLE.muted;
  const regCount = event.registeredCount || 0;

  const modeLabel = { online:'Online', offline:'In-person', hybrid:'Hybrid' }[event.mode] || 'Online';
  const ModeIcon  = event.mode === 'offline' ? Building2 : event.mode === 'hybrid' ? Shuffle : Wifi;

  const handleBm = e => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) return;
    dispatch(toggleBookmark(event._id));
    dispatch(toggleBookmarkInStore(event._id));
  };

  return (
    <Link to={`/events/${event.slug}`} className="ecard">
      {/* ── Banner ── */}
      <div className={`ecard__banner ecard__banner--${compact ? 'compact' : 'default'}`}>
        {event.banner
          ? <img src={event.banner} alt={event.title} className="ecard__banner-img"/>
          : (
            <div className="ecard__banner-fallback"
              style={{ background:`linear-gradient(135deg,${catColor}22,${catColor}0d)` }}>
              <span style={{ fontSize:compact?18:22, fontWeight:900, letterSpacing:'-0.02em', color:catColor, opacity:.65 }}>
                {(event.category || 'EVT').toUpperCase().slice(0,5)}
              </span>
            </div>
          )
        }
        <div className="ecard__banner-scrim"/>

        <div className="ecard__status"
          style={{ background:ss.bg, color:ss.color, border:`1px solid ${ss.border}` }}>
          {status.label}
        </div>

        <button className={`ecard__bm${isBookmarked?' ecard__bm--saved':''}`} onClick={handleBm}>
          {isBookmarked ? <BookmarkCheck size={13}/> : <Bookmark size={13}/>}
        </button>

        {deadline > 0 && deadline <= 30 && (
          <div className="ecard__deadline"><Clock size={9}/>&nbsp;{deadline}d left</div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="ecard__body">
        <div className="ecard__top-row">
          <span className="ecard__cat" style={{ background:catBg, color:catColor }}>
            {event.category}
          </span>
          {event.isPaid
            ? <span className="ecard__price-paid">₹{(event.price||0).toLocaleString()}</span>
            : <span className="ecard__price-free">FREE</span>
          }
        </div>

        <h3 className="ecard__title">{event.title}</h3>

        {!compact && event.shortDescription && (
          <p className="ecard__desc">{truncate(event.shortDescription, 88)}</p>
        )}

        <div className="ecard__meta">
          <div className="ecard__meta-row">
            <span className="ecard__meta-icon" style={{ background:'rgba(91,110,245,0.09)' }}>
              <Calendar size={11} color="#5B6EF5"/>
            </span>
            {formatDate(event.startDate)}
            {event.endDate && event.endDate !== event.startDate
              ? ` – ${formatDate(event.endDate,'MMM d')}` : ''}
          </div>
          <div className="ecard__meta-row">
            <span className="ecard__meta-icon" style={{ background:'rgba(124,58,237,0.09)' }}>
              <MapPin size={11} color="#7C3AED"/>
            </span>
            {event.mode === 'online'
              ? 'Online'
              : event.location?.city || 'TBA'}
          </div>
        </div>

        <div className="ecard__footer">
          <div style={{ display:'flex', alignItems:'center' }}>
            <div className="ecard__avs">
              {AV_COLORS.slice(0, regCount > 0 ? 3 : 1).map((c,i) => (
                <div key={i} className="ecard__av" style={{ background:c }}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <span className="ecard__reg">
              {regCount > 0 ? `${regCount.toLocaleString()} registered` : 'Be first!'}
            </span>
          </div>
          <div className="ecard__mode">
            <ModeIcon size={10}/>&nbsp;{modeLabel}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
