import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCheck, Trash2, Bell, CheckCircle, XCircle,
  Clock, Users, Calendar, FileText, Award,
  MessageSquare, CreditCard, AlertCircle, Info
} from 'lucide-react';
import { setNotifications, markAllRead, removeNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import { timeAgo } from '../../utils/helpers';

/* Map notification type → Lucide icon + colour */
const TYPE_META = {
  registration_approved:  { icon: <CheckCircle  size={14} />, color: '#059669' },
  registration_rejected:  { icon: <XCircle      size={14} />, color: '#DC2626' },
  registration_pending:   { icon: <Clock        size={14} />, color: '#D97706' },
  team_invite:            { icon: <Users        size={14} />, color: '#5B6EF5' },
  team_join_request:      { icon: <Users        size={14} />, color: '#7C3AED' },
  team_invite_accepted:   { icon: <CheckCircle  size={14} />, color: '#059669' },
  event_reminder:         { icon: <Calendar     size={14} />, color: '#D97706' },
  event_update:           { icon: <Info         size={14} />, color: '#5B6EF5' },
  event_cancelled:        { icon: <XCircle      size={14} />, color: '#DC2626' },
  announcement:           { icon: <Bell         size={14} />, color: '#7C3AED' },
  certificate_issued:     { icon: <FileText     size={14} />, color: '#D97706' },
  badge_awarded:          { icon: <Award        size={14} />, color: '#7C3AED' },
  comment_reply:          { icon: <MessageSquare size={14} />, color: '#6B7280' },
  payment_success:        { icon: <CreditCard   size={14} />, color: '#059669' },
  system:                 { icon: <AlertCircle  size={14} />, color: '#6B7280' },
};

const NotificationDropdown = ({ onClose }) => {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector(s => s.notifications);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/notifications?limit=15');
        dispatch(setNotifications({ notifications: data.notifications, unreadCount: data.unreadCount }));
      } catch {}
    })();
  }, [dispatch]);

  const handleMarkAll = async () => {
    try { await api.put('/notifications/read', { all: true }); dispatch(markAllRead()); } catch {}
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    try { await api.delete(`/notifications/${id}`); dispatch(removeNotification(id)); } catch {}
  };

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      background: '#FFF', border: '1px solid rgba(91,110,245,0.10)',
      borderRadius: 16, width: 340, maxHeight: 460,
      boxShadow: '0 8px 32px rgba(91,110,245,0.14), 0 2px 8px rgba(0,0,0,0.06)',
      animation: 'fadeDown 150ms ease', overflow: 'hidden', zIndex: 200,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgba(91,110,245,0.08)', background: 'rgba(91,110,245,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              padding: '1px 7px', borderRadius: '9999px',
              background: '#5B6EF5', color: '#FFF', fontSize: 10, fontWeight: 600,
            }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 400, color: '#5B6EF5',
            cursor: 'pointer', background: 'none', border: 'none',
            fontFamily: 'inherit',
          }}>
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', maxHeight: 380 }}>
        {items.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '9999px',
              background: 'rgba(91,110,245,0.07)', border: '1px solid rgba(91,110,245,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#9CA3AF',
            }}>
              <Bell size={18} strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 400, color: '#6B7280' }}>All caught up!</p>
          </div>
        ) : items.map(n => {
          const meta = TYPE_META[n.type] || { icon: <Bell size={14} />, color: '#6B7280' };
          return (
            <Link key={n._id} to={n.link || '#'} onClick={onClose} style={{
              display: 'flex', gap: 11, padding: '11px 14px',
              borderBottom: '1px solid rgba(91,110,245,0.06)',
              background: n.isRead ? 'transparent' : 'rgba(38,64,217,0.02)',
              textDecoration: 'none', position: 'relative',
              transition: 'background 150ms ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(38,64,217,0.02)'}>

              {!n.isRead && (
                <div style={{
                  position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)',
                  width: 5, height: 5, borderRadius: '9999px', background: '#5B6EF5',
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: '9999px', flexShrink: 0,
                background: `${meta.color}12`, border: `0.8px solid ${meta.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: meta.color, marginTop: 1,
              }}>
                {meta.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: '#111827', lineHeight: '18px' }}>
                  {n.title}
                </p>
                <p style={{ fontSize: 11, fontWeight: 400, color: '#6B7280', marginTop: 2, lineHeight: '16px' }}>
                  {n.message}
                </p>
                <p style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginTop: 4 }}>
                  {timeAgo(n.createdAt)}
                </p>
              </div>

              <button onClick={e => handleDelete(e, n._id)} style={{
                color: '#D1D5DB', padding: 4, borderRadius: '9999px',
                flexShrink: 0, alignSelf: 'flex-start',
                cursor: 'pointer', background: 'none', border: 'none',
                opacity: 0, transition: 'opacity 150ms ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#DC2626'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = '#D1D5DB'; }}>
                <Trash2 size={11} />
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationDropdown;
