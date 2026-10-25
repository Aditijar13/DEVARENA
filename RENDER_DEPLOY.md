# Deploying EventSphere on Render (Single Service)

## How It Works
This project deploys as a **single Render Web Service**:
- The backend (Node/Express) serves the API on `/api/*`
- The frontend (React) is built during the build step and served as static files from `frontend/build/`
- In production, Express serves `index.html` for all non-API routes (React Router handles the rest)

No Docker needed. No separate services needed. Just one free Render web service.

---

## Step-by-Step Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/eventsphere.git
git push -u origin main
```

### 2. Create a MongoDB Atlas Database (Free)
- Go to https://cloud.mongodb.com → Create free cluster
- Whitelist all IPs: `0.0.0.0/0` (for Render)
- Create a database user with a strong password
- Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/eventsphere`

### 3. Create a Cloudinary Account (Free)
- Go to https://cloudinary.com → Sign up free
- Copy your Cloud Name, API Key, and API Secret from the dashboard

### 4. Deploy on Render
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `eventsphere`
   - **Region**: Singapore (or your choice)
   - **Build Command**: `npm run render:build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 5. Set Environment Variables on Render
In the Render dashboard → Environment tab, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | `mongodb+srv://...` (from Atlas) |
| `JWT_SECRET` | any random 32+ char string |
| `JWT_REFRESH_SECRET` | any different random 32+ char string |
| `JWT_EXPIRE` | `30d` |
| `CLIENT_URL` | `https://eventsphere.onrender.com` (your Render URL) |
| `SERVER_URL` | `https://eventsphere.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
| `CLOUDINARY_API_KEY` | from Cloudinary |
| `CLOUDINARY_API_SECRET` | from Cloudinary |
| `SMTP_HOST` | `smtp.gmail.com` (or your email SMTP) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | Gmail app password (not your real password) |

### 6. Frontend .env for Local Dev
Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

For production (Render), the frontend calls relative `/api` paths — no env needed.

---

## Why NOT Docker on Render Free?
Render's free tier supports Node.js natively without Docker. Docker on Render requires paid plans for reliable memory/CPU. The single-service approach here is simpler, faster to deploy, and works perfectly on the free tier.

---

## Local Development
```bash
# Install all deps
npm run install:all

# Create backend/.env (copy from .env.example and fill in)
cp backend/.env.example backend/.env

# Start both frontend + backend
npm run dev
```

---

## Troubleshooting

**Build fails**: Check that `frontend/package.json` has `"build": "react-scripts build"` and all dependencies are listed (not devDependencies).

**MongoDB connection error**: Make sure your Atlas cluster allows connections from `0.0.0.0/0` and the URI is correct.

**CORS errors**: Make sure `CLIENT_URL` in Render env exactly matches your Render app URL (e.g., `https://eventsphere.onrender.com` — no trailing slash).

**Socket.io issues**: Socket.io works fine on Render. Make sure `SERVER_URL` is set correctly.
