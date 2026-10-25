# DevArena — Complete Setup Guide

> This guide walks you through **local development** and **Render cloud deployment** from zero.
> Estimated time: 30–45 minutes for first setup.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Local Development Setup](#3-local-development-setup)
4. [Environment Variables — Full Reference](#4-environment-variables--full-reference)
5. [External Services Setup](#5-external-services-setup)
   - MongoDB Atlas
   - Cloudinary
   - Google OAuth
   - Gmail SMTP
   - Stripe (optional)
6. [Seed the Database](#6-seed-the-database)
7. [Deploy on Render](#7-deploy-on-render)
8. [Test Accounts](#8-test-accounts)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18.x or higher | https://nodejs.org |
| npm | 9.x or higher | Comes with Node.js |
| Git | Any recent | https://git-scm.com |

Verify your installation:
```bash
node --version   # Should print v18.x.x or higher
npm --version    # Should print 9.x.x or higher
git --version    # Any version is fine
```

---

## 2. Project Structure

```
DevArena/
├── backend/                  # Express.js API server
│   ├── config/
│   │   ├── db.js             # MongoDB connection
│   │   ├── cloudinary.js     # Cloudinary + Multer config
│   │   └── passport.js       # JWT + Google OAuth strategies
│   ├── controllers/          # Route handler logic
│   ├── middleware/            # Auth, error handlers
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── socket/               # Socket.io event handlers
│   ├── utils/
│   │   ├── seeder.js         # Database seed script
│   │   └── logger.js         # Winston logger
│   ├── server.js             # Entry point
│   └── package.json
│
├── frontend/                 # React.js application
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Socket)
│   │   ├── pages/            # Route-level pages
│   │   ├── store/            # Redux Toolkit slices
│   │   └── utils/            # Helpers, API client
│   └── package.json
│
├── package.json              # Root scripts (dev, build, deploy)
├── render.yaml               # Render deployment config
├── SETUP_GUIDE.md            # This file
└── RENDER_DEPLOY.md          # Render-specific deployment steps
```

---

## 3. Local Development Setup

### Step 1 — Clone / Extract the project

If using Git:
```bash
git clone https://github.com/YOUR_USERNAME/devarena.git
cd devarena
```

If using the zip file:
```bash
# Extract the zip, then navigate into the folder
cd eventsphere_final
```

### Step 2 — Install all dependencies

Run this from the **root** folder (installs backend + frontend in one command):
```bash
npm run install:all
```

This runs:
- `npm install` in root
- `npm install` in `/backend`
- `npm install` in `/frontend`

### Step 3 — Create the backend environment file

```bash
cd backend
cp .env.example .env
```

Now open `backend/.env` in any text editor and fill in the values.
See **Section 4** for what each variable means and where to get it.

### Step 4 — Start the development servers

From the **root** folder:
```bash
npm run dev
```

This starts both simultaneously:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

The frontend automatically proxies API calls to the backend.

### Step 5 — Seed the database (optional but recommended)

In a new terminal, from the **root** folder:
```bash
npm run seed
```

This creates:
- Admin account: `admin@devarena.dev` / `Admin@123`
- Organizer account: `organizer@devarena.dev` / `Organizer@123`
- Sample events, badges, and test data

---

## 4. Environment Variables — Full Reference

Create the file `backend/.env` with all of the following:

```env
# ═══════════════════════════════════════════════════════
# SERVER
# ═══════════════════════════════════════════════════════

# Environment: "development" locally, "production" on Render
NODE_ENV=development

# Port the backend listens on
# Local: 5000, Render: 10000 (set automatically)
PORT=5000


# ═══════════════════════════════════════════════════════
# DATABASE — MongoDB
# ═══════════════════════════════════════════════════════

# Local MongoDB (if you have MongoDB installed locally)
MONGODB_URI=mongodb://localhost:27017/devarena

# OR MongoDB Atlas (cloud) — recommended even for local dev
# MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/devarena


# ═══════════════════════════════════════════════════════
# JWT — Authentication Tokens
# ═══════════════════════════════════════════════════════

# Secret key for signing JWT access tokens
# Must be a long random string (32+ characters)
# Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=replace_this_with_a_long_random_secret_key_minimum_32_chars

# Separate secret for refresh tokens (must be DIFFERENT from JWT_SECRET)
# Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_REFRESH_SECRET=replace_this_with_another_different_long_random_secret_key

# How long access tokens are valid
JWT_EXPIRE=30d


# ═══════════════════════════════════════════════════════
# CORS — Cross-Origin Resource Sharing
# ═══════════════════════════════════════════════════════

# The URL of your frontend
# Local:      http://localhost:3000
# Production: https://your-app-name.onrender.com
CLIENT_URL=http://localhost:3000

# The URL of your backend
# Local:      http://localhost:5000
# Production: https://your-app-name.onrender.com
SERVER_URL=http://localhost:5000


# ═══════════════════════════════════════════════════════
# CLOUDINARY — Image & File Storage
# ═══════════════════════════════════════════════════════
# Used for: profile avatars, event banners, certificates
# Get these from: https://cloudinary.com (free account)

CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here


# ═══════════════════════════════════════════════════════
# GOOGLE OAUTH — "Login with Google"
# ═══════════════════════════════════════════════════════
# Get these from: https://console.cloud.google.com
# See Section 5 for step-by-step Google setup

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# This MUST match exactly what you set in Google Console
# Local:      http://localhost:5000/api/auth/google/callback
# Production: https://your-app.onrender.com/api/auth/google/callback
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback


# ═══════════════════════════════════════════════════════
# EMAIL — Nodemailer / SMTP
# ═══════════════════════════════════════════════════════
# Used for: welcome emails, event confirmations, certificates
# Using Gmail (recommended for development):

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com

# IMPORTANT: This is NOT your Gmail password.
# You need a Gmail "App Password" — see Section 5.
SMTP_PASS=your_gmail_app_password_16_chars

# How the "From" name and email appears in sent emails
EMAIL_FROM=DevArena <your_gmail_address@gmail.com>


# ═══════════════════════════════════════════════════════
# STRIPE — Paid Event Payments (OPTIONAL)
# ═══════════════════════════════════════════════════════
# Only needed if you want to enable paid events
# Get these from: https://dashboard.stripe.com
# Leave as placeholder if not using Stripe — app works without it

STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Quick way to generate JWT secrets

Open a terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run it twice — use one output for `JWT_SECRET`, the other for `JWT_REFRESH_SECRET`.

---

## 5. External Services Setup

### 5.1 MongoDB Atlas (Free Cloud Database)

1. Go to **https://cloud.mongodb.com**
2. Click **"Try Free"** → create account
3. Choose **Free tier (M0)** → select your nearest region → **Create**
4. While it builds, go to **Security → Database Access**
   - Click **"Add New Database User"**
   - Username: `devarena_user` (or anything you like)
   - Password: create a strong password → **Save**
5. Go to **Security → Network Access**
   - Click **"Add IP Address"**
   - For development: enter your IP, or click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - For Render deployment: you **must** allow `0.0.0.0/0`
6. Go to **Databases → Connect → Drivers**
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://devarena_user:YOUR_PASSWORD@cluster0.abc12.mongodb.net/
     ```
   - Add your database name at the end:
     ```
     mongodb+srv://devarena_user:YOUR_PASSWORD@cluster0.abc12.mongodb.net/devarena
     ```
7. Paste this as your `MONGODB_URI` in `.env`

---

### 5.2 Cloudinary (Free Image Storage)

1. Go to **https://cloudinary.com** → **Sign Up Free**
2. Complete registration (email verification required)
3. On the dashboard, you'll see your credentials immediately:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
4. No extra configuration needed — DevArena creates folders automatically

Free tier gives you: **25 GB storage**, **25 GB bandwidth/month** — plenty for development.

---

### 5.3 Google OAuth ("Login with Google")

1. Go to **https://console.cloud.google.com**
2. Create a new project → name it `DevArena`
3. Go to **APIs & Services → OAuth consent screen**
   - User Type: **External** → **Create**
   - App name: `DevArena`
   - User support email: your email
   - Developer contact: your email
   - Click **Save and Continue** through all steps
4. Go to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Name: `DevArena Web Client`
   - **Authorized redirect URIs** — add ALL of these:
     ```
     http://localhost:5000/api/auth/google/callback
     https://YOUR-APP-NAME.onrender.com/api/auth/google/callback
     ```
   - Click **Create**
5. Copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

> ⚠️ If you haven't deployed yet, just add the localhost URI for now. Add the Render URI after deployment.

---

### 5.4 Gmail App Password (for Email)

Gmail blocked "less secure apps" — you need an App Password instead.

1. Go to your **Google Account → https://myaccount.google.com**
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
   - If it's off, turn it on first (required for App Passwords)
4. Scroll to the bottom → click **App passwords**
5. Select app: **Mail** → Select device: **Other** → type `DevArena`
6. Click **Generate**
7. Copy the 16-character password (no spaces) → paste as `SMTP_PASS`

Your `.env` should look like:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.actual.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop   ← remove spaces, use: abcdefghijklmnop
EMAIL_FROM=DevArena <your.actual.email@gmail.com>
```

---

### 5.5 Stripe (Optional — Only for Paid Events)

If you don't need paid events, skip this. The app works fine without it.

1. Go to **https://dashboard.stripe.com** → Create account
2. Stay in **Test mode** (toggle in top right)
3. Go to **Developers → API Keys**
   - Copy **Secret key** (starts with `sk_test_`) → `STRIPE_SECRET_KEY`
4. Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - Endpoint URL: `https://YOUR-APP.onrender.com/api/payments/webhook`
   - Events: select `checkout.session.completed`, `payment_intent.succeeded`
   - After creating: copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 6. Seed the Database

The seeder creates demo data so you can immediately explore the app.

```bash
# From the root folder
npm run seed
```

**What gets created:**

| Type | Email | Password |
|------|-------|----------|
| Admin | `admin@devarena.dev` | `Admin@123` |
| Organizer | `organizer@devarena.dev` | `Organizer@123` |
| Sample Participant | `user@devarena.dev` | `User@123` |

Plus:
- 8+ sample events (hackathons, workshops, conferences)
- Badge definitions (9 achievement badges)
- Sample teams and registrations

> ⚠️ **The seeder clears existing data** before inserting. Don't run it on a production database with real users.

---

## 7. Deploy on Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial DevArena commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/devarena.git
git push -u origin main
```

### Step 2 — Create Render Web Service

1. Go to **https://render.com** → sign up / log in
2. Click **New → Web Service**
3. Connect your GitHub account → select the `devarena` repo
4. Fill in these settings:

| Field | Value |
|-------|-------|
| Name | `devarena` (or any name) |
| Region | Singapore (or closest to your users) |
| Branch | `main` |
| Build Command | `npm run render:build` |
| Start Command | `npm start` |
| Plan | Free |

### Step 3 — Add Environment Variables on Render

Go to your service → **Environment** tab → add each variable:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Your generated secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Your other generated secret |
| `JWT_EXPIRE` | `30d` |
| `CLIENT_URL` | `https://your-app-name.onrender.com` |
| `SERVER_URL` | `https://your-app-name.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | From Google Console |
| `GOOGLE_CALLBACK_URL` | `https://your-app-name.onrender.com/api/auth/google/callback` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `EMAIL_FROM` | `DevArena <your@gmail.com>` |
| `STRIPE_SECRET_KEY` | From Stripe (or skip) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe (or skip) |

> 💡 **Tip:** Set `CLIENT_URL` and `SERVER_URL` to the same URL — your Render app URL. The backend serves both the API and React frontend.

### Step 4 — Deploy

Click **Create Web Service**. Render will:
1. Pull your code from GitHub
2. Run `npm run render:build` (installs deps + builds React)
3. Start the server with `npm start`

First deploy takes 3–5 minutes. After that, every `git push` auto-deploys.

### Step 5 — After Deployment

1. Visit your Render URL (e.g., `https://devarena.onrender.com`)
2. Update **Google Console** redirect URIs to include your Render URL
3. Update **Stripe webhook** endpoint URL

---

## 8. Test Accounts

After running `npm run seed`:

### Admin
- **Email:** `admin@devarena.dev`
- **Password:** `Admin@123`
- **Access:** Admin dashboard, manage all users/events, platform analytics

### Organizer
- **Email:** `organizer@devarena.dev`
- **Password:** `Organizer@123`
- **Access:** Create/manage events, view participants, send announcements, analytics dashboard

### Participant
- **Email:** `user@devarena.dev`
- **Password:** `User@123`
- **Access:** Browse events, register, join teams, chat, earn certificates

---

## 9. Troubleshooting

### "MongoDB connection failed"
- Check your `MONGODB_URI` is correct (no typos in username/password)
- On Atlas, check **Network Access** — your IP must be whitelisted (or use `0.0.0.0/0`)
- Make sure the cluster is fully deployed (can take 1–3 minutes after creation)

### "CORS error" in browser console
- `CLIENT_URL` in your `.env` must exactly match where your frontend is running
- Local: `http://localhost:3000` (no trailing slash)
- Production: `https://your-app.onrender.com` (no trailing slash)

### "Google OAuth not working"
- The redirect URI in Google Console must **exactly** match `GOOGLE_CALLBACK_URL` in your `.env`
- On Render: add the production URL to Google Console → Authorized redirect URIs

### "Email not sending"
- Make sure you're using a **Gmail App Password** (not your real Gmail password)
- 2-Factor Authentication must be enabled on your Google account first
- Check `SMTP_USER` is your full Gmail address (e.g., `yourname@gmail.com`)

### "Image upload fails"
- Verify all three Cloudinary env vars are set correctly
- The free Cloudinary tier has a 25GB limit — check your usage at cloudinary.com

### "Build fails on Render"
- Check the build logs in Render dashboard
- Most common cause: a package in `devDependencies` that should be in `dependencies`
- Make sure `react-scripts` is in `dependencies`, not `devDependencies`

### Frontend shows blank page on Render
- Check browser console for errors
- Most common: `PUBLIC_URL` or API URL mismatch
- The frontend uses relative `/api` paths in production — no `REACT_APP_API_URL` needed on Render

### "Port already in use" locally
```bash
# Kill whatever is using port 5000
npx kill-port 5000
# Then restart
npm run dev
```

### Reset everything and start fresh
```bash
# Clear node_modules (if you have weird dependency issues)
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all

# Re-seed the database
npm run seed
```

---

## Quick Reference — All npm Scripts

| Command | Run from | What it does |
|---------|----------|--------------|
| `npm run dev` | root | Start backend + frontend together |
| `npm run dev:backend` | root | Backend only (port 5000) |
| `npm run dev:frontend` | root | Frontend only (port 3000) |
| `npm run build` | root | Build React for production |
| `npm run start` | root | Start production backend |
| `npm run seed` | root | Seed database with demo data |
| `npm run install:all` | root | Install all dependencies |
| `npm run render:build` | root | Full production build (Render uses this) |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Redux Toolkit, React Router 6 |
| Styling | CSS Custom Properties, Lucide Icons |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (access + refresh tokens), Passport.js |
| OAuth | Google OAuth 2.0 via passport-google-oauth20 |
| Real-time | Socket.io (team chat, live notifications) |
| Images | Cloudinary via Multer |
| Email | Nodemailer with Gmail SMTP |
| PDF | PDFKit (certificate generation) |
| Payments | Stripe (optional, for paid events) |
| AI Recs | Custom scoring engine in Express |
| Deployment | Render (single web service, no Docker) |

