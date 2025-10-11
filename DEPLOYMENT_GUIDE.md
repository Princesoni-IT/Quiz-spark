# 🚀 Quiz Spark - Deployment Guide

## 📊 User Capacity Analysis

### **Current Architecture Limits:**

| Tier | Concurrent Users | Simultaneous Quizzes | Database Size | Monthly Cost |
|------|-----------------|---------------------|---------------|--------------|
| **Free** | 50-100 | 5-10 | 512MB | ₹0 |
| **Starter** | 500-1000 | 50-100 | 10GB | ₹500-1000 |
| **Pro** | 5,000-10,000 | 500+ | 40GB+ | ₹2000-5000 |
| **Enterprise** | 50,000+ | 5000+ | 100GB+ | ₹10,000+ |

---

## 🎯 Recommended Deployment (Free Tier)

### **Stack:**
- **Frontend:** Netlify (Free)
- **Backend:** Render.com (Free)
- **Database:** MongoDB Atlas (Free 512MB)
- **Total Cost:** ₹0/month
- **Capacity:** 50-100 concurrent users

---

## 📝 Step-by-Step Deployment

### **1. Prepare Backend for Deployment**

#### **A. Update CORS in `server.js`:**
```javascript
const io = new Server(server, { 
  cors: { 
    origin: [
      "http://localhost:5173",
      "https://your-frontend-url.netlify.app" // Add your Netlify URL
    ], 
    methods: ["GET", "POST", "PUT", "DELETE"] 
  }
});
```

#### **B. Create `.env` file (Don't commit this!):**
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_key_here
GMAIL_USER=princesoni8761969@gmail.com
GMAIL_PASS=your_gmail_app_password
PORT=3000
```

#### **C. Update `package.json` scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### **2. Deploy Backend to Render.com**

1. **Create Account:** https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings:**
   - **Name:** quiz-spark-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **Environment Variables:**
   ```
   MONGO_URI = mongodb+srv://...
   JWT_SECRET = your_secret_key
   GMAIL_USER = your_email
   GMAIL_PASS = your_app_password
   PORT = 3000
   ```

5. **Deploy!** → Copy your backend URL: `https://quiz-spark-backend.onrender.com`

---

### **3. Prepare Frontend for Deployment**

#### **A. Create `.env` file in Frontend folder:**
```env
VITE_API_URL=https://quiz-spark-backend.onrender.com
```

#### **B. Build Frontend:**
```bash
cd Frontend
npm run build
```

This creates a `dist` folder with optimized files.

---

### **4. Deploy Frontend to Netlify**

**Option A: Drag & Drop (Easiest)**
1. Go to https://app.netlify.com
2. Drag `dist` folder to Netlify
3. Done! Get your URL: `https://quiz-spark.netlify.app`

**Option B: GitHub (Recommended)**
1. Push code to GitHub
2. Netlify → New Site → Import from GitHub
3. **Build Settings:**
   - **Base directory:** `Frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `Frontend/dist`
4. **Environment Variables:**
   ```
   VITE_API_URL = https://quiz-spark-backend.onrender.com
   ```
5. Deploy!

---

### **5. Update Backend CORS**

After getting Netlify URL, update `server.js`:
```javascript
const io = new Server(server, { 
  cors: { 
    origin: [
      "http://localhost:5173",
      "https://quiz-spark.netlify.app" // Your actual Netlify URL
    ], 
    methods: ["GET", "POST", "PUT", "DELETE"] 
  }
});
```

Redeploy backend on Render.

---

## 🔧 Performance Optimizations

### **Already Implemented:**
✅ Database indexes on User schema  
✅ JWT authentication  
✅ Base64 image optimization  
✅ CORS configuration  

### **For Scaling to 1000+ Users:**

#### **1. Add Redis for Session Storage:**
```bash
npm install redis ioredis
```

#### **2. Add Database Indexes:**
```javascript
// In server.js
quizSchema.index({ quizCode: 1 });
quizSchema.index({ creatorId: 1, createdAt: -1 });
feedbackSchema.index({ createdAt: -1 });
```

#### **3. Enable Socket.io Redis Adapter:**
```javascript
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

#### **4. Add Rate Limiting:**
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 📈 Scaling Strategy

### **Phase 1: 0-100 Users (Current)**
- Free tier (Render + MongoDB Atlas)
- Single server instance
- No caching needed

### **Phase 2: 100-1,000 Users**
- Upgrade to Render Starter ($7/month)
- MongoDB Atlas M10 ($9/month)
- Add Redis for caching
- **Total:** ~₹1,200/month

### **Phase 3: 1,000-10,000 Users**
- Multiple server instances
- Redis cluster
- MongoDB Atlas M30
- CDN for static assets
- **Total:** ~₹5,000/month

### **Phase 4: 10,000+ Users**
- Kubernetes cluster
- Load balancer
- MongoDB sharding
- Dedicated Redis cluster
- **Total:** ₹10,000+/month

---

## 🐛 Common Issues & Solutions

### **Issue 1: Backend sleeps on free tier**
**Problem:** Render free tier sleeps after 15 min inactivity  
**Solution:** Use cron-job.org to ping your backend every 10 minutes

### **Issue 2: CORS errors**
**Problem:** Frontend can't connect to backend  
**Solution:** Check CORS origin matches your Netlify URL exactly

### **Issue 3: Socket.io not connecting**
**Problem:** Real-time features not working  
**Solution:** Ensure WebSocket is enabled on Render (it is by default)

### **Issue 4: MongoDB connection timeout**
**Problem:** Can't connect to database  
**Solution:** Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas Network Access

---

## 📊 Monitoring & Analytics

### **Free Tools:**
1. **Render Dashboard** - Server metrics
2. **MongoDB Atlas** - Database performance
3. **Google Analytics** - User analytics
4. **Sentry** - Error tracking (free tier)

### **Recommended Setup:**
```bash
npm install @sentry/node
```

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: "production",
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## ✅ Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] CORS URLs updated
- [ ] MongoDB Atlas IP whitelist set
- [ ] Gmail app password working
- [ ] Frontend `.env` has backend URL
- [ ] Backend tested locally
- [ ] Frontend build successful
- [ ] Database indexes added
- [ ] Error handling implemented
- [ ] Security headers added

---

## 🎉 Post-Deployment

1. **Test all features:**
   - Registration + OTP
   - Login
   - Create Quiz
   - Join Quiz
   - Real-time quiz playing
   - Leaderboard
   - Admin panel

2. **Share your app:**
   - Get your Netlify URL
   - Share with users
   - Collect feedback

3. **Monitor:**
   - Check Render logs
   - Monitor MongoDB usage
   - Track user growth

---

## 📞 Support

**Issues?** Check:
1. Render logs: `https://dashboard.render.com`
2. MongoDB logs: `https://cloud.mongodb.com`
3. Browser console for frontend errors

**Need help?** 
- GitHub Issues
- Discord community
- Email: princesoni.it@gmail.com

---

## 🚀 Your App is Ready!

**Estimated Capacity:**
- **Free Tier:** 50-100 concurrent users
- **With optimizations:** 500-1000 users
- **With paid tier:** 5,000-10,000 users

**Good luck with your deployment! 🎉**
