import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowRight, Clock, Zap, TrendingUp, Award, Calendar,
  FileText, Star, Download
} from 'lucide-react';
import api from '../utils/api';
import { formatDate, getLevelInfo, getCategoryColor, timeAgo } from '../utils/helpers';
import { Spinner, EmptyState, DevBadge, BadgeIcon } from '../components/common/index';
import EventCard from '../components/events/EventCard';
import '../styles/dashboard.css';

/*  Section shell  */
const Shell = ({ title, icon, action, actionTo, children, noPad = false, accent }) => (
  <div className="dash-shell">
    {accent && <div className="dash-shell__accent" style={{ background: accent }} />}
    <div className="dash-shell__header">
      <span className="dash-shell__title">
        {icon}{title}
      </span>
      {action && actionTo && (
        <Link to={actionTo} className="dash-shell__action">
          {action} <ArrowRight size={11} />
        </Link>
      )}
    </div>
    <div className={noPad ? undefined : 'dash-shell__body'}>{children}</div>
  </div>
);

/*  List row  */
const Row = ({ to, iconBg, iconEl, title, sub, right }) => (
  <Link to={to} className="dash-row">
    <div className="dash-row__icon" style={iconBg ? { background: iconBg } : undefined}>
      {iconEl}
    </div>
    <div className="dash-row__main">
      <p className="dash-row__title">{title}</p>
      <p className="dash-row__sub">{sub}</p>
    </div>
    {right && <div className="dash-row__right">{right}</div>}
  </Link>
);

/*  Dashboard  */
const UserDashboard = () => {
  const { user }          = useSelector(s => s.auth);
  const [dash, setDash]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState('overview');
  const level             = getLevelInfo(user?.points || 0);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    api.get('/users/dashboard')
      .then(({ data }) => setDash(data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Spinner size={28} />
    </div>
  );

  const { initials, color } = (() => {
    const name  = user?.name || '';
    const parts = name.split(' ');
    const ini   = parts.map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const cols  = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e'];
    return { initials: ini, color: cols[(name.charCodeAt(0) || 0) % cols.length] };
  })();

  return (
    <div className="dash-root">

      {/*  Dark hero strip  */}
      <div className="dash-hero">
        <div className="container dash-hero__inner">
          <div className="dash-hero__top">
            <div className="dash-hero__profile">
              <div className="dash-hero__avatar-wrap">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="dash-hero__avatar" />
                  : <div className="dash-hero__avatar" style={{ background: color }}>{initials}</div>
                }
              </div>
              <div>
                <p className="dash-hero__greet">{greet()},</p>
                <h1 className="dash-hero__name">{user?.name}</h1>
                <div className="dash-hero__badges">
                  <span className="dash-hero__level">
                    <span className="dash-hero__status-dot" /> Lv.{level.level} · {level.title}
                  </span>
                  <span className="dash-hero__pts">
                    <Zap size={12} color="#FBBF24" fill="#FBBF24" /> {(user?.points || 0).toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
            <Link to="/explore" style={{ textDecoration: 'none' }}>
              <button className="dash-hero__explore-btn">
                Explore Events <ArrowRight size={15} />
              </button>
            </Link>
          </div>

          {/* XP bar */}
          <div className="dash-xp">
            <div className="dash-xp__meta">
              <span className="dash-xp__label">Level {level.level} — {level.title}</span>
              <span className="dash-xp__next">
                <strong>{level.pointsToNextLevel}</strong> pts to Lv.{level.level + 1}
              </span>
            </div>
            <div className="dash-xp__bar-bg">
              <div className="dash-xp__bar-fill" style={{ width: `${level.progress}%` }} />
            </div>
            <div className="dash-xp__ticks">
              <span className="dash-xp__tick">Lv.{level.level}</span>
              <span className="dash-xp__tick dash-xp__pct">{level.progress}%</span>
              <span className="dash-xp__tick">Lv.{level.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 24px 0' }}>

        {/* Profile nudge */}
        {(dash?.user?.profileCompletion || 0) < 70 && (
          <div className="dash-nudge">
            <Star size={16} className="dash-nudge__icon" style={{ color: 'var(--da-amber)', flexShrink: 0 }} />
            <div className="dash-nudge__text">
              <p className="dash-nudge__title">
                Profile incomplete — {dash?.user?.profileCompletion || 0}%
              </p>
              <p className="dash-nudge__sub">Add skills, bio &amp; links for better AI recommendations</p>
            </div>
            <Link to="/profile" className="dash-nudge__link">
              Complete <ArrowRight size={11} />
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats">
          {[
            { icon: <Calendar size={16} />, label: 'Events Joined',
              value: dash?.user?.stats?.eventsJoined || 0,    color: 'var(--da-blue)'    },
            { icon: <Zap      size={16} />, label: 'Teams',
              value: (dash?.user?.stats?.teamsJoined || 0) + (dash?.user?.stats?.teamsCreated || 0),
              color: 'var(--da-emerald)' },
            { icon: <FileText size={16} />, label: 'Certificates',
              value: dash?.user?.stats?.certificatesEarned || 0, color: 'var(--da-amber)' },
            { icon: <Award    size={16} />, label: 'Badges',
              value: user?.badges?.length || 0,                color: 'var(--da-violet)'  },
          ].map((s, i) => (
            <div key={i} className="dash-stat" style={{ '--stat-color': s.color }}>
              <div className="dash-stat__icon"
                style={{ background: `${s.color}14`, border: `0.8px solid ${s.color}28`, color: s.color }}>
                {s.icon}
              </div>
              <p className="dash-stat__val">{s.value}</p>
              <p className="dash-stat__label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'my events', label: 'My Events' },
            { id: 'achievements', label: 'Achievements' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`dash-tab ${tab === t.id ? 'dash-tab--active' : 'dash-tab--inactive'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab === 'overview' && (
          <div className="dash-grid">
            <Shell title="Upcoming Events" icon={<Calendar size={14} style={{ color: 'var(--da-blue)' }} />}
              action="See all" actionTo="/explore"
              accent="linear-gradient(90deg,var(--da-blue),var(--da-violet))">
              {!dash?.upcomingEvents?.length
                ? <EmptyState icon={null}
                    title="No upcoming events"
                    description="Register for events to see them here" />
                : dash.upcomingEvents.slice(0, 5).map(ev => (
                    <Row key={ev._id} to={`/events/${ev.slug}`}
                      iconBg={`${getCategoryColor(ev.category)}14`}
                      iconEl={<Calendar size={15} style={{ color: getCategoryColor(ev.category) }} />}
                      title={ev.title}
                      sub={
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={9} /> {formatDate(ev.startDate, 'MMM d')} · {ev.mode}
                        </span>
                      }
                    />
                  ))
              }
            </Shell>

            <Shell title="Certificates" icon={<FileText size={14} style={{ color: 'var(--da-amber)' }} />}
              action="View all" actionTo="/certificates"
              accent="linear-gradient(90deg,var(--da-amber),#F59E0B)">
              {!dash?.recentCertificates?.length
                ? <EmptyState icon={null} title="No certificates yet" description="Complete events to earn certificates" />
                : dash.recentCertificates.slice(0, 5).map(cert => (
                    <Row key={cert._id} to="/certificates"
                      iconBg="rgba(217,119,6,0.1)"
                      iconEl={<Award size={15} style={{ color: 'var(--da-amber)' }} />}
                      title={cert.event?.title || 'Certificate'}
                      sub={`Issued ${timeAgo(cert.issuedAt)}`}
                      right={cert.downloadUrl && (
                        <a href={cert.downloadUrl} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()} className="dash-row__pill">
                          <Download size={10} />&nbsp;PDF
                        </a>
                      )}
                    />
                  ))
              }
            </Shell>

            {/* Badges — full width */}
            <div className="dash-grid--full">
              <Shell title="Badges Earned"
                icon={<Star size={14} style={{ color: 'var(--da-violet)' }} />}
                accent="linear-gradient(90deg,var(--da-violet),#A855F7)" noPad>
                {!user?.badges?.length
                  ? <EmptyState icon={<Award size={24} color="#8B5CF6"/>} title="No badges yet" description="Start participating to earn badges!" />
                  : <div className="dash-badges" style={{ display:'flex', flexWrap:'wrap', gap:10, padding:'16px 20px' }}>
                      {user.badges.map((b, i) => (
                        <DevBadge key={i} badge={b} size="md" />
                      ))}
                    </div>
                }
              </Shell>
            </div>
          </div>
        )}

        {tab === 'my events'    && <MyEventsTab />}
        {tab === 'achievements' && <AchievementsTab user={user} level={level} />}
      </div>
    </div>
  );
};

/*  My Events tab  */
const MyEventsTab = () => {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [type,    setType]    = useState('upcoming');

  useEffect(() => {
    setLoading(true);
    api.get(`/users/my-events?type=${type}`)
      .then(({ data }) => setEvents(data.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {['upcoming', 'past'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`dash-tab ${t === type ? 'dash-tab--active' : 'dash-tab--inactive'}`}>
            {t}
          </button>
        ))}
      </div>
      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        : events.length === 0
          ? <EmptyState icon={null}
              title={`No ${type} events`}
              description={type === 'upcoming' ? 'Register for events to see them here' : 'Past participation will appear here'} />
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
              {events.map(ev => <EventCard key={ev._id} event={ev} />)}
            </div>
      }
    </div>
  );
};

/*  Achievements tab  */
const AchievementsTab = ({ user, level }) => (
  <div className="ach-grid">
    <div className="ach-card">
      <h3 className="ach-card__title">
        <TrendingUp size={15} style={{ color: 'var(--da-blue)' }} /> Stats Overview
      </h3>
      {[
        ['Events Joined',   user?.stats?.eventsJoined || 0],
        ['Events Created',  user?.stats?.eventsCreated || 0],
        ['Teams Created',   user?.stats?.teamsCreated || 0],
        ['Hackathons Won',  user?.stats?.hackathonsWon || 0],
        ['Certificates',    user?.stats?.certificatesEarned || 0],
        ['Total XP',        user?.points || 0],
      ].map(([label, val], i, arr) => (
        <div key={label} className="ach-stat-row"
          style={{ borderBottom: i < arr.length - 1 ? undefined : 'none' }}>
          <span className="ach-stat-label">{label}</span>
          <span className="ach-stat-val">{Number(val).toLocaleString()}</span>
        </div>
      ))}
    </div>

    <div className="ach-card">
      <h3 className="ach-card__title">
        <Award size={15} style={{ color: 'var(--da-violet)' }} />
        Earned Badges ({user?.badges?.length || 0})
      </h3>
      {!user?.badges?.length
        ? <EmptyState icon={<Award size={24} color="#8B5CF6"/>} title="No badges yet" description="Start participating!" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, padding: '10px 0' }}>
            {user.badges.map((b, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 12, background: '#F8FAFC', borderRadius: 14, border: '1px solid rgba(91,110,245,0.12)' }}>
                <div style={{ width: 50, height: 50, clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)', background: 'linear-gradient(135deg, #5B6EF5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, filter: 'drop-shadow(0 3px 6px rgba(91,110,245,0.25))' }}>
                  <BadgeIcon name={b.name} icon={b.icon} size={20} color="#fff" />
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>{b.name}</p>
                <span style={{ fontSize: 10, color: '#64748B' }}>{timeAgo(b.awardedAt)}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  </div>
);

export default UserDashboard;
