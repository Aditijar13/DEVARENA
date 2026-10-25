import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar, MapPin, Users, Clock, Share2, Bookmark, BookmarkCheck,
  ArrowLeft, ChevronDown, ChevronUp, Globe, Tag, FileText,
  CheckCircle, AlertCircle, MessageSquare, Send, Shield, Zap,
  Trophy, Star, HelpCircle,
} from 'lucide-react';
import { fetchEvent, registerForEvent, toggleBookmark } from '../store/slices/eventSlice';
import { toggleBookmarkInStore } from '../store/slices/authSlice';
import { Spinner, Modal, EmptyState, PrizeBadge, DevBadge, BadgeIcon } from '../components/common/index';
import {
  formatDate, formatDateTime, daysUntil,
  getCategoryColor, getEventStatus, timeAgo, shareEvent,
} from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../styles/eventdetails.css';

/*  helpers  */
const gradients = [
  'linear-gradient(135deg,#F59E0B,#F97316)',
  'linear-gradient(135deg,#94A3B8,#64748B)',
  'linear-gradient(135deg,#B45309,#92400E)',
  'linear-gradient(135deg,#5B6EF5,#A78BFA)',
  'linear-gradient(135deg,#10B981,#059669)',
];

const INFO_ICON_BG = [
  'rgba(91,110,245,0.10)',
  'rgba(167,139,250,0.10)',
  'rgba(16,185,129,0.10)',
  'rgba(245,158,11,0.10)',
  'rgba(239,68,68,0.10)',
  'rgba(6,182,212,0.10)',
];
const INFO_ICON_COLOR = [
  'var(--da-blue)','var(--da-violet)','var(--da-emerald)',
  'var(--da-amber)','var(--da-red)','#06B6D4',
];

/*  */
const EventDetails = () => {
  const { slug }     = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const { currentEvent: event, loadingEvent } = useSelector(s => s.events);
  const { user, isAuthenticated } = useSelector(s => s.auth);

  const [activeTab,    setActiveTab]    = useState('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [comments,     setComments]     = useState([]);
  const [newComment,   setNewComment]   = useState('');
  const [commentType,  setCommentType]  = useState('comment');
  const [registering,  setRegistering]  = useState(false);
  const [userReg,      setUserReg]      = useState(null);
  const [expandedFaq,  setExpandedFaq]  = useState(null);

  useEffect(() => {
    dispatch(fetchEvent(slug));
    window.scrollTo(0, 0);
  }, [slug, dispatch]);

  useEffect(() => {
    if (event) {
      fetchComments();
      const reg = event.registrations?.find(
        r => r.user?._id === user?._id || r.user === user?._id
      );
      setUserReg(reg);
    }
  }, [event, user]);

  const fetchComments = React.useCallback(async () => {
    if (!event) return;
    try {
      const { data } = await api.get(`/events/${event._id}/comments`);
      setComments(data.comments || []);
    } catch {}
  }, [event]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Paid event — initiate Razorpay
    if (event.isPaid && event.price > 0) {
      setRegistering(true);
      try {
        const { data } = await api.post('/payments/create-order', { eventId: event._id });
        if (!data.success) throw new Error(data.message);

        // If in sandbox/demo mode, complete verification immediately
        if (data.isSandbox) {
          await api.post('/payments/verify', {
            razorpay_order_id:   data.orderId,
            razorpay_payment_id: `pay_sandbox_${Date.now()}`,
            razorpay_signature:  'sandbox_verified',
            eventId:             event._id,
            isSandbox:           true,
          });
          setShowRegModal(false);
          dispatch(fetchEvent(slug));
          toast.success('Test payment verified — you are registered!');
          setRegistering(false);
          return;
        }

        const options = {
          key:         data.keyId,
          amount:      data.amount,
          currency:    data.currency,
          name:        'DevArena',
          description: data.eventTitle,
          order_id:    data.orderId,
          handler: async (response) => {
            try {
              await api.post('/payments/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                eventId:             event._id,
              });
              setShowRegModal(false);
              dispatch(fetchEvent(slug));
              toast.success('Payment successful — you are registered!');
            } catch (err) {
              toast.error(err?.response?.data?.message || 'Payment verification failed');
            }
          },
          prefill:  { name: user?.name, email: user?.email },
          theme:    { color: '#5B6EF5' },
          modal:    { ondismiss: () => setRegistering(false) },
        };

        if (typeof window.Razorpay === 'undefined') {
          // Load Razorpay script dynamically
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            s.onload = resolve;
            s.onerror = reject;
            document.body.appendChild(s);
          });
        }
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Could not initiate payment');
        setRegistering(false);
      }
      return;
    }

    // Free event
    setRegistering(true);
    try {
      await dispatch(registerForEvent({ eventId: event._id })).unwrap();
      setShowRegModal(false);
      dispatch(fetchEvent(slug));
      toast.success('Registered successfully!');
    } catch (err) {
      toast.error(err?.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  const handleBookmark = () => {
    if (!isAuthenticated) return;
    dispatch(toggleBookmark(event._id));
    dispatch(toggleBookmarkInStore(event._id));
  };

  const handleShare = async () => {
    const msg = await shareEvent(event);
    if (msg) toast.success(msg);
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;
    try {
      await api.post(`/events/${event._id}/comments`, { content: newComment, type: commentType });
      setNewComment('');
      fetchComments();
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    }
  };

  /* Loading */
  if (loadingEvent) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh' }}>
      <Spinner size={36} />
    </div>
  );

  /* Not found */
  if (!event) return (
    <div style={{ textAlign:'center', padding:'80px 24px' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
        <Calendar size={48} color="#9CA3AF" strokeWidth={1.5} />
      </div>
      <h2 style={{ fontSize:24, fontWeight:800, marginBottom:12, color:'#111827' }}>
        Event not found
      </h2>
      <Link to="/explore" style={{ color:'var(--da-blue)', fontWeight:600, textDecoration:'none' }}>
        ← Back to Explore
      </Link>
    </div>
  );

  const status        = getEventStatus(event);
  const isBookmarked  = user?.bookmarkedEvents?.includes(event._id) || event.isBookmarked;
  const catColor      = getCategoryColor(event.category);
  const deadlineDays  = daysUntil(event.registrationDeadline);
  const isOpen        = event.isRegistrationOpen;
  const capPct        = event.maxParticipants > 0
    ? Math.min(Math.round((event.registeredCount / event.maxParticipants) * 100), 100) : 0;

  const TABS = ['overview', 'prizes', 'schedule', 'teams', 'discussion'];

  /*  Status pill style  */
  const pillStyle = {
    success: { cls: 'ed-hero__pill--green',  label: status.label },
    primary: { cls: 'ed-hero__pill--blue',   label: status.label },
    warning: { cls: 'ed-hero__pill--amber',  label: status.label },
    danger:  { cls: 'ed-hero__pill ed-hero__pill--red', label: status.label },
    muted:   { cls: '',                       label: status.label },
  }[status.color] || { cls:'', label: status.label };

  /*  Info rows for sidebar  */
  const infoRows = [
    { icon: <Calendar size={14}/>, label:'Start Date',    val: formatDateTime(event.startDate), bgIdx:0 },
    { icon: <Calendar size={14}/>, label:'End Date',      val: formatDateTime(event.endDate),   bgIdx:1 },
    { icon: <Clock    size={14}/>, label:'Reg. Deadline', val: formatDateTime(event.registrationDeadline), bgIdx:3 },
    { icon: <Globe    size={14}/>, label:'Mode',          val: event.mode?.charAt(0).toUpperCase()+event.mode?.slice(1), bgIdx:2 },
    { icon: <MapPin   size={14}/>, label:'Location',
      val: event.mode==='online' ? 'Online' : [event.location?.venue, event.location?.city].filter(Boolean).join(', ') || 'TBA',
      bgIdx:0 },
    ...(event.isTeamEvent ? [{ icon:<Users size={14}/>, label:'Team Size',
      val:`${event.minTeamSize}–${event.maxTeamSize} members`, bgIdx:2 }] : []),
  ];

  return (
    <div className="ed-root">

      {/*  HERO  */}
      <div className="ed-hero">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="ed-hero__img" />
        ) : (
          <div
            className="ed-hero__fallback"
            style={{ background:`linear-gradient(145deg,${catColor}22,${catColor}08,rgba(167,139,250,0.08))` }}
          >
            <span style={{ fontSize:72, color:catColor, opacity:0.25, fontWeight:900, letterSpacing:'-0.04em' }}>
              {event.category?.toUpperCase().slice(0,4)}
            </span>
          </div>
        )}
        <div className="ed-hero__scrim" />

        {/* Back */}
        <button className="ed-hero__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={14}/> Back
        </button>

        {/* Actions */}
        <div className="ed-hero__actions">
          <button className="ed-hero__action-btn" onClick={handleShare} title="Share">
            <Share2 size={16}/>
          </button>
          {isAuthenticated && (
            <button
              className={`ed-hero__action-btn${isBookmarked ? ' ed-hero__action-btn--saved' : ''}`}
              onClick={handleBookmark} title="Bookmark"
            >
              {isBookmarked ? <BookmarkCheck size={16}/> : <Bookmark size={16}/>}
            </button>
          )}
        </div>

        {/* Hero text */}
        <div className="ed-hero__content">
          <div className="ed-hero__pills">
            <span className={`ed-hero__pill ${pillStyle.cls}`}>{pillStyle.label}</span>
            <span className="ed-hero__pill">{event.category}</span>
            <span className="ed-hero__pill">{event.mode}</span>
            {event.isPaid
              ? <span className="ed-hero__pill ed-hero__pill--amber">₹{event.price?.toLocaleString()}</span>
              : <span className="ed-hero__pill ed-hero__pill--green">FREE</span>}
            {event.isFeatured && <span className="ed-hero__pill ed-hero__pill--violet"> Featured</span>}
          </div>

          <h1 className="ed-hero__title">{event.title}</h1>

          <div className="ed-hero__organizer-row">
            {event.organizer && (
              <Link to={`/user/${event.organizer._id}`} className="ed-hero__org-link">
                {event.organizer.avatar
                  ? <img src={event.organizer.avatar} alt="" className="ed-hero__org-av"/>
                  : <div className="ed-hero__org-av ed-hero__org-av--fallback" style={{ width:32, height:32, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))' }}>
                      {event.organizer.name?.[0]}
                    </div>
                }
                <span className="ed-hero__org-name">{event.organizer.name}</span>
              </Link>
            )}
            <span className="ed-hero__stat">
              <Users size={12}/> {(event.registeredCount||0).toLocaleString()} registered
              {event.maxParticipants>0 && ` / ${event.maxParticipants}`}
            </span>
            <span className="ed-hero__stat">
              <Star size={12}/> {event.views||0} views
            </span>
          </div>
        </div>
      </div>

      {/*  BODY  */}
      <div className="ed-body">

        {/*  LEFT: tabs + content  */}
        <div>
          {/* Tab bar */}
          <div className="ed-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`ed-tab ed-tab--${activeTab===tab ? 'active' : 'idle'}`}
              >
                {{ overview:'Overview', prizes:'Prizes', schedule:'Schedule',
                   teams:'Teams', discussion:'Discussion' }[tab]}
              </button>
            ))}
          </div>

          {/*  OVERVIEW  */}
          {activeTab==='overview' && (
            <div>
              {/* About */}
              <div className="ed-panel">
                <div className="ed-panel__title">
                  <span className="ed-panel__title-icon"><FileText size={14} color="var(--da-blue)"/></span>
                  About This Event
                </div>
                <p className="ed-description">{event.description}</p>
              </div>

              {/* Requirements */}
              {event.requirements?.length > 0 && (
                <div className="ed-panel">
                  <div className="ed-panel__title">
                    <span className="ed-panel__title-icon"><CheckCircle size={14} color="var(--da-emerald)"/></span>
                    Requirements
                  </div>
                  <div className="ed-req-list">
                    {event.requirements.map((req,i) => (
                      <div key={i} className="ed-req-item">
                        <span className="ed-req-check">
                          <CheckCircle size={12} color="var(--da-emerald)"/>
                        </span>
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {event.skills?.length > 0 && (
                <div className="ed-panel">
                  <div className="ed-panel__title">
                    <span className="ed-panel__title-icon"><Zap size={14} color="var(--da-amber)"/></span>
                    Relevant Skills
                  </div>
                  <div className="ed-skills">
                    {event.skills.map((s,i)=>(
                      <span key={i} className="ed-skill">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags?.length > 0 && (
                <div className="ed-panel">
                  <div className="ed-panel__title">
                    <span className="ed-panel__title-icon"><Tag size={14} color="var(--da-violet)"/></span>
                    Tags
                  </div>
                  <div className="ed-tags">
                    {event.tags.map((tag,i)=>(
                      <Link key={i} to={`/explore?tags=${tag}`} className="ed-tag">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Judges */}
              {event.judges?.length > 0 && (
                <div className="ed-panel">
                  <div className="ed-panel__title">
                    <span className="ed-panel__title-icon"><Shield size={14} color="var(--da-blue)"/></span>
                    Judges
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                    {event.judges.map((judge,i) => (
                      <div key={i} style={{ display:'flex', gap:12, padding:'16px', background:'var(--da-ink-02)', borderRadius:'var(--r-lg)', border:'1.5px solid var(--da-border)' }}>
                        <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                          {judge.avatar
                            ? <img src={judge.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : judge.name?.[0]}
                        </div>
                        <div>
                          <p style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:2 }}>{judge.name}</p>
                          <p style={{ fontSize:12, color:'#9CA3AF' }}>{judge.designation}</p>
                          <p style={{ fontSize:11, color:'var(--da-blue)', fontWeight:600 }}>{judge.company}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsors */}
              {event.sponsors?.length > 0 && (
                <div className="ed-panel">
                  <div className="ed-panel__title">
                    <span className="ed-panel__title-icon"><Star size={14} color="var(--da-amber)"/></span>
                    Sponsors
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                    {event.sponsors.map((sp,i) => (
                      <div key={i} style={{ padding:'12px 20px', background:'var(--da-ink-02)', borderRadius:'var(--r-lg)', border:'1.5px solid var(--da-border)' }}>
                        <p style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{sp.name}</p>
                        <p style={{ fontSize:11, fontWeight:700, color:'var(--da-amber)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 }}>{sp.tier}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {event.faqs?.length > 0 && (
                <div className="ed-panel">
                  <div className="ed-panel__title">
                    <span className="ed-panel__title-icon"><MessageSquare size={14} color="var(--da-violet)"/></span>
                    FAQ
                  </div>
                  <div className="ed-faq">
                    {event.faqs.map((faq,i) => (
                      <div key={i} className="ed-faq-item">
                        <button
                          className="ed-faq-q"
                          onClick={() => setExpandedFaq(expandedFaq===i ? null : i)}
                        >
                          {faq.question}
                          {expandedFaq===i
                            ? <ChevronUp   size={16} className="ed-faq-chevron ed-faq-chevron--open"/>
                            : <ChevronDown size={16} className="ed-faq-chevron"/>}
                        </button>
                        {expandedFaq===i && (
                          <p className="ed-faq-a">{faq.answer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/*  PRIZES  */}
          {activeTab==='prizes' && (
            <div>
              {!event.prizes?.length ? (
                <EmptyState icon={<Trophy size={26} color="#F59E0B"/>} title="Prize details coming soon" description="The organizer will update prizes soon."/>
              ) : (
                <>
                  <div className="ed-prizes-grid">
                    {event.prizes.map((prize,i) => (
                      <div key={i} className="ed-prize-card">
                        <div
                          className="ed-prize-card__bar"
                          style={{ background: gradients[i] || gradients[3] }}
                        />
                        <PrizeBadge index={i} position={prize.position} />
                        <p className="ed-prize-pos">{prize.position}</p>
                        {prize.amount > 0 ? (
                          <p
                            className="ed-prize-amount"
                            style={{ backgroundImage: gradients[i]||gradients[3] }}
                          >
                            ₹{prize.amount.toLocaleString()}
                          </p>
                        ) : prize.pointsReward > 0 ? (
                          <p
                            className="ed-prize-amount"
                            style={{ backgroundImage: gradients[i]||gradients[3] }}
                          >
                            +{prize.pointsReward} pts
                          </p>
                        ) : (
                          <p
                            className="ed-prize-amount"
                            style={{ backgroundImage: gradients[i]||gradients[3], fontSize: 18, marginTop: 4, marginBottom: 8 }}
                          >
                            {prize.description || 'DevArena Badge'}
                          </p>
                        )}
                        {prize.amount > 0 && prize.description && (
                          <p className="ed-prize-desc">{prize.description}</p>
                        )}
                        {prize.perks?.length > 0 && (
                          <div className="ed-prize-perks">
                            {prize.perks.map((perk,j) => (
                              <span key={j} className="ed-prize-perk">
                                <CheckCircle size={12} color="var(--da-emerald)"/> {perk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Judging criteria */}
                  {event.judgingCriteria?.length > 0 && (
                    <div className="ed-panel" style={{ marginTop:18 }}>
                      <div className="ed-panel__title">
                        <span className="ed-panel__title-icon"><Trophy size={14} color="var(--da-blue)"/></span>
                        Judging Criteria
                      </div>
                      {event.judgingCriteria.map((c,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom: i<event.judgingCriteria.length-1 ? '1px solid var(--da-border-sub)':'none' }}>
                          <span style={{ fontSize:14, color:'var(--da-ink-60)' }}>{c.criterion}</span>
                          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                            <div style={{ width:90, height:7, background:'var(--da-ink-05)', borderRadius:9999, overflow:'hidden' }}>
                              <div style={{ width:`${c.weightage}%`, height:'100%', background:'linear-gradient(90deg,var(--da-blue),var(--da-violet))', borderRadius:9999 }}/>
                            </div>
                            <span style={{ fontSize:13, fontWeight:800, color:'var(--da-blue)', minWidth:32 }}>{c.weightage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/*  SCHEDULE  */}
          {activeTab==='schedule' && (
            <div className="ed-panel">
              <div className="ed-panel__title">
                <span className="ed-panel__title-icon"><Calendar size={14} color="var(--da-blue)"/></span>
                Event Schedule
              </div>
              {!event.schedule?.length ? (
                <EmptyState icon={<Calendar size={26} color="#5B6EF5"/>} title="Schedule not yet available" description="The organizer will update the schedule soon."/>
              ) : (
                <div className="ed-timeline">
                  {event.schedule.map((item,i) => {
                    const typeColors = {
                      keynote:'#5B6EF5', workshop:'#10B981', session:'#06B6D4',
                      break:'#94A3B8', networking:'#F59E0B', panel:'#8B5CF6',
                    };
                    const color = typeColors[item.type] || '#5B6EF5';
                    return (
                      <div key={i} className="ed-timeline__item">
                        <div
                          className="ed-timeline__dot"
                          style={{ color, background: color }}
                        />
                        <div className="ed-timeline__content">
                          <span
                            className="ed-timeline__type-badge"
                            style={{ background:`${color}18`, color, border:`1px solid ${color}30` }}
                          >
                            {item.type}
                          </span>
                          <p className="ed-timeline__title">{item.title}</p>
                          <p className="ed-timeline__meta">
                            <Calendar size={11}/> {formatDate(item.date)}
                            {item.time && <> · {item.time}</>}
                            {item.duration && <> · {item.duration}</>}
                          </p>
                          {item.description && (
                            <p className="ed-timeline__desc">{item.description}</p>
                          )}
                          {item.speaker && (
                            <p className="ed-timeline__speaker">
                              <Star size={11}/> {item.speaker}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/*  TEAMS  */}
          {activeTab==='teams' && (
            event.isTeamEvent
              ? <TeamFormationTab event={event} user={user} isAuthenticated={isAuthenticated}/>
              : <EmptyState icon={<Users size={26} color="#6B7280"/>} title="Individual Event" description="This event does not support teams. Participate individually."/>
          )}

          {/*  DISCUSSION  */}
          {activeTab==='discussion' && (
            <div>
              {isAuthenticated && (
                  <div className="ed-comment-form">
                    <div className="ed-comment-form__head">
                      <div>
                        <h3 className="ed-comment-form__title">Join the Discussion</h3>
                        <p className="ed-comment-form__desc">Ask questions, share insights, or connect with organizers & peers</p>
                      </div>
                      <div className="ed-comment-type-pills">
                        <button
                          type="button"
                          onClick={() => setCommentType('comment')}
                          className={`ed-comment-type-pill ${commentType === 'comment' ? 'ed-comment-type-pill--active' : ''}`}
                        >
                          <MessageSquare size={13} /> Comment
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentType('question')}
                          className={`ed-comment-type-pill ${commentType === 'question' ? 'ed-comment-type-pill--active' : ''}`}
                        >
                          <HelpCircle size={13} /> Question
                        </button>
                      </div>
                    </div>

                    <div className="ed-comment-input-box">
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={commentType === 'question' ? 'Ask a question about this event, requirements, submissions…' : 'Share your thoughts or ideas about this event…'}
                        rows={3}
                        className="ed-comment-textarea"
                      />
                      <div className="ed-comment-action-bar">
                        <span className="ed-comment-char-hint">
                          {newComment.length > 0 ? `${newComment.length} characters` : 'Markdown formatting supported'}
                        </span>
                        <button
                          type="button"
                          onClick={handleComment}
                          disabled={!newComment.trim()}
                          className="ed-comment-post-btn"
                        >
                          <Send size={13} /> Post {commentType === 'question' ? 'Question' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
              )}
              {comments.map(c => (
                <CommentCard
                  key={c._id} comment={c}
                  onLike={() => api.post(`/events/${event._id}/comments/${c._id}/like`).then(fetchComments)}
                  user={user} eventId={event._id} onReply={fetchComments}
                />
              ))}
              {!comments.length && (
                <EmptyState icon="" title="No discussions yet" description="Be the first to start the conversation!"/>
              )}
            </div>
          )}
        </div>

        {/*  RIGHT SIDEBAR  */}
        <div className="ed-sidebar">

          {/* Registration card */}
          <div className="ed-reg-card">
            {userReg ? (
              /* Already registered */
              <div className="ed-reg-status">
                <div className="ed-reg-status__icon" style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                  {userReg.status==='approved' ? <CheckCircle size={44} color="var(--da-emerald)"/>
                   : userReg.status==='pending'    ? <Clock size={44} color="var(--da-amber)"/>
                   : userReg.status==='waitlisted' ? <Users size={44} color="var(--da-blue)"/>
                   : <AlertCircle size={44} color="var(--da-red)"/>}
                </div>
                <h3 className="ed-reg-status__title">
                  {userReg.status==='approved'    ? "You're In!"
                   : userReg.status==='pending'    ? 'Pending Approval'
                   : userReg.status==='waitlisted' ? 'On Waitlist'
                   : 'Registration Rejected'}
                </h3>
                <p className="ed-reg-status__sub">
                  {userReg.status==='approved'    ? 'Your registration is confirmed. See you there!'
                   : userReg.status==='pending'    ? 'The organizer will review your application soon.'
                   : userReg.status==='waitlisted' ? "You'll be notified if a spot opens up."
                   : 'Try registering for another event.'}
                </p>
                {event.isTeamEvent && userReg.status==='approved' && (
                  <button
                    onClick={() => setActiveTab('teams')}
                    style={{ marginTop:16, width:'100%', padding:'10px', borderRadius:'var(--r-pill)', background:'var(--da-ink-05)', border:'1.5px solid var(--da-border)', fontSize:13, fontWeight:700, cursor:'pointer', color:'#374151', fontFamily:'var(--font)' }}
                  >
                     Find / Create Team
                  </button>
                )}
              </div>
            ) : (
              /* Not registered */
              <>
                <div className="ed-reg-price-row">
                  <div>
                    <p className={`ed-reg-price ed-reg-price--${event.isPaid ? 'paid' : 'free'}`}>
                      {event.isPaid ? `₹${event.price?.toLocaleString()}` : 'FREE'}
                    </p>
                    <p className="ed-reg-price-sub">
                      {event.isPaid ? 'per participant' : 'No registration fee'}
                    </p>
                  </div>
                  {deadlineDays > 0 ? (
                    <div className="ed-reg-countdown">
                      <p
                        className="ed-reg-countdown-num"
                        style={{ color: deadlineDays<=3 ? 'var(--da-red)' : deadlineDays<=14 ? 'var(--da-amber)' : 'var(--da-blue)' }}
                      >
                        {deadlineDays}d
                      </p>
                      <p className="ed-reg-countdown-label">to register</p>
                    </div>
                  ) : isOpen ? (
                    <div className="ed-reg-countdown" style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <p className="ed-reg-countdown-num" style={{ color: '#10B981', fontSize: 13, textTransform: 'uppercase' }}>
                        Live
                      </p>
                      <p className="ed-reg-countdown-label">Registration Open</p>
                    </div>
                  ) : null}
                </div>

                <button
                  className={`ed-reg-btn ed-reg-btn--${isOpen ? 'open' : 'closed'}`}
                  disabled={!isOpen}
                  onClick={() => isAuthenticated ? setShowRegModal(true)
                    : navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                >
                  {!isOpen
                    ? (deadlineDays===0 ? 'Registration Closed' : 'Not Open Yet')
                    : isAuthenticated ? 'Register Now' : 'Login to Register'}
                </button>

                {event.maxParticipants > 0 && (
                  <div className="ed-capacity">
                    <div className="ed-capacity__row">
                      <span className="ed-capacity__text">
                        {event.registeredCount} / {event.maxParticipants} spots filled
                      </span>
                      <span
                        className="ed-capacity__pct"
                        style={{ color: capPct>80 ? 'var(--da-red)' : capPct>60 ? 'var(--da-amber)' : 'var(--da-blue)' }}
                      >
                        {capPct}%
                      </span>
                    </div>
                    <div className="ed-capacity__bar">
                      <div
                        className="ed-capacity__fill"
                        style={{
                          width:`${capPct}%`,
                          background: capPct>80
                            ? 'linear-gradient(90deg,var(--da-red),#F97316)'
                            : 'linear-gradient(90deg,var(--da-blue),var(--da-violet))',
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Event info card */}
          <div className="ed-info-card">
            <p className="ed-info-card__title">Event Details</p>
            <div className="ed-info-list">
              {infoRows.map((row,i) => (
                <div key={i} className="ed-info-row">
                  <span
                    className="ed-info-icon"
                    style={{ background: INFO_ICON_BG[row.bgIdx], color: INFO_ICON_COLOR[row.bgIdx] }}
                  >
                    {row.icon}
                  </span>
                  <div>
                    <p className="ed-info-label">{row.label}</p>
                    <p className="ed-info-val">{row.val || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags card */}
          {event.tags?.length > 0 && (
            <div className="ed-info-card">
              <p className="ed-info-card__title">Tags</p>
              <div className="ed-sidebar-tags">
                {event.tags.map((tag,i) => (
                  <Link key={i} to={`/explore?tags=${tag}`} className="ed-sidebar-tag">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/*  REGISTRATION MODAL  */}
      <Modal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        title="Confirm Registration"
        footer={<>
          <button
            onClick={() => setShowRegModal(false)}
            style={{ padding:'9px 20px', borderRadius:'var(--r-pill)', fontSize:13, fontWeight:600, color:'#374151', border:'1.5px solid var(--da-border)', background:'transparent', cursor:'pointer', fontFamily:'var(--font)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleRegister}
            disabled={registering}
            style={{ padding:'9px 22px', borderRadius:'var(--r-pill)', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:8, border:'none', fontFamily:'var(--font)', opacity: registering ? 0.7 : 1, boxShadow:'0 4px 14px rgba(91,110,245,0.30)' }}
          >
            {registering ? <><Spinner size={14} color="#fff"/> Registering…</> : ' Confirm Registration'}
          </button>
        </>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="ed-modal-event-preview">
            <h3 style={{ fontSize:15, fontWeight:800, color:'#111827', marginBottom:6, letterSpacing:'-0.01em' }}>{event.title}</h3>
            <p style={{ fontSize:13, color:'#6B7280' }}>{formatDate(event.startDate)} – {formatDate(event.endDate)}</p>
          </div>
          {event.isPaid && (
            <div className="ed-modal-warning ed-modal-warning--amber">
              <AlertCircle size={16} style={{ color:'var(--da-amber)', flexShrink:0, marginTop:1 }}/>
              <span>This is a paid event. You'll be redirected to complete payment of <strong>₹{event.price?.toLocaleString()}</strong>.</span>
            </div>
          )}
          {event.requiresApproval && (
            <div className="ed-modal-warning ed-modal-warning--blue">
              <Shield size={16} style={{ color:'var(--da-blue)', flexShrink:0, marginTop:1 }}/>
              <span>This event requires organizer approval. Your registration will be reviewed before confirmation.</span>
            </div>
          )}
          <p style={{ fontSize:13, color:'#9CA3AF' }}>
            By registering, you agree to the event terms and DevArena's policies.
          </p>
        </div>
      </Modal>
    </div>
  );
};

/*  CommentCard  */
const CommentCard = ({ comment, onLike, user, eventId, onReply }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const isLiked = comment.likes?.includes(user?._id);

  const handleReply = async e => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.post(`/events/${eventId}/comments`, { content: replyText, parentCommentId: comment._id });
      setReplyText(''); setShowReply(false); onReply();
    } catch {}
  };

  return (
    <div className="ed-comment-card">
      <div style={{ display:'flex', gap:12 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff', flexShrink:0, overflow:'hidden' }}>
          {comment.author?.avatar
            ? <img src={comment.author.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : comment.author?.name?.[0]}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7, flexWrap:'wrap' }}>
            <span style={{ fontSize:13.5, fontWeight:800, color:'#111827' }}>{comment.author?.name}</span>
            {comment.author?.role==='organizer' && (
              <span style={{ padding:'2px 8px', borderRadius:9999, background:'rgba(91,110,245,0.12)', color:'var(--da-blue)', fontSize:10, fontWeight:700, border:'1px solid rgba(91,110,245,0.20)' }}>Organizer</span>
            )}
            {comment.type!=='comment' && (
              <span style={{ fontSize:11, color:'var(--da-amber)', fontWeight:700, padding:'2px 8px', background:'rgba(245,158,11,0.08)', borderRadius:9999, border:'1px solid rgba(245,158,11,0.18)' }}>
                {comment.type==='question' ? 'Question' : 'Announcement'}
              </span>
            )}
            <span style={{ fontSize:11, color:'var(--da-ink-30)', marginLeft:'auto' }}>{timeAgo(comment.createdAt)}</span>
          </div>
          <p style={{ fontSize:14, color:'#6B7280', lineHeight:1.7, marginBottom:10 }}>{comment.content}</p>
          <div style={{ display:'flex', gap:14 }}>
            <button onClick={onLike} style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600, color: isLiked ? 'var(--da-red)' : '#9CA3AF', cursor:'pointer', background:'none', border:'none', padding:0, transition:'color 150ms ease' }}>
              {isLiked ? 'Liked' : 'Like'} {comment.likes?.length||0}
            </button>
            <button onClick={() => setShowReply(!showReply)} style={{ fontSize:12, fontWeight:600, color:'#9CA3AF', cursor:'pointer', background:'none', border:'none', padding:0 }}>
               Reply{comment.replies?.length>0 ? ` (${comment.replies.length})` : ''}
            </button>
          </div>
          {showReply && (
            <form onSubmit={handleReply} style={{ display:'flex', gap:8, marginTop:12 }}>
              <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply…" style={{ flex:1, height:36, fontSize:13 }}/>
              <button type="submit" style={{ padding:'6px 16px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', borderRadius:'var(--r-pill)', fontSize:12, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'var(--font)' }}>Reply</button>
            </form>
          )}
          {comment.replies?.map(reply => (
            <div key={reply._id} style={{ marginTop:12, paddingLeft:16, borderLeft:'2px solid var(--da-border)' }}>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,var(--da-violet),var(--da-pink))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {reply.author?.name?.[0]}
                </div>
                <div>
                  <span style={{ fontSize:12, fontWeight:800, color:'#111827', marginRight:8 }}>{reply.author?.name}</span>
                  <span style={{ fontSize:11, color:'var(--da-ink-30)' }}>{timeAgo(reply.createdAt)}</span>
                  <p style={{ fontSize:13, color:'#6B7280', marginTop:4, lineHeight:1.6 }}>{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/*  TeamFormationTab  */
const TeamFormationTab = ({ event, user, isAuthenticated }) => {
  const [teams,      setTeams]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam,    setNewTeam]    = useState({ name:'', description:'', requiredSkills:'' });

  useEffect(() => {
    api.get(`/teams/event/${event._id}`)
      .then(({ data }) => setTeams(data.teams))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event._id]);

  const createTeam = async () => {
    try {
      const { data } = await api.post('/teams', {
        name: newTeam.name, description: newTeam.description, eventId: event._id,
        maxSize: event.maxTeamSize,
        requiredSkills: newTeam.requiredSkills.split(',').map(s=>s.trim()).filter(Boolean),
      });
      setTeams(p => [data.team, ...p]);
      setShowCreate(false);
      setNewTeam({ name:'', description:'', requiredSkills:'' });
      toast.success('Team created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const requestJoin = async id => {
    try {
      await api.post(`/teams/${id}/request`, { message:'I would like to join your team!' });
      toast.success('Join request sent!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner/></div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h3 style={{ fontSize:18, fontWeight:800, color:'#111827', letterSpacing:'-0.02em' }}>
          Teams <span style={{ fontSize:14, color:'#9CA3AF', fontWeight:600 }}>({teams.length})</span>
        </h3>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{ padding:'9px 20px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', borderRadius:'var(--r-pill)', fontSize:13, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'var(--font)', boxShadow:'0 4px 14px rgba(91,110,245,0.28)' }}
          >
            + Create Team
          </button>
        )}
      </div>

      {showCreate && (
        <div style={{ background:'#fff', border:'1.5px solid var(--da-blue)', borderRadius:'var(--r-xl)', padding:22, marginBottom:20, boxShadow:'0 0 0 4px rgba(91,110,245,0.08)' }}>
          <h4 style={{ fontWeight:800, color:'#111827', marginBottom:14, letterSpacing:'-0.01em' }}>Create New Team</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input value={newTeam.name} onChange={e=>setNewTeam({...newTeam,name:e.target.value})} placeholder="Team name *"/>
            <textarea value={newTeam.description} onChange={e=>setNewTeam({...newTeam,description:e.target.value})} placeholder="Team description" rows={2}/>
            <input value={newTeam.requiredSkills} onChange={e=>setNewTeam({...newTeam,requiredSkills:e.target.value})} placeholder="Required skills (comma-separated)"/>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button onClick={createTeam} disabled={!newTeam.name} style={{ padding:'9px 22px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', borderRadius:'var(--r-pill)', fontSize:13, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'var(--font)', opacity:!newTeam.name ? 0.5 : 1 }}>
                Create
              </button>
              <button onClick={()=>setShowCreate(false)} style={{ padding:'9px 20px', background:'var(--da-ink-05)', color:'#374151', borderRadius:'var(--r-pill)', fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid var(--da-border)', fontFamily:'var(--font)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!teams.length
        ? <EmptyState icon="" title="No teams yet" description="Be the first to create a team!"/>
        : <div className="ed-teams-grid">
            {teams.map(team => {
              const isMember = team.members?.some(m => m.user?._id===user?._id);
              const isFull   = team.members?.length >= team.maxSize;
              return (
                <div key={team._id} className="ed-team-card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <h4 style={{ fontSize:15, fontWeight:800, color:'#111827', letterSpacing:'-0.01em' }}>{team.name}</h4>
                    <span style={{ fontSize:11, fontWeight:700, color: isFull ? 'var(--da-ink-30)' : team.isOpen ? 'var(--da-emerald)' : 'var(--da-red)' }}>
                      {isFull ? 'Full' : team.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {team.description && <p style={{ fontSize:12.5, color:'#6B7280', marginBottom:12, lineHeight:1.6 }}>{team.description}</p>}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <div style={{ display:'flex' }}>
                      {team.members?.slice(0,4).map((m,i)=>(
                        <div key={i} style={{ width:26, height:26, borderRadius:'50%', background:`hsl(${i*60},60%,55%)`, border:'2px solid #fff', marginLeft:i>0?-6:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', overflow:'hidden' }}>
                          {m.user?.avatar ? <img src={m.user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : m.user?.name?.[0]}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize:12, color:'#6B7280', fontWeight:600 }}>{team.members?.length}/{team.maxSize} members</span>
                  </div>
                  {team.requiredSkills?.length>0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                      {team.requiredSkills.slice(0,3).map((sk,i)=>(
                        <span key={i} style={{ fontSize:10.5, padding:'2px 9px', background:'rgba(91,110,245,0.08)', borderRadius:9999, color:'var(--da-blue)', border:'1px solid rgba(91,110,245,0.18)', fontWeight:600 }}>{sk}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8 }}>
                    <Link to={`/teams/${team._id}`} style={{ flex:1, textAlign:'center', padding:'8px', borderRadius:'var(--r-pill)', border:'1.5px solid var(--da-border)', fontSize:12, fontWeight:700, color:'var(--da-ink-60)', textDecoration:'none', transition:'all 150ms ease', display:'block' }}>View</Link>
                    {isAuthenticated && !isMember && !isFull && team.isOpen && (
                      <button onClick={()=>requestJoin(team._id)} style={{ flex:1, padding:'8px', borderRadius:'var(--r-pill)', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer', border:'none', fontFamily:'var(--font)' }}>
                        Request Join
                      </button>
                    )}
                    {isMember && <span style={{ fontSize:12, color:'var(--da-emerald)', fontWeight:700, alignSelf:'center' }}> Joined</span>}
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
};

export default EventDetails;
