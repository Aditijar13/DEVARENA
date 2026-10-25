import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { Shield, Search, Users, Calendar, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { formatDate, timeAgo } from '../utils/helpers';
import { Spinner, StatCard, EmptyState, Modal } from '../components/common/index';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#06b6d4','#8b5cf6','#ec4899','#84cc16'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [banModal, setBanModal] = useState({ open: false, user: null });
  const [banReason, setBanReason] = useState('');

  useEffect(() => { fetchStats(); fetchUsers(); fetchReports(); }, []);

  const fetchStats = async () => {
    try { const { data } = await api.get('/admin/stats'); setStats(data.stats); }
    catch {} finally { setLoading(false); }
  };

  const fetchUsers = async (search='', role='') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role) params.append('role', role);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
    } catch {}
  };

  const fetchReports = async () => {
    try { const { data } = await api.get('/admin/reports'); setReports(data.reports || []); }
    catch {}
  };

  const handleBanUser = async () => {
    try {
      await api.put(`/admin/users/${banModal.user._id}/ban`, { ban: !banModal.user.isBanned, reason: banReason });
      toast.success(`User ${banModal.user.isBanned ? 'unbanned' : 'banned'}`);
      setBanModal({ open: false, user: null });
      setBanReason('');
      fetchUsers(userSearch, userRole);
    } catch { toast.error('Action failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try { await api.put(`/admin/users/${userId}/role`, { role }); toast.success('Role updated!'); fetchUsers(userSearch, userRole); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh' }}><Spinner size={32} /></div>;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', padding:'32px 0' }}>
      <div className="page-container">
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#f43f5e,#f97316)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800 }}>Admin Dashboard</h1>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>Platform management & moderation</p>
          </div>
        </div>

        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            <StatCard icon={<Users size={18} color="#6366f1" />} label="Total Users" value={stats.totalUsers?.toLocaleString()} color="var(--accent-primary)" />
            <StatCard icon={<Calendar size={18} color="#10b981" />} label="Active Events" value={stats.activeEvents?.toLocaleString()} color="var(--accent-emerald)" />
            <StatCard icon={<CheckCircle2 size={18} color="#06b6d4" />} label="Completed" value={stats.completedEvents?.toLocaleString()} color="var(--accent-cyan)" />
            <StatCard icon={<AlertTriangle size={18} color="#f43f5e" />} label="Pending Reports" value={stats.pendingReports || 0} color="var(--accent-rose)" />
          </div>
        )}

        <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-secondary)', padding:4, borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', width:'fit-content' }}>
          {['overview','users','reports'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding:'8px 20px', borderRadius:'var(--radius-md)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all var(--transition)', background:activeTab===tab ? 'var(--accent-primary)':'transparent', color:activeTab===tab ? 'white':'var(--text-secondary)', textTransform:'capitalize' }}>{tab}</button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                <TrendingUp size={16} color="#6366f1" /> New Users (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#16161f', border:'1px solid #1e1e2e', borderRadius:10, fontSize:12 }} />
                  <Bar dataKey="users" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={16} color="#10b981" /> Events by Category
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.categoryDistribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="_id">
                    {(stats.categoryDistribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#16161f', border:'1px solid #1e1e2e', borderRadius:10, fontSize:12 }} formatter={(val, name, props) => [val, props.payload._id]} />
                  <Legend iconSize={10} iconType="circle" formatter={(v) => <span style={{ fontSize:11, color:'#94a3b8', textTransform:'capitalize' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:16 }}>
              <div style={{ position:'relative', flex:1 }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input value={userSearch} onChange={e => { setUserSearch(e.target.value); fetchUsers(e.target.value, userRole); }} placeholder="Search by name or email..." style={{ paddingLeft:36, height:40 }} />
              </div>
              <select value={userRole} onChange={e => { setUserRole(e.target.value); fetchUsers(userSearch, e.target.value); }} style={{ width:'auto', height:40, padding:'0 28px 0 12px', fontSize:13, borderRadius:'var(--radius-md)', background:'var(--bg-tertiary)', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 8px center' }}>
                <option value="">All Roles</option>
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
              <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg-tertiary)' }}>
                <h3 style={{ fontSize:14, fontWeight:700 }}>Users ({users.length})</h3>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg-tertiary)' }}>
                      {['User','Role','Status','Points','Joined','Actions'].map(h => (
                        <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No users found</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id} style={{ borderBottom:'1px solid var(--border-subtle)', transition:'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            {u.avatar ? <img src={u.avatar} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} /> :
                              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gradient-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white' }}>{u.name?.[0]}</div>}
                            <div>
                              <p style={{ fontSize:13, fontWeight:600 }}>{u.name}</p>
                              <p style={{ fontSize:11, color:'var(--text-muted)' }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                            style={{ width:'auto', padding:'4px 22px 4px 10px', fontSize:12, height:28, borderRadius:6, background:'var(--bg-tertiary)', appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 4px center' }}>
                            <option value="participant">Participant</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          {u.isBanned ? <span className="badge badge-danger">Banned</span> : u.isVerified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-muted">Unverified</span>}
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color:'var(--accent-amber)' }}> {u.points || 0}</td>
                        <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            <Link to={`/user/${u._id}`} style={{ padding:'5px 10px', borderRadius:6, background:'var(--bg-tertiary)', border:'1px solid var(--border)', fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>View</Link>
                            <button onClick={() => setBanModal({ open:true, user:u })} style={{ padding:'5px 10px', borderRadius:6, background:u.isBanned ? 'rgba(16,185,129,0.1)':'rgba(244,63,94,0.1)', border:`1px solid ${u.isBanned ? 'rgba(16,185,129,0.25)':'rgba(244,63,94,0.25)'}`, fontSize:12, color:u.isBanned ? 'var(--accent-emerald)':'var(--accent-rose)', fontWeight:600, cursor:'pointer' }}>
                              {u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          reports.length === 0 ? <EmptyState icon="" title="No pending reports" description="All reports have been reviewed." /> :
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {reports.map(r => (
              <div key={r._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:20 }}>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span className={`badge badge-${r.status==='pending' ? 'warning':'muted'}`}>{r.status}</span>
                  <span className="badge badge-danger">{r.reason}</span>
                  <span className="badge badge-muted">{r.targetType}</span>
                </div>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:8 }}>{r.description || 'No description'}</p>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>By: <strong style={{ color:'var(--text-primary)' }}>{r.reporter?.name}</strong> · {timeAgo(r.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={banModal.open} onClose={() => setBanModal({ open:false, user:null })} title={banModal.user?.isBanned ? 'Unban User' : 'Ban User'}
        footer={<>
          <button onClick={() => setBanModal({ open:false, user:null })} style={{ padding:'9px 18px', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)', background:'transparent', cursor:'pointer' }}>Cancel</button>
          <button onClick={handleBanUser} style={{ padding:'9px 20px', borderRadius:'var(--radius-md)', background:banModal.user?.isBanned ? 'linear-gradient(135deg,#10b981,#06b6d4)':'linear-gradient(135deg,#f43f5e,#f97316)', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {banModal.user?.isBanned ? 'Unban User' : 'Confirm Ban'}
          </button>
        </>}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Action on: <strong style={{ color:'var(--text-primary)' }}>{banModal.user?.name}</strong> ({banModal.user?.email})</p>
          {!banModal.user?.isBanned && (
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text-secondary)', marginBottom:6 }}>Reason for Ban</label>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason..." rows={3} style={{ resize:'none' }} />
            </div>
          )}
        </div>
      </Modal>

      <style>{`@media (max-width: 1024px) { div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; } div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
};

export default AdminDashboard;
