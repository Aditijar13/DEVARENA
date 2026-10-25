'use strict';
const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[email] SMTP not configured — skipping email to', to);
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'DevArena <noreply@devarena.dev>',
      to, subject, html, text,
    });
    return true;
  } catch (err) {
    console.error('[email] send failed:', err.message);
    return false;
  }
};

const baseTemplate = (content, title = 'DevArena') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F4F4FF; color: #111827; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(91,110,245,0.12); }
    .header  { background: linear-gradient(135deg, #5B6EF5 0%, #7C3AED 100%); padding: 28px 32px; }
    .logo    { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.03em; }
    .logo span { opacity: 0.75; }
    .body    { padding: 32px; }
    .footer  { padding: 20px 32px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF; text-align: center; }
    .btn     { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #5B6EF5, #7C3AED); color: #fff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 14px; margin: 20px 0; }
    h2       { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #111827; }
    p        { font-size: 14px; line-height: 1.7; color: #374151; margin-bottom: 12px; }
    .badge   { display: inline-block; padding: 4px 12px; background: rgba(91,110,245,0.08); border: 1px solid rgba(91,110,245,0.18); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #5B6EF5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Dev<span>Arena</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>You received this email as a registered member of DevArena.</p>
      <p>DevArena &mdash; Built for developers, by developers.</p>
    </div>
  </div>
</body>
</html>`;

const sendWelcomeEmail = async (user) => {
  const content = `
    <h2>Welcome to DevArena, ${user.name.split(' ')[0]}!</h2>
    <p>Your account has been created. You now have access to hackathons, workshops, and developer events happening around the world.</p>
    <p>Verify your email address to unlock your full profile and start earning points.</p>
    <a href="${process.env.CLIENT_URL}/verify-email?token=${user.emailVerificationToken}" class="btn">Verify Email Address</a>
    <p style="font-size:12px;color:#9CA3AF;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
  `;
  return sendEmail({
    to:      user.email,
    subject: 'Welcome to DevArena — Verify Your Email',
    html:    baseTemplate(content, 'Welcome to DevArena'),
  });
};

const sendEventRegistrationEmail = async (user, event) => {
  const content = `
    <h2>Registration Confirmed</h2>
    <p>Hi ${user.name.split(' ')[0]},</p>
    <p>You are registered for <strong>${event.title}</strong>.</p>
    <p>
      <span class="badge">${event.category}</span>&nbsp;
      <span class="badge">${event.mode}</span>
    </p>
    <p><strong>Date:</strong> ${new Date(event.startDate).toDateString()}</p>
    ${event.mode === 'online' ? '' : `<p><strong>Location:</strong> ${event.location?.city}, ${event.location?.state}</p>`}
    <a href="${process.env.CLIENT_URL}/events/${event.slug}" class="btn">View Event</a>
    <p style="font-size:12px;color:#9CA3AF;">Add the event to your calendar so you do not miss it.</p>
  `;
  return sendEmail({
    to:      user.email,
    subject: `Registration Confirmed: ${event.title}`,
    html:    baseTemplate(content, 'Registration Confirmed'),
  });
};

const sendCertificateEmail = async (user, event, certificateUrl) => {
  const content = `
    <h2>Your Certificate is Ready</h2>
    <p>Hi ${user.name.split(' ')[0]},</p>
    <p>Congratulations on completing <strong>${event.title}</strong>. Your verified certificate is ready to download.</p>
    <a href="${certificateUrl}" class="btn">Download Certificate</a>
    <p>Share your achievement on LinkedIn and other platforms to showcase your skills.</p>
  `;
  return sendEmail({
    to:      user.email,
    subject: `Certificate: ${event.title}`,
    html:    baseTemplate(content, 'Your Certificate'),
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${user.name.split(' ')[0]},</p>
    <p>We received a request to reset the password for your DevArena account.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="font-size:12px;color:#9CA3AF;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
  `;
  return sendEmail({
    to:      user.email,
    subject: 'Reset Your DevArena Password',
    html:    baseTemplate(content, 'Password Reset'),
  });
};


// Alias for compatibility — sends the same welcome+verify email
const sendVerificationEmail = sendWelcomeEmail;

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendEventRegistrationEmail,
  sendCertificateEmail,
  sendPasswordResetEmail,
};
