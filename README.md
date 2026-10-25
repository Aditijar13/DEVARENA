# ⚔️ DevArena — Developer Event Platform

![DevArena](https://img.shields.io/badge/DevArena-MERN%20Stack-111827?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge)

> Discover hackathons, workshops, and competitions. Build teams, earn certificates, and climb the leaderboard.

**Live Demo:** [devarena.onrender.com](#) &nbsp;·&nbsp; **Design:** Studio Spatial Interfaces

---

## 🚀 Deploy to Render (Single Service)

DevArena runs as **one service** on Render — Express serves both the API and the built React app.

### Step 1 — Fork & connect

1. Fork this repo on GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo

### Step 2 — Configure the service

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm run render:build` |
| **Start Command** | `npm start` |
| **Root Directory** | *(leave blank)* |

### Step 3 — Add environment variables

In Render → **Environment**, add:

```
NODE_ENV          = production
MONGODB_URI       = mongodb+srv://...   ← from MongoDB Atlas (free)
JWT_SECRET        = (auto-generate in Render)
JWT_REFRESH_SECRET= (auto-generate in Render)
CLIENT_URL        = https://your-app.onrender.com
SERVER_URL        = https://your-app.onrender.com
CLOUDINARY_CLOUD_NAME = ...
CLOUDINARY_API_KEY    = ...
CLOUDINARY_API_SECRET = ...
SMTP_HOST         = smtp.gmail.com
SMTP_PORT         = 587
SMTP_USER         = your@gmail.com
SMTP_PASS         = your_gmail_app_password
GOOGLE_CLIENT_ID  = ...  (optional)
GOOGLE_CLIENT_SECRET = ... (optional)
```

### Step 4 — Deploy

Click **Create Web Service**. Render builds the React app, installs backend deps, and starts Express. Done! ✅

> **Free tier note:** Render free services spin down after 15 min of inactivity. First request after sleep takes ~30s. Upgrade to Starter ($7/mo) for always-on.

---

## 💻 Local Development

```bash
# 1. Clone
git clone https://github.com/you/devarena.git && cd devarena

# 2. Install all dependencies
npm run install:all

# 3. Configure backend
cp .env.example backend/.env
# Fill in your MongoDB URI, JWT secrets, etc.

# 4. Seed database with sample data
npm run seed

# 5. Start both servers
npm run dev
# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
```

**Test accounts (after seed):**
| Role | Email | Password |
|---|---|---|
| Admin | admin@devarena.dev | Admin@123 |
| Organizer | organizer@devarena.dev | Organizer@123 |
| User | arjun@devarena.dev | User@123 |

---

## 🏗️ Architecture

```
devarena/                     ← single repo, one Render service
├── frontend/                 ← React 18 app
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx          Studio glass navbar
│   │   │   │   ├── WebGLBackground.jsx Three.js dot-matrix field
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── index.jsx           Button, Modal, Spinner, etc.
│   │   │   ├── events/
│   │   │   │   └── EventCard.jsx       Gradient border shell card
│   │   │   └── dashboard/
│   │   │       └── NotificationDropdown.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx             Hero + WebGL + categories
│   │   │   ├── Login.jsx               Login + Register (dark panel)
│   │   │   ├── Explore.jsx             Filter/search/AI picks
│   │   │   ├── EventDetails.jsx        Full event + registration
│   │   │   ├── CreateEvent.jsx         Multi-step wizard
│   │   │   ├── UserDashboard.jsx       XP bar, stats, badges
│   │   │   ├── AdminDashboard.jsx      Charts, user management
│   │   │   └── allPages.jsx            Leaderboard, Chat, Profile…
│   │   ├── store/                      Redux Toolkit
│   │   ├── context/SocketContext.jsx   Socket.io provider
│   │   └── utils/                      API client, helpers
│   └── package.json
│
├── backend/                  ← Express + Socket.io + MongoDB
│   ├── models/               User, Event, Team, Chat, Supplementary
│   ├── controllers/          Auth, Event, Team, User, Chat, Admin
│   ├── routes/               12 route files
│   ├── socket/               Real-time handlers
│   ├── utils/                AI engine, gamification, email, PDF certs
│   └── server.js             Serves API + React build in prod
│
├── render.yaml               Render deployment config
├── package.json              Root scripts: dev, build, start, seed
└── .env.example              Required environment variables
```

---

## ✨ Features

### 🤖 AI Recommendation Engine
Custom 6-factor scoring: skill match × 40% + category history × 25% + location × 10% + popularity × 10% + urgency × 5% + price × 5%.

### 🎓 PDF Certificates
PDFKit + QRCode. Each certificate has a unique ID, QR code, and a public verification URL. Emails sent via Nodemailer.

### 💬 Real-time Chat
Socket.io rooms for direct messages and team chats. Typing indicators, message reactions, read receipts.

### 🏆 Gamification
Points, levels (√ formula), 12+ badges, leaderboard. Badges auto-awarded on actions.

### 🎨 Studio Design System
- **WebGL background** — Three.js dot-matrix particle field, ShaderMaterial, breathing pulse, pointer drift
- **Glass surfaces** — backdrop-filter: blur(12px), gradient border shell
- **Typography** — System font, weight 200/300/500/600, -0.025em tracking
- **Pill shapes** — 9999px radius on all interactive elements
- **Motion** — 150ms/300ms, cubic-bezier(0.4,0,0.2,1)

---

## 📋 Resume Highlights

| Skill | Implementation |
|---|---|
| Full-Stack MERN | Express API + React 18 SPA, single Render deployment |
| Authentication | JWT access/refresh tokens + Google OAuth (Passport.js) |
| Real-time | Socket.io — chat, notifications, typing, online presence |
| AI/ML | Custom recommendation engine with weighted scoring |
| WebGL/3D | Three.js ShaderMaterial dot-matrix particle field |
| File uploads | Cloudinary via Multer (avatars, banners, certificates) |
| PDF generation | PDFKit + QR codes + Cloudinary storage |
| Email service | Nodemailer HTML templates (welcome, certificates, reminders) |
| Payments | Stripe Checkout + webhook handler |
| State management | Redux Toolkit with async thunks and optimistic updates |
| Design system | Studio Spatial Interfaces (glass, grid, pill shapes, WebGL) |
| Database design | 8 Mongoose models with virtuals, indexes, pre-save hooks |
| Docker | docker-compose with MongoDB, Redis, backend, frontend, Nginx |

---

## 📄 License
MIT — free to use for portfolio and production projects.
