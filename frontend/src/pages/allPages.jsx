import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Download, Shield, MessageSquare, Send, Trophy, Medal, Award, Zap, FileText, Calendar, Users, Star, Plus, X, Search, Crown, Sparkles } from 'lucide-react';
import { Spinner, EmptyState, RankMedal, DevBadge } from '../components/common/index';
import WebGLBackground from '../components/common/WebGLBackground';
import { setChats, setActiveChat, setMessages, addMessage } from '../store/slices/chatSlice';
import { fetchCurrentUser } from '../store/slices/authSlice';
import api from '../utils/api';
import { formatDate, timeAgo, getLevelInfo } from '../utils/helpers';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

/* 
   LEADERBOARD
 */
export const Leaderboard = () => {
  const { user: me } = useSelector(s => s.auth);
  const [board, setBoard]   = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/leaderboard?period=${period}`)
      .then(({ data }) => { setBoard(data.leaderboard); setMyRank(data.userRank); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const topThree = board.slice(0, 3);

  return (
    <div style={{ minHeight:'100vh', background:'#F4F4FF', padding:'0 0 60px' }}>
      
      {/* ── Dynamic Live WebGL Header ── */}
      <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(180deg, #FFFFFF 0%, #EEF2FF 100%)', borderBottom:'1px solid rgba(91,110,245,0.12)', padding:'44px 0 32px' }}>
        <WebGLBackground intensity={0.5} />
        <div className="container" style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:9999, background:'rgba(91,110,245,0.08)', border:'1px solid rgba(91,110,245,0.20)', fontSize:12, fontWeight:700, color:'#4F46E5', marginBottom:12 }}>
            <Sparkles size={13} color="#5B6EF5" />
            <span>Developer Rankings &bull; Real-time Points</span>
          </div>
          <h1 style={{ fontFamily:'var(--font-display, "Space Grotesk", sans-serif)', fontSize:'clamp(30px,4.5vw,44px)', fontWeight:900, letterSpacing:'-0.03em', color:'#0F172A', marginBottom:8, lineHeight:1.15 }}>
            Platform <span style={{ background:'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Leaderboard</span>
          </h1>
          <p style={{ fontSize:14.5, color:'#64748B', maxWidth:540, margin:'0 auto 24px' }}>
            Compete in hackathons, complete project submissions, and climb the developer ranks.
          </p>

          {/* Period selector */}
          <div style={{ display:'flex', justifyContent:'center', gap:4, background:'#fff', padding:4, borderRadius:'9999px', border:'1.5px solid rgba(91,110,245,0.20)', width:'fit-content', margin:'0 auto', boxShadow:'0 4px 16px rgba(91,110,245,0.08)' }}>
            {[['all','All Time'],['monthly','Monthly'],['weekly','Weekly']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                style={{ padding:'7px 20px', borderRadius:'9999px', fontSize:13, fontWeight:700, cursor:'pointer', border:'none', background:period===v?'linear-gradient(135deg,#5B6EF5,#7C3AED)':'transparent', color:period===v?'#fff':'#64748B', transition:'all 150ms ease', boxShadow:period===v?'0 2px 8px rgba(91,110,245,0.28)':'none' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 32 }}>

        {/* ── Top 3 Podium Cards ── */}
        {!loading && topThree.length >= 3 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:18, maxWidth:860, margin:'0 auto 36px', alignItems:'flex-end' }}>
            
            {/* Rank #2 (Silver) */}
            <Link to={`/user/${topThree[1].user._id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div style={{ background:'#fff', border:'1.5px solid #CBD5E1', borderRadius:20, padding:'24px 16px', textAlign:'center', position:'relative', boxShadow:'0 6px 20px rgba(148,163,184,0.14)', transition:'all 0.25s ease' }}>
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#94A3B8', color:'#fff', padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}>
                  <Medal size={12} /> #2 Silver
                </div>
                <div style={{ width:56, height:56, borderRadius:'50%', margin:'8px auto 10px', padding:2, border:'2px solid #94A3B8', overflow:'hidden' }}>
                  {topThree[1].user.avatar
                    ? <img src={topThree[1].user.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#64748B,#94A3B8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff' }}>{topThree[1].user.name?.[0]}</div>
                  }
                </div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{topThree[1].user.name}</h3>
                <span style={{ fontSize:11, fontWeight:700, color:'#5B6EF5', background:'rgba(91,110,245,0.08)', padding:'2px 8px', borderRadius:9999 }}>Lv.{getLevelInfo(topThree[1].points).level}</span>
                <p style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'#0F172A', marginTop:8 }}>{topThree[1].points.toLocaleString()}<span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', marginLeft:3 }}>pts</span></p>
              </div>
            </Link>

            {/* Rank #1 (Gold - elevated) */}
            <Link to={`/user/${topThree[0].user._id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div style={{ background:'linear-gradient(180deg, #FFFFFF 0%, #FEF9C3 100%)', border:'2px solid #F59E0B', borderRadius:24, padding:'28px 18px 24px', textAlign:'center', position:'relative', boxShadow:'0 10px 32px rgba(245,158,11,0.22)', transform:'translateY(-10px)', transition:'all 0.25s ease' }}>
                <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg, #F59E0B, #D97706)', color:'#fff', padding:'4px 14px', borderRadius:9999, fontSize:12, fontWeight:800, display:'flex', alignItems:'center', gap:5, boxShadow:'0 4px 12px rgba(245,158,11,0.35)' }}>
                  <Crown size={14} color="#FFF" /> #1 Champion
                </div>
                <div style={{ width:68, height:68, borderRadius:'50%', margin:'6px auto 10px', padding:3, background:'linear-gradient(135deg, #F59E0B, #FBBF24)', overflow:'hidden', boxShadow:'0 4px 16px rgba(245,158,11,0.30)' }}>
                  {topThree[0].user.avatar
                    ? <img src={topThree[0].user.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border:'2px solid #fff' }} />
                    : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#D97706,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:'#fff', border:'2px solid #fff' }}>{topThree[0].user.name?.[0]}</div>
                  }
                </div>
                <h3 style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{topThree[0].user.name}</h3>
                <span style={{ fontSize:11, fontWeight:700, color:'#B45309', background:'rgba(245,158,11,0.15)', padding:'2px 8px', borderRadius:9999 }}>Lv.{getLevelInfo(topThree[0].points).level} Leader</span>
                <p style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:'#B45309', marginTop:8 }}>{topThree[0].points.toLocaleString()}<span style={{ fontSize:12, fontWeight:600, color:'#D97706', marginLeft:3 }}>pts</span></p>
              </div>
            </Link>

            {/* Rank #3 (Bronze) */}
            <Link to={`/user/${topThree[2].user._id}`} style={{ textDecoration:'none', color:'inherit' }}>
              <div style={{ background:'#fff', border:'1.5px solid #FDBA74', borderRadius:20, padding:'24px 16px', textAlign:'center', position:'relative', boxShadow:'0 6px 20px rgba(234,88,12,0.10)', transition:'all 0.25s ease' }}>
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#EA580C', color:'#fff', padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:800, display:'flex', alignItems:'center', gap:4 }}>
                  <Medal size={12} /> #3 Bronze
                </div>
                <div style={{ width:56, height:56, borderRadius:'50%', margin:'8px auto 10px', padding:2, border:'2px solid #EA580C', overflow:'hidden' }}>
                  {topThree[2].user.avatar
                    ? <img src={topThree[2].user.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#EA580C,#F97316)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff' }}>{topThree[2].user.name?.[0]}</div>
                  }
                </div>
                <h3 style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{topThree[2].user.name}</h3>
                <span style={{ fontSize:11, fontWeight:700, color:'#5B6EF5', background:'rgba(91,110,245,0.08)', padding:'2px 8px', borderRadius:9999 }}>Lv.{getLevelInfo(topThree[2].points).level}</span>
                <p style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:900, color:'#0F172A', marginTop:8 }}>{topThree[2].points.toLocaleString()}<span style={{ fontSize:11, fontWeight:600, color:'#94A3B8', marginLeft:3 }}>pts</span></p>
              </div>
            </Link>
          </div>
        )}

        {/* My rank banner */}
        {me && myRank && (
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', background:'rgba(91,110,245,0.08)', border:'1.5px solid rgba(91,110,245,0.22)', borderRadius:16, marginBottom:20, boxShadow:'0 4px 16px rgba(91,110,245,0.06)' }}>
            <span style={{ fontSize:22, fontWeight:900, color:'var(--da-blue)' }}>#{myRank}</span>
            <span style={{ fontSize:14, fontWeight:600, color:'#1E293B' }}>Your Current Rank</span>
            <span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, color:'var(--da-blue)', display:'inline-flex', alignItems:'center', gap:5 }}>
              <Zap size={15} color="#5B6EF5" fill="#5B6EF5" /> {me.points?.toLocaleString()} pts
            </span>
          </div>
        )}

        {/* Table */}
        <div style={{ background:'#fff', border:'1px solid rgba(91,110,245,0.14)', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 20px rgba(91,110,245,0.06)' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size={28} /></div>
          ) : board.map((entry, i) => {
            const isMe = me?._id === entry.user._id;
            const lvl  = getLevelInfo(entry.points);
            return (
              <Link key={entry.user._id} to={`/user/${entry.user._id}`}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderBottom: i < board.length-1 ? '1px solid #F1F5F9':'none', background: isMe ? 'rgba(91,110,245,0.08)':'transparent', textDecoration:'none', transition:'background 150ms ease' }}
                onMouseEnter={e => { if (!isMe) e.currentTarget.style.background='#F8FAFC'; }}
                onMouseLeave={e => { if (!isMe) e.currentTarget.style.background='transparent'; }}>
                {/* Rank */}
                <div style={{ width:40, textAlign:'center', flexShrink:0, display:'flex', justifyContent:'center' }}>
                  <RankMedal rank={entry.rank} />
                </div>
                {/* Avatar */}
                {entry.user.avatar
                  ? <img src={entry.user.avatar} alt="" style={{ width:42, height:42, borderRadius:'9999px', objectFit:'cover', flexShrink:0, border:'2px solid #E2E8F0' }} />
                  : <div style={{ width:42, height:42, borderRadius:'9999px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#FFF', flexShrink:0 }}>{entry.user.name?.[0]}</div>
                }
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <p style={{ fontSize:14.5, fontWeight:700, color:'#0F172A' }}>{entry.user.name}</p>
                    {isMe && <span style={{ padding:'2px 8px', borderRadius:'9999px', background:'linear-gradient(135deg,#5B6EF5,#7C3AED)', color:'#fff', fontSize:10, fontWeight:700 }}>You</span>}
                    <span style={{ fontSize:11.5, fontWeight:700, color:'#5B6EF5' }}>Lv.{lvl.level}</span>
                  </div>
                  <p style={{ fontSize:12.5, fontWeight:500, color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{entry.user.headline || entry.user.skills?.slice(0,3).join(' · ')}</p>
                </div>
                {/* Badges */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                  {entry.user.badges?.slice(0,3).map((b,j) => (
                    <DevBadge key={j} badge={b} size="sm" showName={true} />
                  ))}
                </div>
                {/* Points */}
                <div style={{ textAlign:'right', flexShrink:0, minWidth:90 }}>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800, letterSpacing:'-0.01em', color: entry.rank===1?'#D97706':entry.rank===2?'#475569':entry.rank===3?'#C2410C':'#0F172A' }}>{entry.points.toLocaleString()}</p>
                  <p style={{ fontSize:10.5, fontWeight:600, color:'#94A3B8' }}>points</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* 
   CERTIFICATES
 */
export const Certificates = () => {
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/certificates')
      .then(({ data }) => setCerts(data.certificates))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}><Spinner size={28} /></div>;

  return (
    <div style={{ minHeight:'100vh', background:'#F4F4FF', padding:'40px 0' }}>
      <div className="container">
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:'-0.02em', color:'#111827', marginBottom:4 }}>My Certificates</h1>
          <p style={{ fontSize:14, fontWeight:400, color:'#6B7280' }}>{certs.length} certificate{certs.length !== 1 ? 's':''} earned</p>
        </div>
        {certs.length === 0 ? (
          <EmptyState icon={<Award size={24} color="#5B6EF5"/>} title="No certificates yet" description="Complete events to earn verified certificates."
            action={<Link to="/explore" style={{ padding:'10px 22px', borderRadius:'9999px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', fontSize:13, fontWeight:400, textDecoration:'none' }}>Browse Events</Link>} />
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {certs.map(cert => (
              <div key={cert._id} style={{ background:'#fff', border:'1.5px solid var(--da-border)', borderRadius:16, overflow:'hidden', transition:'all 300ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='rgba(0,0,0,0.1) 0 0 20px 0'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}>
                {/* Header strip */}
                <div style={{ background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', padding:'22px 22px 18px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'9999px', background:'rgba(38,64,217,0.2)' }} />
    <div style={{width:40,height:40,background:"rgba(255,255,255,0.2)",borderRadius:"var(--r-lg)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                  <p style={{ fontSize:10, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginTop:10 }}>Certificate of {cert.type}</p>
                  <h3 style={{ fontSize:16, fontWeight:500, color:'#FFF', marginTop:4, lineHeight:'22px', position:'relative' }}>{cert.event?.title}</h3>
                </div>
                <div style={{ padding:'18px 22px' }}>
                  <div style={{ display:'flex', gap:16, marginBottom:16 }}>
                    <div>
                      <p style={{ fontSize:10, fontWeight:400, color:'#9CA3AF', marginBottom:2 }}>Issued on</p>
                      <p style={{ fontSize:13, fontWeight:400, color:'#111827' }}>{formatDate(cert.issuedAt)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize:10, fontWeight:400, color:'#9CA3AF', marginBottom:2 }}>Certificate ID</p>
                      <p style={{ fontSize:11, fontFamily:'monospace', color:'var(--da-blue)' }}>{cert.certificateId}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    {cert.downloadUrl && (
                      <a href={cert.downloadUrl} target="_blank" rel="noreferrer"
                        style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:'9999px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', fontSize:12, fontWeight:400, textDecoration:'none' }}>
                        <Download size={13} /> Download
                      </a>
                    )}
                    <Link to={`/verify-certificate/${cert.certificateId}`}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:'9999px', background:'transparent', border:'1.5px solid var(--da-border)', color:'#374151', fontSize:12, fontWeight:400, textDecoration:'none' }}>
                      <Shield size={13} /> Verify
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* 
   VERIFY CERTIFICATE
 */
export const VerifyCertificate = () => {
  const { id } = useParams();
  const [cert, setCert]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/certificates/verify/${id}`)
      .then(({ data }) => setCert(data.certificate))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh' }}><Spinner size={28} /></div>;

  return (
    <div style={{ minHeight:'100vh', background:'#F4F4FF', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:460, width:'100%' }}>
        {notFound ? (
          <div style={{ textAlign:'center', padding:40, background:'#fff', border:'1.5px solid var(--da-border)', borderRadius:20 }}>
            <div style={{ display:'flex',justifyContent:'center',marginBottom:14 }}><svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--da-red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
            <h2 style={{ fontSize:20, fontWeight:600, color:'#111827', marginBottom:8 }}>Certificate Not Found</h2>
            <p style={{ fontSize:14, fontWeight:400, color:'#6B7280' }}>This ID doesn't match our records or has been revoked.</p>
          </div>
        ) : (
          <div style={{ background:'#fff', border:'1.5px solid var(--da-border)', borderRadius:20, overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', padding:'28px 28px 24px', textAlign:'center' }}>
              <div style={{ display:'flex',justifyContent:'center',marginBottom:10 }}><svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <h2 style={{ fontSize:18, fontWeight:600, color:'#FFF', marginBottom:4 }}>Verified Certificate</h2>
              <p style={{ fontSize:13, fontWeight:400, color:'rgba(255,255,255,0.5)' }}>This certificate is authentic and valid</p>
            </div>
            <div style={{ padding:24 }}>
              {[
                ['Recipient',       cert?.user?.name],
                ['Event',           cert?.event?.title],
                ['Type',            cert?.type?.charAt(0).toUpperCase() + cert?.type?.slice(1)],
                ['Issued On',       formatDate(cert?.issuedAt)],
                ['Certificate ID',  cert?.certificateId],
              ].map(([label, val], i, arr) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom: i < arr.length-1 ? '1px solid var(--da-border-sub)':'none' }}>
                  <span style={{ fontSize:13, fontWeight:400, color:'#6B7280' }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight: label==='Certificate ID'?300:400, fontFamily: label==='Certificate ID'?'monospace':undefined, color: label==='Certificate ID'?'#2640D9':'#111827', maxWidth:240, textAlign:'right', wordBreak:'break-all' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* 
   CHAT PAGE
 */
export const ChatPage = () => {
  const { chatId }   = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const { user }     = useSelector(s => s.auth);
  const { chats, activeChat, messages } = useSelector(s => s.chat);
  const { joinChat, leaveChat, sendTyping, stopTyping, markRead, typingUsers, onlineUsers, isConnected } = useSocket();

  const [loadingChats,    setLoadingChats]    = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending,         setSending]         = useState(false);
  const [text,            setText]            = useState('');
  const [search,          setSearch]          = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const inputRef       = useRef(null);

  const loadSuggestedUsers = async (query = '') => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=15`);
      setAvailableUsers(data.users || []);
    } catch {
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleStartDirectChat = async (targetUserId) => {
    try {
      const { data } = await api.post(`/chat/direct/${targetUserId}`);
      if (data.chat) {
        dispatch(setChats([data.chat, ...chats.filter(c => c._id !== data.chat._id)]));
        setShowNewChatModal(false);
        navigate(`/chat/${data.chat._id}`);
      }
    } catch {
      toast.error('Could not start conversation');
    }
  };

  // ── Load chat list on mount ─────────────────────────────
  useEffect(() => {
    api.get('/chat')
      .then(({ data }) => dispatch(setChats(data.chats || [])))
      .catch(() => {})
      .finally(() => setLoadingChats(false));
  }, [dispatch]);

  // ── Activate chat when URL changes ──────────────────────
  useEffect(() => {
    if (!chatId || !chats.length) return;
    const found = chats.find(c => c._id === chatId);
    if (!found) return;

    dispatch(setActiveChat(found));

    // Leave old room, join new
    joinChat(chatId);
    setLoadingMessages(true);
    api.get(`/chat/${chatId}/messages`)
      .then(({ data }) => {
        dispatch(setMessages(data.messages || []));
        markRead(chatId);
      })
      .catch(() => {})
      .finally(() => setLoadingMessages(false));

    return () => leaveChat(chatId);
  }, [chatId, chats.length]); // eslint-disable-line

  // ── Auto scroll to bottom ───────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ────────────────────────────────────────
  const handleSend = async e => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeChat || sending) return;

    setSending(true);
    setText('');
    stopTyping(activeChat._id);

    try {
      const { data } = await api.post(`/chat/${activeChat._id}/messages`, { content: trimmed });
      // Optimistic: socket will broadcast back — dedup handles it
      if (data.message) dispatch(addMessage({ ...data.message, chatId: activeChat._id }));
    } catch {
      toast.error('Failed to send message');
      setText(trimmed); // restore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ── Typing indicator ────────────────────────────────────
  const handleTyping = e => {
    setText(e.target.value);
    if (!activeChat) return;
    sendTyping(activeChat._id);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => stopTyping(activeChat._id), 2500);
  };

  // ── Helpers ─────────────────────────────────────────────
  const getOtherUser  = chat => chat?.type === 'direct' ? chat.participants?.find(p => p._id !== user?._id) : null;
  const getChatName   = chat => getOtherUser(chat)?.name || chat?.name || 'Group Chat';
  const getChatAvatar = chat => {
    const other = getOtherUser(chat);
    return other?.avatar || null;
  };
  const isOnline = chat => {
    const other = getOtherUser(chat);
    return other ? onlineUsers.has(other._id) : false;
  };

  const activeTypers = activeChat
    ? Object.values(typingUsers?.[activeChat._id] || {}).filter(Boolean)
    : [];

  const filteredChats = chats.filter(c =>
    getChatName(c).toLowerCase().includes(search.toLowerCase())
  );

  // ── Avatar component ────────────────────────────────────
  const Avatar = ({ src, name, size = 36, online = false }) => {
    const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'linear-gradient(135deg,#5B6EF5,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 700, color: '#fff', overflow: 'hidden',
        }}>
          {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials}
        </div>
        {online && (
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 9, height: 9, borderRadius: '50%',
            background: '#10B981', border: '2px solid #fff',
          }}/>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', background: '#F4F4FF', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 300, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: '#fff', borderRight: '1px solid rgba(91,110,245,0.10)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(91,110,245,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Messages</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 9999,
                background: isConnected ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${isConnected ? 'rgba(16,185,129,0.20)' : 'rgba(239,68,68,0.20)'}`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#10B981' : '#EF4444' }}/>
                <span style={{ fontSize: 10, fontWeight: 600, color: isConnected ? '#10B981' : '#EF4444' }}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <button
                onClick={() => { setShowNewChatModal(true); loadSuggestedUsers(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '3px 8px', borderRadius: 6,
                  background: '#5B6EF5', color: '#fff', border: 'none',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
                title="Start a new direct chat"
              >
                <Plus size={12} /> New
              </button>
            </div>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{
                width: '100%', height: 34, paddingLeft: 30, paddingRight: 10,
                border: '1px solid rgba(91,110,245,0.12)', borderRadius: 9999,
                background: '#F8F8FF', fontSize: 13, color: '#111827', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner/></div>
          ) : filteredChats.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
              {chats.length === 0 ? 'No conversations yet' : 'No results for "' + search + '"'}
            </div>
          ) : filteredChats.map(c => {
            const active = activeChat?._id === c._id;
            const online = isOnline(c);
            const unread = c.messages?.filter(m => !m.readBy?.includes(user?._id) && m.sender !== user?._id).length || 0;
            return (
              <Link key={c._id} to={`/chat/${c._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: active ? 'rgba(91,110,245,0.07)' : 'transparent',
                  borderLeft: `3px solid ${active ? '#5B6EF5' : 'transparent'}`,
                  transition: 'all 150ms',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar src={getChatAvatar(c)} name={getChatName(c)} size={38} online={online}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getChatName(c)}
                      </p>
                      {c.lastMessage?.createdAt && (
                        <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0, marginLeft: 6 }}>
                          {timeAgo(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: unread > 0 ? '#5B6EF5' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread > 0 ? 500 : 400 }}>
                      {c.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#5B6EF5', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {unread > 9 ? '9+' : unread}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Main chat area ── */}
      {!activeChat ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#9CA3AF' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#9CA3AF' }}>Select a conversation to start messaging</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid rgba(91,110,245,0.08)',
            background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar src={getChatAvatar(activeChat)} name={getChatName(activeChat)} size={36} online={isOnline(activeChat)}/>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{getChatName(activeChat)}</p>
              <p style={{ fontSize: 11, color: isOnline(activeChat) ? '#10B981' : '#9CA3AF', marginTop: 3 }}>
                {isOnline(activeChat) ? 'Online' : 'Offline'}
              </p>
            </div>
            <button
              onClick={() => { const other = getOtherUser(activeChat); if (other) navigate(`/user/${other._id}`); }}
              style={{ padding: '5px 12px', borderRadius: 9999, border: '1px solid rgba(91,110,245,0.18)', background: 'rgba(91,110,245,0.06)', fontSize: 12, fontWeight: 600, color: '#5B6EF5', cursor: 'pointer' }}>
              View Profile
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loadingMessages ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner/></div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>
                No messages yet. Say hello!
              </div>
            ) : messages.map((msg, idx) => {
              const isOwn    = msg.sender?._id === user?._id || msg.sender === user?._id;
              const senderName = msg.sender?.name || 'Unknown';
              const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id);

              return (
                <div key={msg._id || idx} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {!isOwn && (
                    <div style={{ width: 26, flexShrink: 0 }}>
                      {showAvatar && <Avatar src={msg.sender?.avatar} name={senderName} size={26}/>}
                    </div>
                  )}
                  <div style={{ maxWidth: '65%' }}>
                    {showAvatar && !isOwn && (
                      <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 3, marginLeft: 2 }}>{senderName}</p>
                    )}
                    <div style={{
                      padding: '9px 14px',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isOwn
                        ? 'linear-gradient(135deg,#5B6EF5,#7C3AED)'
                        : '#fff',
                      border: isOwn ? 'none' : '1px solid rgba(91,110,245,0.12)',
                      fontSize: 14, color: isOwn ? '#fff' : '#111827', lineHeight: 1.55,
                      boxShadow: isOwn ? '0 2px 8px rgba(91,110,245,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                      wordBreak: 'break-word',
                    }}>
                      {msg.isDeleted ? <em style={{ opacity: 0.5, fontSize: 12 }}>This message was deleted</em> : msg.content}
                    </div>
                    <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: isOwn ? 'right' : 'left', paddingRight: isOwn ? 2 : 0, paddingLeft: isOwn ? 0 : 2 }}>
                      {timeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {activeTypers.length > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 26 }}/>
                <div style={{
                  padding: '9px 14px', borderRadius: '18px 18px 18px 4px',
                  background: '#fff', border: '1px solid rgba(91,110,245,0.12)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF',
                      animation: `loading-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(91,110,245,0.08)', background: '#fff' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={text}
                onChange={handleTyping}
                placeholder="Type a message..."
                disabled={sending}
                style={{
                  flex: 1, height: 42, padding: '0 16px',
                  border: '1.5px solid rgba(91,110,245,0.18)', borderRadius: 9999,
                  background: '#F8F8FF', fontSize: 14, color: '#111827', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#5B6EF5'}
                onBlur={e => e.target.style.borderColor = 'rgba(91,110,245,0.18)'}
              />
              <button type="submit" disabled={!text.trim() || sending} style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: text.trim() && !sending ? 'linear-gradient(135deg,#5B6EF5,#7C3AED)' : '#E5E7EB',
                border: 'none', cursor: text.trim() && !sending ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', boxShadow: text.trim() && !sending ? '0 4px 12px rgba(91,110,245,0.28)' : 'none',
              }}>
                {sending ? <Spinner size={16} color="#fff"/> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#fff' : '#9CA3AF'} strokeWidth="2.5" strokeLinecap="round">
                    <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── New Chat Modal ── */}
      {showNewChatModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowNewChatModal(false)}>
          <div style={{
            width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden', border: '1px solid rgba(91,110,245,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #E5E7EB',
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Start New Conversation</h3>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Search and select a developer to chat with</p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value);
                    loadSuggestedUsers(e.target.value);
                  }}
                  placeholder="Search by name, headline, or skill..."
                  autoFocus
                  style={{
                    width: '100%', height: 38, paddingLeft: 34, paddingRight: 12,
                    borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px 12px' }}>
              {loadingUsers ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={20} /></div>
              ) : availableUsers.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                  No developers found
                </div>
              ) : (
                availableUsers.map(u => (
                  <div
                    key={u._id}
                    onClick={() => handleStartDirectChat(u._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar src={u.avatar} name={u.name} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </p>
                        {u.points > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#5B6EF5', background: 'rgba(91,110,245,0.08)', padding: '1px 6px', borderRadius: 999 }}>
                            {u.points} pts
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.headline || 'Developer on DevArena'}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#5B6EF5' }}>Message</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const GoogleAuthSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token   = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    if (token) {
      localStorage.setItem('devarena_token', token);
      if (refresh) localStorage.setItem('devarena_refresh', refresh);
      dispatch(fetchCurrentUser()).then(() => navigate('/dashboard'));
    } else {
      navigate('/login');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <Spinner size={32} />
    </div>
  );
};

/* 
   NOT FOUND
 */
export const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:24, background:'#F4F4FF' }}>
      <div>
        <div style={{ fontSize:80, marginBottom:12, fontWeight:800, letterSpacing:'-0.04em', color:'var(--da-ink-10)', lineHeight:1 }}>404</div>
        <div style={{ fontSize:64, marginBottom:20, fontWeight:900, letterSpacing:'-0.04em', color:'var(--da-ink-10)', lineHeight:1 }}>404</div>
        <h1 style={{ fontSize:28, fontWeight:600, letterSpacing:'-0.02em', color:'#111827', marginBottom:10 }}>Page not found</h1>
        <p style={{ fontSize:15, fontWeight:400, color:'#6B7280', maxWidth:380, margin:'0 auto 32px', lineHeight:'24px' }}>The arena you're looking for doesn't exist. It may have been moved or deleted.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => navigate(-1)}
            style={{ padding:'10px 20px', borderRadius:'9999px', border:'1.5px solid var(--da-border)', background:'#fff', fontSize:14, fontWeight:400, cursor:'pointer', color:'#374151', transition:'all 150ms ease' }}>
            ← Go back
          </button>
          <Link to="/" style={{ padding:'10px 22px', borderRadius:'9999px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', fontSize:14, fontWeight:400, textDecoration:'none', transition:'all 150ms ease' }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};

/* Profile is now in ProfilePage.jsx, re-exported here for backward compat */
export { default as Profile } from './ProfilePage';

/*  Stub pages  */
export const EditEvent      = () => { const { id } = useParams(); return <div style={{ padding:48, textAlign:'center', color:'#6B7280' }}><h2 style={{ color:'#111827', marginBottom:8 }}>Edit Event</h2><p>Same form as Create Event, pre-filled. Event ID: {id}</p></div>; };
export const OrganizerDashboard = () => {
  const [stats,  setStats]  = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [loading,setLoading]= React.useState(true);
  React.useEffect(() => {
    Promise.all([
      api.get('/events?organizer=me&limit=10').catch(() => ({ data: { events: [] } })),
      api.get('/users/dashboard').catch(() => ({ data: { dashboard: null } })),
    ]).then(([evRes, dashRes]) => {
      setEvents(evRes.data.events || []);
      setStats(dashRes.data.dashboard?.user?.stats || {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'70vh' }}><Spinner /></div>;

  const STAT_COLORS = ['var(--da-blue)','var(--da-emerald)','var(--da-amber)','var(--da-violet)'];
  const statItems = [
    { icon: <Calendar size={18} color="var(--da-blue)" />, label:'Events Created',  value: stats?.eventsCreated  || 0 },
    { icon: <Users size={18} color="var(--da-emerald)" />, label:'Total Registered', value: stats?.eventsJoined   || 0 },
    { icon: <Award size={18} color="var(--da-amber)" />, label:'Certs Issued',     value: stats?.certificatesEarned || 0 },
    { icon: <Star size={18} color="var(--da-violet)" />, label:'Avg Rating',       value: '4.8' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#F4F4FF', padding:'28px 0 60px' }}>
      <div className="container">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:14 }}>
          <div>
            <p style={{ fontSize:12, fontWeight:400, color:'#9CA3AF' }}>Organizer Panel</p>
            <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.025em', color:'#111827' }}>Your Events</h1>
          </div>
          <Link to="/events/create">
            <button style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 22px', borderRadius:'9999px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', border:'none', fontSize:13, fontWeight:500, cursor:'pointer' }}>
              + Create Event
            </button>
          </Link>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          {statItems.map((s,i) => (
            <div key={i} style={{ background:'#fff', border:'1.5px solid var(--da-border)', borderRadius:14, padding:'18px 20px', position:'relative', overflow:'hidden', boxShadow:'0 2px 10px rgba(91,110,245,0.05)' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:STAT_COLORS[i], borderRadius:'9999px 9999px 0 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
                <span style={{ width:28, height:28, borderRadius:8, background:'rgba(91,110,245,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</span>
              </div>
              <p style={{ fontSize:26, fontWeight:700, color:'#111827', letterSpacing:'-0.02em', lineHeight:1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', border:'1.5px solid var(--da-border)', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(91,110,245,0.06)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'0.8px solid #F3F4F6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#111827' }}>Your Events</span>
          </div>
          {events.length === 0 ? (
            <div style={{ padding:'48px 24px', textAlign:'center' }}>
<div style={{width:52,height:52,background:"var(--da-ink-05)",borderRadius:"var(--r-xl)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Calendar size={24} color="#5B6EF5" /></div>
              <h3 style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:8 }}>No events yet</h3>
              <p style={{ fontSize:13, fontWeight:400, color:'#6B7280', marginBottom:20 }}>Create your first event and start building your community.</p>
              <Link to="/events/create">
                <button style={{ padding:'10px 22px', borderRadius:'9999px', background:'linear-gradient(135deg,var(--da-blue),var(--da-violet))', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', border:'none' }}>Create Event</button>
              </Link>
            </div>
          ) : events.map((ev, i) => (
            <div key={ev._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 20px', borderBottom: i < events.length-1 ? '1px solid var(--da-border-sub)':'none', transition:'background 150ms ease' }}
              onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:42, height:42, borderRadius:10, background:'var(--da-ink-05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {ev.banner ? <img src={ev.banner} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} /> : <Calendar size={20} color="#5B6EF5"/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:500, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</p>
                <p style={{ fontSize:11, fontWeight:400, color:'#9CA3AF', marginTop:2 }}>
                  {ev.registeredCount || 0} registered · {ev.category} · {ev.mode}
                </p>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <span style={{ padding:'3px 10px', borderRadius:'9999px', fontSize:11, fontWeight:500,
                  background: ev.status === 'published' ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)',
                  color:      ev.status === 'published' ? '#059669' : '#D97706',
                  border:     `0.8px solid ${ev.status === 'published' ? 'rgba(5,150,105,0.2)' : 'rgba(217,119,6,0.2)'}`,
                }}>
                  {ev.status || 'draft'}
                </span>
                <Link to={`/events/${ev._id}/edit`}>
                  <button style={{ padding:'4px 12px', borderRadius:'9999px', border:'1.5px solid var(--da-border)', background:'#fff', fontSize:11, fontWeight:400, cursor:'pointer', color:'#374151' }}>Edit</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="repeat(4,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  );
};
export const TeamPage       = () => { const { teamId } = useParams(); return <div style={{ padding:48, textAlign:'center', color:'#6B7280' }}><h2 style={{ color:'#111827', marginBottom:8 }}>Team Page</h2><p>Team ID: {teamId}</p></div>; };

export default Leaderboard;
