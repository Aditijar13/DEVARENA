import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createEvent } from '../store/slices/eventSlice';
import { Spinner } from '../components/common/index';
import { Upload, Plus, X, Check, ChevronRight, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'hackathon','workshop','webinar','conference','competition',
  'seminar','meetup','bootcamp','startup','cultural','gaming',
  'open-source','networking','other',
];

const STEPS = [
  { id: 0, label: 'Basic Info' },
  { id: 1, label: 'Details' },
  { id: 2, label: 'Registration' },
  { id: 3, label: 'Prizes' },
  { id: 4, label: 'Review' },
];

const EMPTY_FORM = {
  title: '', shortDescription: '', description: '',
  category: 'hackathon', mode: 'online', tags: '',
  startDate: '', endDate: '', registrationDeadline: '',
  locationVenue: '', locationCity: '', locationOnlineLink: '',
  requirements: [''], skills: [''],
  maxParticipants: '', requiresApproval: false,
  isTeamEvent: false, minTeamSize: 2, maxTeamSize: 4,
  isPaid: false, price: '',
  prizes: [{ position: '1st Place', amount: '', description: '' }],
};

const CreateEvent = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const [step,          setStep]          = useState(0);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [banner,        setBanner]        = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [errors,        setErrors]        = useState({});
  const [submitting,    setSubmitting]    = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Validation per step ──────────────────────────────── */
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.title.trim())       e.title       = 'Title is required';
      if (!form.description.trim()) e.description = 'Description is required';
      if (!form.category)           e.category    = 'Pick a category';
    }
    if (s === 1) {
      if (!form.startDate)              e.startDate              = 'Required';
      if (!form.endDate)                e.endDate                = 'Required';
      if (!form.registrationDeadline)   e.registrationDeadline   = 'Required';
      if (form.startDate && form.endDate && form.endDate < form.startDate)
        e.endDate = 'End date must be after start date';
      if (form.registrationDeadline && form.startDate && form.registrationDeadline > form.startDate)
        e.registrationDeadline = 'Deadline must be before start date';
    }
    if (s === 2 && form.isPaid && !form.price) {
      e.price = 'Enter the registration fee';
    }
    return e;
  };

  const goNext = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(p =>Math.min(4, p + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setErrors({});
    setStep(p =>Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Build FormData and submit ────────────────────────── */
  const submit = async (publish) => {
    // Validate all steps before final submit
    for (let s = 0; s <= 2; s++) {
      const e = validateStep(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }

    setSubmitting(true);
    const fd = new FormData();
    if (banner) fd.append('banner', banner);

    const payload = {
      title:                form.title.trim(),
      shortDescription:     form.shortDescription.trim(),
      description:          form.description.trim(),
      category:             form.category,
      mode:                 form.mode,
      startDate:            form.startDate,
      endDate:              form.endDate,
      registrationDeadline: form.registrationDeadline,
      maxParticipants:      parseInt(form.maxParticipants) || 0,
      requiresApproval:     form.requiresApproval,
      isTeamEvent:          form.isTeamEvent,
      minTeamSize:          parseInt(form.minTeamSize) || 2,
      maxTeamSize:          parseInt(form.maxTeamSize) || 4,
      isPaid:               form.isPaid,
      price:                parseFloat(form.price) || 0,
      isPublished:          publish,
      location: {
        venue:      form.locationVenue,
        city:       form.locationCity,
        onlineLink: form.locationOnlineLink,
      },
      requirements: form.requirements.filter(r => r.trim()),
      skills:       form.skills.filter(s => s.trim()),
      prizes:       form.prizes.filter(p => p.position.trim()),
      tags:         form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    Object.entries(payload).forEach(([k, v]) => {
      fd.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
    });

    try {
      const result = await dispatch(createEvent(fd)).unwrap();
      navigate(`/events/${result.event.slug}`);
    } catch {
      // toast shown by slice
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Helpers ──────────────────────────────────────────── */
  const handleBanner = e => {
    const file = e.target.files[0];
    if (!file) return;
    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const arrSet = (key, idx, val) =>
    set(key, form[key].map((x, i) => (i === idx ? val : x)));
  const arrAdd = key => set(key, [...form[key], key === 'prizes' ? { position: '', amount: '', description: '' } : '']);
  const arrRemove = (key, idx) => set(key, form[key].filter((_, i) => i !== idx));

  /* Shared input style (Studio: pill shape) */
  const inp = (err) => ({
    borderRadius: '9999px',
    borderColor:  err ? '#DC2626' : undefined,
    height:       40,
    fontSize:     13,
    fontWeight:   300,
  });
  const areaStyle = { borderRadius: 12, fontSize: 13, fontWeight: 200, lineHeight: '22px', resize: 'vertical' };
  const label = { fontSize: 13, fontWeight: 300, color: '#374151', display: 'block', marginBottom: 5 };
  const errMsg = msg => msg && <p style={{ fontSize: 11, fontWeight: 300, color: '#DC2626', marginTop: 3 }}>{msg}</p>;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '32px 0 80px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Page header ──────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: '#111827', marginBottom: 4 }}>Create Event</h1>
          <p style={{ fontSize: 13, fontWeight: 200, color: '#6B7280' }}>Fill in the details below — you can save as draft or publish immediately</p>
        </div>

        {/* ── Step indicator ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => { if (s.id < step) { setErrors({}); setStep(s.id); } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: '9999px', border: 'none',
                  cursor: s.id < step ? 'pointer' : 'default',
                  background:
                    s.id === step ? '#111827' :
                    s.id < step  ? 'rgba(17,24,39,0.07)' : 'transparent',
                  color:
                    s.id === step ? '#FFF' :
                    s.id < step  ? '#111827' : '#9CA3AF',
                  fontSize: 12, fontWeight: s.id === step ? 500 : 300,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 150ms ease',
                }}>
                {s.id < step
                  ? <span style={{ width: 18, height: 18, borderRadius: '9999px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}><Check size={10} color="#FFF" /></span>
                  : <span style={{ width: 18, height: 18, borderRadius: '50%', background: s.id === step ? '#5B6EF5' : 'rgba(156,163,175,0.2)', color: s.id === step ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{s.id + 1}</span>
                }
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} style={{ color: '#D1D5DB', flexShrink: 0, margin: '0 2px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Validation errors banner ──────────────────── */}
        {Object.keys(errors).length > 0 && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'rgba(220,38,38,0.05)', border: '0.8px solid rgba(220,38,38,0.2)', borderRadius: 12, marginBottom: 20 }}>
            <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 400, color: '#DC2626' }}>Please fix the following:</p>
              {Object.values(errors).map((e, i) => <p key={i} style={{ fontSize: 12, fontWeight: 200, color: '#DC2626' }}>• {e}</p>)}
            </div>
          </div>
        )}

        {/* ── Form card ────────────────────────────────── */}
        <div style={{ background: '#FFF', border: '0.8px solid #E5E7EB', borderRadius: 16, padding: '28px 28px 24px' }}>

          {/* ══ STEP 0 — Basic Info ══════════════════════ */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Basic Information</h2>

              <div>
                <label style={label}>Event Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. HackIndia 2024 – National Hackathon"
                  style={{ ...inp(errors.title), borderRadius: '9999px', height: 42, fontSize: 14 }} />
                {errMsg(errors.title)}
              </div>

              <div>
                <label style={label}>Short Description <span style={{ color: '#9CA3AF' }}>(shown on cards)</span></label>
                <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                  placeholder="1–2 sentence summary" maxLength={300}
                  style={{ ...inp(), borderRadius: '9999px', height: 40, fontSize: 13 }} />
                <p style={{ fontSize: 10, fontWeight: 200, color: '#9CA3AF', textAlign: 'right', marginTop: 3 }}>{form.shortDescription.length}/300</p>
              </div>

              <div>
                <label style={label}>Full Description *</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe the event — goals, rules, what participants will build or learn…"
                  rows={6} style={{ ...areaStyle, borderColor: errors.description ? '#DC2626' : '#E5E7EB', width: '100%', padding: '10px 14px' }} />
                {errMsg(errors.description)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={label}>Category *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    style={{ height: 40, fontSize: 13, fontWeight: 300, borderRadius: '9999px', border: '0.8px solid #E5E7EB', padding: '0 14px', width: '100%', appearance: 'none', background: '#FFF url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center', cursor: 'pointer' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Event Mode *</label>
                  <select value={form.mode} onChange={e => set('mode', e.target.value)}
                    style={{ height: 40, fontSize: 13, fontWeight: 300, borderRadius: '9999px', border: '0.8px solid #E5E7EB', padding: '0 14px', width: '100%', appearance: 'none', background: '#FFF url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center', cursor: 'pointer' }}>
                    <option value="online">Online</option>
                    <option value="offline">In-person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={label}>Tags <span style={{ color: '#9CA3AF' }}>(comma separated)</span></label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="react, node.js, ai, web3, sustainability"
                  style={{ ...inp(), borderRadius: '9999px', height: 40, fontSize: 13 }} />
              </div>

              {/* Banner upload */}
              <div>
                <label style={label}>Event Banner <span style={{ color: '#9CA3AF' }}>(recommended 1200×630)</span></label>
                <label htmlFor="banner" style={{ cursor: 'pointer', display: 'block' }}>
                  {bannerPreview ? (
                    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 180 }}>
                      <img src={bannerPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '150ms' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                        <span style={{ color: '#FFF', fontSize: 13, fontWeight: 300 }}>Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '0.8px dashed #D1D5DB', borderRadius: 12, padding: '36px 20px', textAlign: 'center', background: '#F9FAFB', transition: 'all 150ms ease' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#111827'; e.currentTarget.style.background='#F3F4F6'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#D1D5DB'; e.currentTarget.style.background='#F9FAFB'; }}>
                      <Upload size={24} style={{ color: '#9CA3AF', margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, fontWeight: 300, color: '#6B7280' }}>Click to upload banner image</p>
                      <p style={{ fontSize: 11, fontWeight: 200, color: '#9CA3AF', marginTop: 4 }}>PNG, JPG or WebP — max 10MB</p>
                    </div>
                  )}
                </label>
                <input id="banner" type="file" accept="image/*" onChange={handleBanner} style={{ display: 'none' }} />
              </div>
            </div>
          )}

          {/* ══ STEP 1 — Details ═════════════════════════ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Event Details</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {[
                  ['Start Date & Time', 'startDate', errors.startDate],
                  ['End Date & Time',   'endDate',   errors.endDate],
                  ['Registration Deadline', 'registrationDeadline', errors.registrationDeadline],
                ].map(([lbl, key, err]) => (
                  <div key={key}>
                    <label style={label}>{lbl} *</label>
                    <input type="datetime-local" value={form[key]} onChange={e => set(key, e.target.value)}
                      style={{ ...inp(err), borderRadius: 10, height: 40, fontSize: 12 }} />
                    {errMsg(err)}
                  </div>
                ))}
              </div>

              {/* Location */}
              {(form.mode === 'offline' || form.mode === 'hybrid') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={label}>Venue Name</label>
                    <input value={form.locationVenue} onChange={e => set('locationVenue', e.target.value)}
                      placeholder="e.g. IIT Delhi Campus" style={{ ...inp(), height: 40, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={label}>City</label>
                    <input value={form.locationCity} onChange={e => set('locationCity', e.target.value)}
                      placeholder="e.g. New Delhi" style={{ ...inp(), height: 40, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                </div>
              )}
              {(form.mode === 'online' || form.mode === 'hybrid') && (
                <div>
                  <label style={label}>Online Link <span style={{ color: '#9CA3AF' }}>(Zoom / Meet / Discord)</span></label>
                  <input value={form.locationOnlineLink} onChange={e => set('locationOnlineLink', e.target.value)}
                    placeholder="https://meet.google.com/..." style={{ ...inp(), height: 40, borderRadius: '9999px', fontSize: 13 }} />
                </div>
              )}

              {/* Requirements */}
              <div>
                <label style={label}>Requirements</label>
                {form.requirements.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={r} onChange={e => arrSet('requirements', i, e.target.value)}
                      placeholder={`Requirement ${i + 1}`}
                      style={{ ...inp(), flex: 1, height: 38, borderRadius: '9999px', fontSize: 13 }} />
                    {form.requirements.length > 1 && (
                      <button onClick={() => arrRemove('requirements', i)}
                        style={{ width: 36, height: 38, borderRadius: '9999px', border: '0.8px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => arrAdd('requirements')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 300, color: '#2640D9', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}>
                  <Plus size={13} />Add requirement
                </button>
              </div>

              {/* Skills */}
              <div>
                <label style={label}>Relevant Skills <span style={{ color: '#9CA3AF' }}>(what participants should know)</span></label>
                {form.skills.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={s} onChange={e => arrSet('skills', i, e.target.value)}
                      placeholder={`Skill ${i + 1} (e.g. React, Python)`}
                      style={{ ...inp(), flex: 1, height: 38, borderRadius: '9999px', fontSize: 13 }} />
                    {form.skills.length > 1 && (
                      <button onClick={() => arrRemove('skills', i)}
                        style={{ width: 36, height: 38, borderRadius: '9999px', border: '0.8px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => arrAdd('skills')}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 300, color: '#2640D9', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}>
                  <Plus size={13} />Add skill
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2 — Registration ════════════════════ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}> Registration Settings</h2>

              <div>
                <label style={label}>Max Participants <span style={{ color: '#9CA3AF' }}>(leave 0 for unlimited)</span></label>
                <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)}
                  placeholder="0 = unlimited" min="0"
                  style={{ ...inp(), height: 40, borderRadius: '9999px', fontSize: 13, maxWidth: 220 }} />
              </div>

              {/* Toggles */}
              {[
                { key: 'requiresApproval', title: 'Require Approval', desc: 'Manually review and approve/reject each registration' },
                { key: 'isTeamEvent',      title: 'Team Event',       desc: 'Participants form teams to compete together' },
                { key: 'isPaid',           title: 'Paid Event',       desc: 'Charge a registration fee from participants' },
              ].map(toggle => (
                <label key={toggle.key}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', padding: '14px 18px', background: form[toggle.key] ? 'rgba(17,24,39,0.03)' : '#F9FAFB', border: `0.8px solid ${form[toggle.key] ? '#111827' : '#E5E7EB'}`, borderRadius: 12, transition: 'all 150ms ease' }}>
                  <div style={{ position: 'relative', width: 40, height: 22, flexShrink: 0, marginTop: 2 }}>
                    <input type="checkbox" checked={form[toggle.key]} onChange={e => set(toggle.key, e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                    <div style={{ width: 40, height: 22, borderRadius: '9999px', background: form[toggle.key] ? '#5B6EF5' : '#D1D5DB', transition: 'background 150ms ease', cursor: 'pointer' }}
                      onClick={() => set(toggle.key, !form[toggle.key])}>
                      <div style={{ width: 18, height: 18, borderRadius: '9999px', background: '#FFF', position: 'absolute', top: 2, left: form[toggle.key] ? 20 : 2, transition: 'left 150ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 400, color: '#111827' }}>{toggle.title}</p>
                    <p style={{ fontSize: 12, fontWeight: 200, color: '#6B7280', marginTop: 2 }}>{toggle.desc}</p>
                  </div>
                </label>
              ))}

              {form.isPaid && (
                <div>
                  <label style={label}>Registration Fee (₹) *</label>
                  <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                    placeholder="e.g. 500" min="0"
                    style={{ ...inp(errors.price), height: 40, borderRadius: '9999px', fontSize: 14, maxWidth: 220 }} />
                  {errMsg(errors.price)}
                </div>
              )}

              {form.isTeamEvent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 360 }}>
                  <div>
                    <label style={label}>Min Team Size</label>
                    <input type="number" value={form.minTeamSize} onChange={e => set('minTeamSize', parseInt(e.target.value))}
                      min="1" max="10" style={{ ...inp(), height: 40, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={label}>Max Team Size</label>
                    <input type="number" value={form.maxTeamSize} onChange={e => set('maxTeamSize', parseInt(e.target.value))}
                      min="1" max="20" style={{ ...inp(), height: 40, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3 — Prizes ══════════════════════════ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Prizes <span style={{ fontSize: 13, fontWeight: 200, color: '#6B7280' }}>(optional)</span></h2>

              {form.prizes.map((prize, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1.5fr auto', gap: 10, alignItems: 'flex-start' }}>
                  <div>
                    {i === 0 && <label style={label}>Position</label>}
                    <input value={prize.position} onChange={e => arrSet('prizes', i, { ...prize, position: e.target.value })}
                      placeholder="e.g. 1st Place"
                      style={{ ...inp(), height: 38, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                  <div>
                    {i === 0 && <label style={label}>Amount (₹)</label>}
                    <input type="number" value={prize.amount} onChange={e => arrSet('prizes', i, { ...prize, amount: e.target.value })}
                      placeholder="e.g. 50000"
                      style={{ ...inp(), height: 38, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                  <div>
                    {i === 0 && <label style={label}>Perks / Description</label>}
                    <input value={prize.description} onChange={e => arrSet('prizes', i, { ...prize, description: e.target.value })}
                      placeholder="Mentorship, swag, internship…"
                      style={{ ...inp(), height: 38, borderRadius: '9999px', fontSize: 13 }} />
                  </div>
                  <div style={{ paddingTop: i === 0 ? 22 : 0 }}>
                    {form.prizes.length > 1 && (
                      <button onClick={() => arrRemove('prizes', i)}
                        style={{ width: 36, height: 38, borderRadius: '9999px', border: '0.8px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button onClick={() => arrAdd('prizes')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 300, color: '#2640D9', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}>
                <Plus size={13} />Add another prize
              </button>
            </div>
          )}

          {/* ══ STEP 4 — Review & Publish ════════════════ */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Review & Publish</h2>

              {/* Preview card */}
              <div style={{ border: '0.8px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                {bannerPreview && (
                  <img src={bannerPreview} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', background: 'rgba(138,102,230,0.08)', border: '0.8px solid rgba(138,102,230,0.2)', fontSize: 11, fontWeight: 400, color: '#8A66E6' }}>{form.category}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#F3F4F6', border: '0.8px solid #E5E7EB', fontSize: 11, fontWeight: 300, color: '#374151' }}>{form.mode}</span>
                    {form.isPaid
                      ? <span style={{ padding: '3px 10px', borderRadius: '9999px', background: 'rgba(217,119,6,0.08)', border: '0.8px solid rgba(217,119,6,0.2)', fontSize: 11, fontWeight: 400, color: '#D97706' }}>₹{form.price}</span>
                      : <span style={{ padding: '3px 10px', borderRadius: '9999px', background: 'rgba(5,150,105,0.08)', border: '0.8px solid rgba(5,150,105,0.2)', fontSize: 11, fontWeight: 400, color: '#059669' }}>FREE</span>
                    }
                    {form.isTeamEvent && <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#F3F4F6', border: '0.8px solid #E5E7EB', fontSize: 11, fontWeight: 300, color: '#374151' }}>Team {form.minTeamSize}–{form.maxTeamSize}</span>}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: '#111827', marginBottom: 8, letterSpacing: '-0.01em' }}>{form.title || <span style={{ color: '#9CA3AF' }}>Untitled Event</span>}</h3>
                  <p style={{ fontSize: 13, fontWeight: 200, color: '#6B7280', marginBottom: 14, lineHeight: '20px' }}>{form.shortDescription || '—'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      ['Start',    form.startDate  ? new Date(form.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'],
                      ['End',      form.endDate    ? new Date(form.endDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})   : '—'],
                      ['Deadline', form.registrationDeadline ? new Date(form.registrationDeadline).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'],
                      ['Capacity', form.maxParticipants ? form.maxParticipants + ' max' : 'Unlimited'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p style={{ fontSize: 11, fontWeight: 300, color: '#9CA3AF' }}>{k}</p>
                        <p style={{ fontSize: 13, fontWeight: 400, color: '#111827' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {form.prizes.some(p => p.position) && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.8px solid #F3F4F6' }}>
                      <p style={{ fontSize: 11, fontWeight: 300, color: '#9CA3AF', marginBottom: 6 }}>Prizes</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {form.prizes.filter(p => p.position).map((p, i) => (
                          <span key={i} style={{ fontSize: 12, fontWeight: 300, color: '#374151' }}>
                            {p.position}{p.amount ? ` — ₹${Number(p.amount).toLocaleString()}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── THE TWO BIG PUBLISH BUTTONS ──────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 300, color: '#6B7280', textAlign: 'center' }}>
                  Choose how you want to create this event:
                </p>

                {/* PRIMARY — Create & Publish Now */}
                <button
                  onClick={() => submit(true)}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '16px 28px',
                    borderRadius: '9999px',
                    background: submitting ? '#6B7280' : '#111827',
                    color: '#FFF', border: 'none',
                    fontSize: 15, fontWeight: 500,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 150ms ease',
                    boxShadow: submitting ? 'none' : 'rgba(0,0,0,0.15) 0 4px 20px 0',
                  }}
                  onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#1F2937'; }}
                  onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#111827'; }}
                >
                  {submitting ? (
                    <><Spinner size={18} color="#FFF" />Creating Event…</>
                  ) : (
                    <>Create Event &amp; Publish Now</>
                  )}
                </button>

                {/* SECONDARY — Save as Draft */}
                <button
                  onClick={() => submit(false)}
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '14px 28px',
                    borderRadius: '9999px',
                    background: 'transparent',
                    color: '#374151',
                    border: '0.8px solid #E5E7EB',
                    fontSize: 14, fontWeight: 300,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.borderColor='#111827'; e.currentTarget.style.background='rgba(17,24,39,0.03)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#E5E7EB'; e.currentTarget.style.background='transparent'; }}
                >
                  Save as Draft <span style={{ fontSize: 11, fontWeight: 200, color: '#9CA3AF' }}>(visible only to you)</span>
                </button>

                {/* Helper note */}
                <p style={{ fontSize: 11, fontWeight: 200, color: '#9CA3AF', textAlign: 'center', lineHeight: '16px' }}>
                  Drafts can be published later from your Organizer Dashboard.<br />
                  Published events are immediately visible to all users.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation (Prev / Next) — hidden on step 4 ── */}
          {step < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '0.8px solid #F3F4F6' }}>
              <button onClick={goPrev} disabled={step === 0}
                style={{ padding: '9px 20px', borderRadius: '9999px', border: '0.8px solid #E5E7EB', background: '#FFF', fontSize: 13, fontWeight: 300, color: step === 0 ? '#D1D5DB' : '#374151', cursor: step === 0 ? 'not-allowed' : 'pointer', transition: 'all 150ms ease' }}>
                ← Previous
              </button>

              <button onClick={goNext}
                style={{ padding: '9px 24px', borderRadius: '9999px', background: '#111827', color: '#FFF', border: 'none', fontSize: 13, fontWeight: 300, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 150ms ease', boxShadow: 'rgba(0,0,0,0.1) 0 0 20px 0' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1F2937'}
                onMouseLeave={e => e.currentTarget.style.background = '#111827'}>
                {step === 3 ? 'Review & Publish →' : 'Next →'}
              </button>
            </div>
          )}

          {/* ── Back button on step 4 ── */}
          {step === 4 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button onClick={goPrev}
                style={{ fontSize: 12, fontWeight: 300, color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
                ← Go back and edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
