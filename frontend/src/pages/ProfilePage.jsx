import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MapPin, Github, Linkedin, Twitter, ExternalLink, Edit,
  Share2, MoreHorizontal, CheckCircle, Calendar, Users,
  FileText, Award, Star, ChevronRight, TrendingUp,
  Code, Code2, Briefcase, Zap, GitBranch, Cpu, Trophy, MessageSquare, Globe
} from 'lucide-react';
import api from '../utils/api';
import { generateAvatar, getLevelInfo, formatDate } from '../utils/helpers';
import { Spinner, EmptyState, BadgeIcon, DevBadge } from '../components/common/index';
import EventCard from '../components/events/EventCard';
import toast from 'react-hot-toast';
import '../styles/profile.css';

/* ── Badge hex definitions ── */
const BADGE_DEFS = {
  'Code Starter':       { grad:'linear-gradient(135deg,#6366F1,#4F46E5)', icon:'</>',  level:1, lc:'#6366F1' },
  'Event Explorer':     { grad:'linear-gradient(135deg,#3B82F6,#1D4ED8)', icon:'badge',  level:2, lc:'#3B82F6' },
  'Builder':            { grad:'linear-gradient(135deg,#10B981,#059669)', icon:'</>',  level:2, lc:'#10B981' },
  'Team Player':        { grad:'linear-gradient(135deg,#F59E0B,#D97706)', icon:'badge',  level:3, lc:'#F59E0B' },
  'Top Performer':      { grad:'linear-gradient(135deg,#EF4444,#B91C1C)', icon:'badge',  level:4, lc:'#EF4444' },
  'Certified':          { grad:'linear-gradient(135deg,#8B5CF6,#7C3AED)', icon:'award',  level:3, lc:'#8B5CF6' },
  'Rising Dev':         { grad:'linear-gradient(135deg,#06B6D4,#0891B2)', icon:'badge',  level:2, lc:'#06B6D4' },
  'Streak Master':      { grad:'linear-gradient(135deg,#6366F1,#8B5CF6)', icon:'badge',  level:4, lc:'#6366F1' },
  'Challenge Accepted': { grad:'linear-gradient(135deg,#A855F7,#9333EA)', icon:'badge',  level:3, lc:'#A855F7' },
  'Legend':             { grad:'linear-gradient(135deg,#3B82F6,#6366F1)', icon:'badge',  level:5, lc:'#3B82F6' },
};
const LEVEL_COLORS = { 1:'#10B981', 2:'#3B82F6', 3:'#F59E0B', 4:'#EF4444', 5:'#8B5CF6' };

const HexBadge = ({ badge }) => {
  const def = BADGE_DEFS[badge?.name] || { grad:'linear-gradient(135deg,#5B6EF5,#7C3AED)', icon:'code', level:1, lc:'#5B6EF5' };
  return (
    <div className="prof-badge-item">
      <div className="prof-badge-hex" style={{ background: def.grad }}>
        <BadgeIcon name={badge?.name} size={24} color="#fff"/>
      </div>
      <p className="prof-badge-name">{badge?.name}</p>
      <span className="prof-badge-level" style={{ background:`${def.lc}15`, color:def.lc, border:`1px solid ${def.lc}30` }}>
        Level {def.level}
      </span>
    </div>
  );
};

/* Activity heatmap */
const ActivityHeatmap = ({ data = [] }) => {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Mon','','Wed','','Fri'];
  const weeks = 26;
  const cells = Array.from({ length: weeks * 7 }, (_, i) => ({
    count: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
  }));
  const getColor = n => {
    if (n === 0) return '#F3F4F6';
    if (n === 1) return '#C7D2FE';
    if (n === 2) return '#A5B4FC';
    if (n === 3) return '#818CF8';
    return '#5B6EF5';
  };
  return (
    <div className="prof-heatmap">
      <div className="prof-heatmap__grid">
        <div className="prof-heatmap__day-labels">
          {DAYS.map((d,i) => <span key={i} className="prof-heatmap__day-label">{d}</span>)}
        </div>
        <div className="prof-heatmap__weeks">
          {Array.from({ length: weeks }).map((_, wi) => (
            <div key={wi} className="prof-heatmap__week">
              {Array.from({ length: 7 }).map((_, di) => {
                const c = cells[wi*7+di];
                return <div key={di} className="prof-heatmap__cell" style={{ background: getColor(c.count) }} title={`${c.count} contributions`}/>;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="prof-heatmap__legend">
        <span>Less</span>
        <div className="prof-heatmap__legend-cells">
          {['#F3F4F6','#C7D2FE','#A5B4FC','#818CF8','#5B6EF5'].map((c,i) => (
            <div key={i} style={{ width:12, height:12, borderRadius:2, background:c }}/>
          ))}
        </div>
        <span>More</span>
        <span style={{ marginLeft:'auto', color:'var(--da-ink-50)', fontWeight:600 }}> Longest streak: 42 days</span>
      </div>
    </div>
  );
};

/* Top skills */
const TopSkills = ({ skills = [] }) => {
  const defaults = [
    { name:'JavaScript', pct:90 },{ name:'TypeScript', pct:85 },
    { name:'React', pct:88 }, { name:'Node.js', pct:80 }, { name:'MongoDB', pct:75 },
  ];
  const list = skills.length ? skills : defaults;
  return (
    <div>
      {list.slice(0,6).map((s,i) => (
        <div key={i} className="prof-skill-bar-row">
          <span className="prof-skill-bar-label">{s.name || s}</span>
          <div className="prof-skill-bar-bg">
            <div className="prof-skill-bar-fill" style={{ width:`${s.pct||70}%` }}/>
          </div>
          <span className="prof-skill-bar-pct">{s.pct||70}%</span>
        </div>
      ))}
      <a href="#" style={{ fontSize:13, fontWeight:600, color:'var(--da-blue)', display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
        View all <ChevronRight size={12}/>
      </a>
    </div>
  );
};

/* Experience item */
const ExpItem = ({ role, company, dates, desc, letter, color }) => (
  <div className="prof-exp-item">
    <div className="prof-exp-logo" style={{ background:`${color}15`, color, borderColor:`${color}25` }}>{letter}</div>
    <div className="prof-exp-main">
      <span className="prof-exp-dates">{dates}</span>
      <p className="prof-exp-role">{role}</p>
      <p className="prof-exp-company">{company}</p>
      <p className="prof-exp-desc">{desc}</p>
    </div>
  </div>
);

/* Project card */
const ProjectCard = ({ name, desc, tags, stars, forks, color, iconType }) => {
  const iconMap = { code: <Code2 size={16} color={color}/>, leaf: <GitBranch size={16} color={color}/>, bot: <Cpu size={16} color={color}/> };
  return (
  <div className="prof-project-card">
    <div className="prof-project-icon" style={{ background:`${color}15` }}>{iconMap[iconType] || <Code2 size={16} color={color}/>}</div>
    <p className="prof-project-name">{name}</p>
    <p className="prof-project-desc">{desc}</p>
    <div className="prof-project-tags">
      {tags.map((t,i) => <span key={i} className="prof-project-tag">{t}</span>)}
    </div>
    <div className="prof-project-meta">
      <span style={{display:'flex',alignItems:'center',gap:3}}><svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{stars}</span>
      <span style={{display:'flex',alignItems:'center',gap:3}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>{forks}</span>
    </div>
  </div>
  );
};

/* ── Main Component ── */
const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useSelector(s => s.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('Overview');
  const [events, setEvents]   = useState([]);

  const isOwn = !id || id === me?._id;
  const u = profile || me;

  useEffect(() => {
    const fetch = async () => {
      try {
        if (id && id !== me?._id) {
          const { data } = await api.get(`/users/${id}`);
          setProfile(data.user);
          try {
            const ev = await api.get(`/users/${id}/events`);
            setEvents(ev.data.events || []);
          } catch {
            setEvents([]);
          }
        } else {
          const ev = await api.get('/users/my-events?type=all');
          setEvents(ev.data.events || []);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [id, me?._id]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'70vh' }}>
      <Spinner size={28}/>
    </div>
  );

  if (!u) return <div style={{ padding:'100px 24px', textAlign:'center', color:'var(--da-ink-50)' }}>User not found</div>;

  const { initials, color } = generateAvatar(u.name || '');
  const level = getLevelInfo(u.points || 0);
  const badges = u.badges || [];

  const locationText = typeof u.location === 'object' && u.location !== null
    ? [u.location.city, u.location.state, u.location.country].filter(Boolean).join(', ')
    : (typeof u.location === 'string' && u.location) || 'Bengaluru, Karnataka, India';

  const STAT_CARDS = [
    { label:'Level', icon:<Zap size={12} color={color}/>, val:`Lv. ${level.level}`, sub:level.title, bar: level.progress, color: '#5B6EF5' },
    { label:'Rank', icon:<TrendingUp size={12} color="#10B981"/>, val:`#${u.rank||24}`, sub:`Top ${u.rankPct||'1'}%`, color:'#10B981' },
    { label:'Dev Points', icon:<Star size={12} color="#F59E0B"/>, val:(u.points||12540).toLocaleString(), sub:`+450 this month`, color:'#F59E0B' },
    { label:'Badges', icon:<Award size={12} color="#8B5CF6"/>, val:badges.length||28, sub:<a href="#" style={{color:'var(--da-blue)',fontWeight:600,fontSize:11}}>View all</a>, color:'#8B5CF6' },
  ];

  const TABS = ['Overview','Events','Projects','Achievements','Certificates','Activity'];

  return (
    <div className="prof-root">
      <div className="prof-banner">
        <div className="prof-banner__inner">
          <div className="prof-identity">
            {/* Avatar + info */}
            <div className="prof-user-meta">
              <div className="prof-av-wrap">
                {u.avatar
                  ? <img src={u.avatar} alt="" className="prof-av"/>
                  : <div className="prof-av" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>{initials}</div>
                }
                <div className="prof-verified" title="Verified Member"><CheckCircle size={12} color="#fff"/></div>
              </div>
              <div className="prof-info">
                <h1 className="prof-name">{u.name}</h1>
                <p className="prof-headline">Full Stack Developer <span>•</span> {u.bio?.split('.')[0] || 'Open Source Enthusiast'}</p>
                <p className="prof-location"><MapPin size={13}/> {locationText}</p>
                <div className="prof-social-links">
                  {[
                    { icon:<Github size={13}/>, href:'#' },
                    { icon:<Linkedin size={13}/>, href:'#' },
                    { icon:<Twitter size={13}/>, href:'#' },
                    { icon:<Globe size={13}/>, href:'#' },
                    { icon:<ExternalLink size={13}/>, href:'#', label:'aditi.dev' },
                  ].map((s,i) => (
                    <a key={i} href={s.href} className="prof-social-link">
                      <div className="prof-social-icon">{s.icon}</div>
                      {s.label && <span>{s.label}</span>}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right block: actions + stat cards */}
            <div className="prof-identity-right">
              {isOwn ? (
                <div className="prof-actions-bar">
                  <button className="prof-action-btn prof-action-btn--edit"><Edit size={13}/> Edit Profile</button>
                  <button className="prof-action-btn prof-action-btn--share"><Share2 size={13}/> Share Profile</button>
                  <button className="prof-action-btn prof-action-btn--more"><MoreHorizontal size={15}/></button>
                </div>
              ) : (
                <div className="prof-actions-bar">
                  <button
                    className="prof-action-btn prof-action-btn--edit"
                    style={{ background: 'var(--da-blue)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={async () => {
                      try {
                        const { data } = await api.post(`/chat/direct/${u._id}`);
                        if (data.chat?._id) navigate(`/chat/${data.chat._id}`);
                      } catch (err) {
                        toast.error('Could not open conversation');
                      }
                    }}
                  >
                    <MessageSquare size={13}/> Send Message
                  </button>
                  <button className="prof-action-btn prof-action-btn--share"><Share2 size={13}/> Share Profile</button>
                </div>
              )}

              {/* Stat cards */}
              <div className="prof-stat-cards">
                {STAT_CARDS.map((s,i) => (
                  <div key={i} className="prof-stat-card">
                    <p className="prof-stat-card__label">
                      <span style={{ width:16, height:16, borderRadius:4, background:`${s.color}15`, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</span>
                      {s.label}
                    </p>
                    <p className="prof-stat-card__val" style={{ color:s.color }}>{s.val}</p>
                    <p className="prof-stat-card__sub">{s.sub}</p>
                    {s.bar !== undefined && (
                      <div className="prof-stat-card__bar">
                        <div className="prof-stat-card__bar-fill" style={{ width:`${s.bar}%`, background:s.color }}/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="prof-tabs-bar">
            {TABS.map(t => (
              <button key={t} className={`prof-tab${tab===t?' prof-tab--active':''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="prof-body">
        {tab === 'Overview' && <OverviewTab u={u} events={events} badges={badges}/>}
        {tab === 'Events' && (
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
              {events.length ? events.map(ev => <EventCard key={ev._id} event={ev}/>) : <EmptyState icon={<Calendar size={24} color="#5B6EF5"/>} title="No events yet" description="Events joined or organized will appear here."/>}
            </div>
          </div>
        )}
        {tab === 'Achievements' && <AchievementsTab badges={badges} u={u}/>}
        {tab === 'Projects' && <ProjectsTab u={u}/>}
        {tab === 'Certificates' && <CertificatesTab u={u}/>}
        {tab === 'Activity' && <ActivityTab u={u}/>}
      </div>
    </div>
  );
};

/* Overview tab */
const OverviewTab = ({ u, events, badges }) => {
  const skills = u.skills || ['JavaScript','TypeScript','React','Node.js','MongoDB'];

  return (
    <>
      <div className="prof-main">
        {/* About */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">About Me</h3>
          </div>
          <div className="prof-section__body">
            <p className="prof-bio-text">
              {u.bio || 'Passionate about building scalable web applications and solving real-world problems. I love collaborating on open source and participating in hackathons to learn and grow.'}
            </p>
            <div className="prof-skills">
              {skills.slice(0,8).map((s,i) => <span key={i} className="prof-skill-tag">{typeof s==='string'?s:s.name}</span>)}
              {skills.length > 8 && <span className="prof-skill-tag" style={{color:'var(--da-blue)'}}>+{skills.length-8} more</span>}
            </div>
            <div className="prof-mini-stats">
              {[
                { icon:<Calendar size={13}/>, label:'Experience', val:'2+ Years' },
                { icon:<Zap size={13}/>, label:'Events Joined', val:u.stats?.eventsJoined||32 },
                { icon:<Code size={13}/>, label:'Projects Built', val:u.stats?.projectsBuilt||18 },
                { icon:<Award size={13}/>, label:'Hackathon Wins', val:u.stats?.hackathonsWon||5 },
              ].map((s,i) => (
                <div key={i} className="prof-mini-stat">
                  <span style={{color:'var(--da-blue)'}}>{s.icon}</span>
                  <strong>{s.val}</strong> <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">Experience</h3>
            <a href="#" className="prof-section__link">View full experience <ChevronRight size={12}/></a>
          </div>
          <div className="prof-section__body">
            <ExpItem role="Full Stack Developer Intern" company="MagnaLabs" dates="Jun 2024 – Present" letter="M" color="#5B6EF5"
              desc="Working on building internal dashboards and developer tools using Next.js, Node.js and MongoDB."/>
            <ExpItem role="Open Source Contributor" company="CodeWave Community" dates="Jan 2023 – May 2024" letter="C" color="#10B981"
              desc="Contributed to 10+ open source projects and collaborated with amazing developers."/>
            <ExpItem role="Frontend Developer Intern" company="DigiStack" dates="May 2022 – Dec 2022" letter="D" color="#EC4899"
              desc="Built responsive web apps and collaborated with the design team to ship pixel-perfect UI."/>
          </div>
        </div>

        {/* Projects */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">Recent Projects</h3>
            <a href="#" className="prof-section__link">View all projects <ChevronRight size={12}/></a>
          </div>
          <div className="prof-section__body">
            <div className="prof-projects-grid">
              <ProjectCard name="DevConnect" iconType="code" desc="Developer networking platform for collaboration and growth."
                tags={['Next.js','Tailwind','MongoDB']} stars={128} forks={24} color="#5B6EF5"/>
              <ProjectCard name="TaskFlow" iconType="leaf" desc="An open source task manager for dev teams."
                tags={['React','Node.js','PostgreSQL']} stars={96} forks={18} color="#10B981"/>
              <ProjectCard name="AI Code Helper" iconType="leaf" desc="VS Code extension to get AI suggestions for your code."
                tags={['TypeScript','AI','VS Code API']} stars={76} forks={12} color="#F59E0B"/>
            </div>
          </div>
        </div>
      </div>

      <div className="prof-aside">
        {/* Badges */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">Badges</h3>
            <a href="#" className="prof-section__link">View all <ChevronRight size={12}/></a>
          </div>
          <div className="prof-section__body">
            <div className="prof-badges-grid">
              {(badges.length ? badges.slice(0,5) : [
                {name:'Top Performer'},{name:'Builder'},{name:'Streak Master'},{name:'Event Explorer'},{name:'Rising Dev'}
              ]).map((b,i) => <HexBadge key={i} badge={b}/>)}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">Achievements</h3>
            <a href="#" className="prof-section__link">View all <ChevronRight size={12}/></a>
          </div>
          <div className="prof-section__body">
            {[
              { icon:<Trophy size={16} color="#F59E0B"/>, text:'Won 1st place at HackIndia 2024', date:'Mar 16, 2024' },
              { icon:<Award  size={16} color="#5B6EF5"/>, text:'Top 5 at CodeRush Hackathon',    date:'Oct 22, 2023' },
              { icon:<Zap    size={16} color="#10B981"/>, text:'Maintained 30-day coding streak', date:'Aug 15, 2023' },
              { icon:<TrendingUp size={16} color="#7C3AED"/>, text:'Reached Level 10',           date:'Jul 10, 2023' },
            ].map((a,i) => (
              <div key={i} className="prof-ach-item">
                <span className="prof-ach-icon">{a.icon}</span>
                <span className="prof-ach-text">{a.text}</span>
                <span className="prof-ach-date">{a.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">Activity Heatmap</h3>
            <select style={{ fontSize:12, border:'1px solid var(--da-border)', borderRadius:6, padding:'2px 8px', color:'var(--da-ink-70)', background:'#fff' }}>
              <option>2025</option><option>2024</option>
            </select>
          </div>
          <div className="prof-section__body">
            <ActivityHeatmap/>
          </div>
        </div>

        {/* Top skills */}
        <div className="prof-section">
          <div className="prof-section__header">
            <h3 className="prof-section__title">Top Skills</h3>
            <a href="#" className="prof-section__link">View all <ChevronRight size={12}/></a>
          </div>
          <div className="prof-section__body">
            <TopSkills skills={u.skills}/>
          </div>
        </div>
      </div>
    </>
  );
};


const AchievementsTab = ({ badges, u }) => {
  const ALL = Object.entries(BADGE_DEFS).map(([name, def]) => ({
    name, ...def, earned: badges?.some(b => b.name === name) || false,
  }));
  return (
    <div style={{ gridColumn:'1/-1' }}>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--da-blue)' }}>ACHIEVEMENT BADGES</span>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-0.03em', color:'var(--da-ink-90)', marginTop:8, marginBottom:6 }}>
          Earn. Showcase. <span style={{ color:'var(--da-blue)' }}>Stand Out.</span>
        </h2>
        <p style={{ fontSize:15, color:'var(--da-ink-50)' }}>Complete events, build, and grow to unlock exclusive badges.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
        {ALL.map((b,i) => (
          <div key={i} style={{
            background:'#fff', border:`1px solid ${b.earned?'rgba(91,110,245,0.20)':'var(--da-border)'}`,
            borderRadius:20, padding:24, textAlign:'center', opacity: b.earned?1:0.5,
            boxShadow: b.earned ? '0 2px 12px rgba(91,110,245,0.10)' : 'none',
            transition:'all 0.2s',
          }}>
            <div style={{ width:72, height:72, margin:'0 auto 14px', clipPath:'polygon(50% 0%,93.3% 25%,93.3% 75%,50% 100%,6.7% 75%,6.7% 25%)', background: b.earned ? b.grad : '#E5E7EB', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BadgeIcon name={b.name} size={26} color="#fff"/>
            </div>
            <p style={{ fontSize:14, fontWeight:700, color:'var(--da-ink-90)', marginBottom:4 }}>{b.name}</p>
            <p style={{ fontSize:12, color:'var(--da-ink-50)', marginBottom:10 }}>
              {b.name==='Code Starter'?'Joined your first event on DevArena.':b.name==='Event Explorer'?'Participated in 5 events.':b.name==='Builder'?'Submitted your first project.':b.name==='Team Player'?'Joined a team and collaborated.':b.name==='Top Performer'?'Ranked in the top 10%.':b.name==='Certified'?'Earned a certificate on DevArena.':b.name==='Rising Dev'?'Earned 100+ points on the platform.':b.name==='Streak Master'?'Maintained a 7-day activity streak.':b.name==='Challenge Accepted'?'Completed 3 challenges.':'Won an event. You\'re unstoppable!'}
            </p>
            <span style={{ fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:999, background: b.earned?`${b.lc}15`:'var(--da-ink-10)', color: b.earned?b.lc:'var(--da-ink-40)', border:`1px solid ${b.earned?b.lc+'30':'var(--da-border)'}` }}>
              LEVEL {b.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Projects Tab */
const ProjectsTab = ({ u }) => {
  const projects = u.projects?.length ? u.projects : [
    { title: 'DeFi Automated Vault', desc: 'Cross-chain automated market maker and yield aggregator built on Ethereum and Polygon with Foundry.', tags: ['Solidity', 'Foundry', 'React', 'Ethers.js'], stars: 24, forks: 8 },
    { title: 'DevArena Realtime Engine', desc: 'Full-stack collaborative hackathon platform with WebSockets, presence tracking, and dynamic leaderboard.', tags: ['Node.js', 'Socket.io', 'MongoDB', 'Redis'], stars: 42, forks: 15 },
    { title: 'AI Code Reviewer Bot', desc: 'Automated GitHub action that analyses pull requests for security vulnerabilities and test coverage.', tags: ['Python', 'FastAPI', 'LangChain', 'Docker'], stars: 31, forks: 6 },
  ];
  return (
    <div style={{ gridColumn: '1/-1' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {projects.map((p, i) => (
          <div key={i} className="prof-project-card" style={{ padding: 22, background: '#fff', borderRadius: 16, border: '1px solid rgba(91,110,245,0.14)', boxShadow: '0 4px 16px rgba(91,110,245,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(91,110,245,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B6EF5' }}>
                <Code2 size={20} />
              </div>
              <div style={{ display: 'flex', gap: 12, color: '#6B7280', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={13} color="#F59E0B" /> {p.stars}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GitBranch size={13} /> {p.forks}</span>
              </div>
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{p.title}</h4>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, margin: '0 0 14px' }}>{p.desc}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {p.tags.map((t, ti) => (
                <span key={ti} style={{ padding: '3px 9px', borderRadius: 9999, background: 'rgba(91,110,245,0.08)', color: '#4F46E5', fontSize: 11, fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Certificates Tab */
const CertificatesTab = ({ u }) => {
  const certs = u.recentCertificates || [];
  return (
    <div style={{ gridColumn: '1/-1' }}>
      {!certs.length ? (
        <EmptyState icon={<Award size={28} color="#8B5CF6"/>} title="No certificates issued yet" description="Complete events or win competitions on DevArena to earn official verified certificates."/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {certs.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(91,110,245,0.15)', padding: 22, boxShadow: '0 4px 16px rgba(91,110,245,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <Award size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{c.event?.title || 'Certificate of Achievement'}</h4>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>ID: {c.certificateId || 'DA-CERT-VERIFIED'}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 14 }}>Issued on {new Date(c.issuedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <Link to={`/verify-certificate/${c.certificateId || ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9999, background: '#5B6EF5', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                View &amp; Verify Certificate
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* Activity Tab */
const ActivityTab = ({ u }) => {
  return (
    <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="prof-section">
        <div className="prof-section__header">
          <h3 className="prof-section__title">Activity &amp; Contribution Heatmap</h3>
          <span style={{ fontSize: 12, color: '#6B7280' }}>Past 6 months</span>
        </div>
        <div className="prof-section__body">
          <ActivityHeatmap data={u.activity || []} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
