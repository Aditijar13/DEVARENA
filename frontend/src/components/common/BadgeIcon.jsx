import React from 'react';
import {
  Trophy, Award, Medal, Star, Shield, ShieldCheck, Zap,
  Flame, TrendingUp, Cpu, Gem, Layout, Users, GitBranch,
  BookOpen, Footprints, Calendar, Globe, FileText, Code2,
  CheckCircle, Sparkles, Check
} from 'lucide-react';

/* ─── Icon Map for Badges ─── */
const ICON_MAP = {
  // Common badge icons
  'star': Star,
  'shield-check': ShieldCheck,
  'shield': Shield,
  'footprints': Footprints,
  'calendar': Calendar,
  'zap': Zap,
  'trophy': Trophy,
  'layout': Layout,
  'users': Users,
  'git-branch': GitBranch,
  'book-open': BookOpen,
  'trending-up': TrendingUp,
  'award': Award,
  'medal': Medal,
  'cpu': Cpu,
  'diamond': Gem,
  'gem': Gem,
  'file-text': FileText,
  'globe': Globe,
  'flame': Flame,
  'code': Code2,
  'check': CheckCircle,
  'sparkles': Sparkles,

  // Alias lookups based on badge names
  'Welcome to DevArena': Star,
  'Verified Dev': ShieldCheck,
  'First Step': Footprints,
  'Event Explorer': Calendar,
  'Hackathon Enthusiast': Zap,
  'Marathon Hacker': Trophy,
  'Event Organizer': Layout,
  'Community Builder': Users,
  'Team Player': Users,
  'Open Source Hero': GitBranch,
  'Mentor': BookOpen,
  'Rising Star': TrendingUp,
  'Dev Champion': Award,
  'Elite Developer': Cpu,
  'Legend': Gem,
  'Certificate Collector': FileText,
  'Networking Pro': Globe,
  'Hackathon Winner': Trophy,
  'Streak Master': Flame,
  'Platform Admin': Shield,
  'Code Starter': Code2,
  'Arena Legend': Trophy,
  'Collaborator': Users,
  'Bookmarker': Star,
  'Profile Pro': CheckCircle,
  'Arena Master': Trophy,
  'Top Performer': Flame,
};

/* ── Category Color System ── */
const CAT_STYLES = {
  participation: {
    color: '#5B6EF5',
    bg: 'rgba(91,110,245,0.08)',
    border: 'rgba(91,110,245,0.22)',
    grad: 'linear-gradient(135deg, #5B6EF5, #7C3AED)',
  },
  achievement: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.09)',
    border: 'rgba(245,158,11,0.24)',
    grad: 'linear-gradient(135deg, #F59E0B, #D97706)',
  },
  contribution: {
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)',
    grad: 'linear-gradient(135deg, #10B981, #059669)',
  },
  special: {
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.08)',
    border: 'rgba(236,72,153,0.22)',
    grad: 'linear-gradient(135deg, #EC4899, #7C3AED)',
  },
  milestone: {
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.22)',
    grad: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
  },
};

/* ─── BadgeIcon Component ─── */
export const BadgeIcon = ({ name, icon, size = 16, color }) => {
  // Resolve component
  const Comp = (icon && ICON_MAP[icon]) || (name && ICON_MAP[name]) || Award;
  return <Comp size={size} color={color} strokeWidth={2} />;
};

/* ─── DevBadge Chip Component ─── */
export const DevBadge = ({ badge, size = 'sm', showName = true }) => {
  if (!badge) return null;
  const cat = badge.category || 'participation';
  const style = CAT_STYLES[cat] || CAT_STYLES.participation;
  const isSm = size === 'sm';

  return (
    <span
      className="dev-badge-chip"
      title={`${badge.name}${badge.description ? ` — ${badge.description}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 5 : 7,
        padding: isSm ? '2px 8px' : '4px 12px',
        borderRadius: 9999,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: isSm ? 11 : 12,
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
        transition: 'all 160ms ease',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isSm ? 16 : 20,
          height: isSm ? 16 : 20,
          borderRadius: '50%',
          background: style.grad,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <BadgeIcon name={badge.name} icon={badge.icon} size={isSm ? 10 : 12} color="#fff" />
      </span>
      {showName && <span>{badge.name}</span>}
    </span>
  );
};

/* ─── RankMedal for Leaderboard ─── */
export const RankMedal = ({ rank, size = 22 }) => {
  if (rank === 1) {
    return (
      <div
        title="1st Place (Gold)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
          color: '#78350F',
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
          border: '1.5px solid #FCD34D',
        }}
      >
        <Trophy size={16} strokeWidth={2.4} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        title="2nd Place (Silver)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #E2E8F0, #94A3B8)',
          color: '#1E293B',
          boxShadow: '0 2px 8px rgba(148,163,184,0.3)',
          border: '1.5px solid #CBD5E1',
        }}
      >
        <Medal size={16} strokeWidth={2.4} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        title="3rd Place (Bronze)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FDBA74, #B45309)',
          color: '#451A03',
          boxShadow: '0 2px 8px rgba(180,83,9,0.25)',
          border: '1.5px solid #FDBA74',
        }}
      >
        <Medal size={16} strokeWidth={2.4} />
      </div>
    );
  }
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: rank <= 10 ? 700 : 500,
        color: rank <= 10 ? '#5B6EF5' : '#9CA3AF',
      }}
    >
      #{rank}
    </span>
  );
};

/* ─── PrizeBadge for Event Details ─── */
export const PrizeBadge = ({ index = 0, position = '' }) => {
  const is1st = index === 0 || /1st|first|grand|winner/i.test(position);
  const is2nd = index === 1 || /2nd|second|runner/i.test(position);
  const is3rd = index === 2 || /3rd|third/i.test(position);

  if (is1st) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          border: '1.5px solid #F59E0B',
          color: '#B45309',
          boxShadow: '0 4px 14px rgba(245,158,11,0.2)',
          margin: '0 auto 12px',
        }}
      >
        <Trophy size={24} strokeWidth={2.2} />
      </div>
    );
  }

  if (is2nd) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)',
          border: '1.5px solid #94A3B8',
          color: '#475569',
          boxShadow: '0 4px 14px rgba(148,163,184,0.18)',
          margin: '0 auto 12px',
        }}
      >
        <Medal size={24} strokeWidth={2.2} />
      </div>
    );
  }

  if (is3rd) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #FFEDD5, #FED7AA)',
          border: '1.5px solid #F97316',
          color: '#9A3412',
          boxShadow: '0 4px 14px rgba(249,115,22,0.18)',
          margin: '0 auto 12px',
        }}
      >
        <Medal size={24} strokeWidth={2.2} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 14,
        background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
        border: '1.5px solid #6366F1',
        color: '#4338CA',
        boxShadow: '0 4px 14px rgba(99,102,241,0.18)',
        margin: '0 auto 12px',
      }}
    >
      <Award size={24} strokeWidth={2.2} />
    </div>
  );
};

export default BadgeIcon;
