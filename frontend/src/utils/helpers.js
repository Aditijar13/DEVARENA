import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  if (!date) return 'TBA';
  return format(new Date(date), fmt);
};

export const formatDateTime = (date) => {
  if (!date) return 'TBA';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const daysUntil = (date) => {
  if (!date) return 0;
  const diff = differenceInDays(new Date(date), new Date());
  return Math.max(0, diff);
};

export const isEventLive = (startDate, endDate) => {
  const now = new Date();
  return now >= new Date(startDate) && now <= new Date(endDate);
};

export const getEventStatus = (event) => {
  const now = new Date();
  if (event.status === 'cancelled') return { label: 'Cancelled', color: 'danger' };
  if (now < new Date(event.startDate)) {
    if (now > new Date(event.registrationDeadline)) return { label: 'Reg. Closed', color: 'warning' };
    return { label: 'Upcoming', color: 'primary' };
  }
  if (now >= new Date(event.startDate) && now <= new Date(event.endDate)) {
    return { label: 'Live Now', color: 'success' };
  }
  return { label: 'Completed', color: 'muted' };
};

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
};

export const truncate = (str, length = 150) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const getCategoryIcon = (category) => {
  const icons = {
    hackathon: 'HK',
    workshop: 'WS',
    webinar: 'WB',
    conference: 'CF',
    competition: 'CP',
    seminar: 'SM',
    meetup: 'MT',
    bootcamp: 'BC',
    startup: 'ST',
    cultural: 'CL',
    gaming: 'GM',
    'open-source': 'OS',
    networking: 'NW',
    other: 'EV',
  };
  return icons[category] || 'EV';
};

export const getCategoryColor = (category) => {
  const colors = {
    hackathon: '#6366f1',
    workshop: '#10b981',
    webinar: '#06b6d4',
    conference: '#f59e0b',
    competition: '#f43f5e',
    seminar: '#8b5cf6',
    meetup: '#ec4899',
    bootcamp: '#ef4444',
    startup: '#84cc16',
    cultural: '#f97316',
    gaming: '#a855f7',
    'open-source': '#22c55e',
    networking: '#14b8a6',
    other: '#64748b',
  };
  return colors[category] || '#64748b';
};

export const getLevelInfo = (points) => {
  const level = Math.floor(Math.sqrt(points / 100)) + 1;
  const currentLevelPoints = Math.pow(level - 1, 2) * 100;
  const nextLevelPoints = Math.pow(level, 2) * 100;
  const progress = Math.round(((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100);
  const titles = ['', 'Beginner', 'Beginner', 'Explorer', 'Explorer', 'Contributor', 'Contributor',
    'Champion', 'Champion', 'Elite', 'Elite', 'Legend'];
  return { level, progress: Math.min(progress, 100), nextLevelPoints, pointsToNextLevel: nextLevelPoints - points, title: titles[Math.min(level, 11)] || 'Legend' };
};

export const getModeIcon = (mode) => {
  const icons = { online: 'Online', offline: 'Offline', hybrid: 'Hybrid' };
  return icons[mode] || 'Online';
};

export const getRegistrationStatusColor = (status) => {
  const colors = { approved: 'success', pending: 'warning', rejected: 'danger', waitlisted: 'info' };
  return colors[status] || 'muted';
};

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const generateAvatar = (name) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DA';
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;
  return { initials, color: colors[colorIndex] };
};

export const shareEvent = async (event) => {
  const url = `${window.location.origin}/events/${event.slug}`;
  if (navigator.share) {
    await navigator.share({ title: event.title, text: event.shortDescription, url });
  } else {
    await navigator.clipboard.writeText(url);
    return 'Link copied to clipboard!';
  }
};
