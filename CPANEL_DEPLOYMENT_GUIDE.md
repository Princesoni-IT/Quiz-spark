# 🚀 Quiz Spark - cPanel Deployment Guide (Hindi)

## 📋 Table of Contents
1. [Requirements](#requirements)
2. [Node.js Setup on cPanel](#nodejs-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Configuration](#database-configuration)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Requirements

### **cPanel Requirements:**
- ✅ Node.js support (version 18.0.0 ya usse upar)
- ✅ SSH access (recommended)
- ✅ File Manager access
- ✅ Domain ya subdomain
- ✅ MongoDB Atlas account (free)

### **Local Requirements:**
- ✅ Node.js installed
- ✅ Git installed
- ✅ FileZilla ya FTP client (optional)

---

## 🔧 Node.js Setup on cPanel

### **Step 1: cPanel Login**
1. Apne hosting provider ke cPanel mein login karein
2. URL usually hota hai: `https://yourdomain.com:2083`

### **Step 2: Node.js Application Setup**

#### **Option A: Setup Node.js Application (Recommended)**

1. **cPanel Dashboard** mein jaayein
2. **"Software"** section mein **"Setup Node.js App"** dhundein
3. Click karein **"Create Application"**

**Configuration:**
```
Node.js Version: 18.x (ya latest available)
Application Mode: Production
Application Root: quiz-spark-backend
Application URL: yourdomain.com/api (ya subdomain)
Application Startup File: server.js
```

4. Click **"Create"**

#### **Option B: Manual Setup via SSH**

**SSH se connect karein:**
```bash
ssh username@yourdomain.com
```

**Node.js version check karein:**
```bash
node --version
npm --version
```

Agar Node.js nahi hai, to cPanel se install karein ya hosting provider se contact karein.

---

## 📦 Backend Deployment

### **Step 1: Files Upload Karna**

#### **Method A: File Manager (Easy)**

1. cPanel **File Manager** open karein
2. `public_html` folder mein jaayein (ya apna designated folder)
3. Naya folder banayein: `quiz-spark-backend`
4. Backend files upload karein:
   - `server.js`
   - `emailService.js`
   - `package.json`
   - `package-lock.json`
   - `.env.example` (rename to `.env` after upload)

**Important:** `.env` file ko directly upload **NA** karein. Pehle `.env.example` upload karein, phir rename karein.

#### **Method B: FTP/FileZilla (Recommended)**

1. FileZilla open karein
2. FTP credentials enter karein:
   ```
   Host: ftp.yourdomain.com
   Username: your_cpanel_username
   Password: your_cpanel_password
   Port: 21
   ```
3. Backend folder ko `public_html/quiz-spark-backend` mein upload karein

#### **Method C: Git (Best)**

**SSH se:**
```bash
cd public_html
git clone https://github.com/Princesoni-IT/Quiz-spark.git
cd Quiz-spark/backend
```

### **Step 2: Dependencies Install Karna**

#### **Via cPanel Node.js App Manager:**
1. **Setup Node.js App** mein jaayein
2. Apni application select karein
3. **"Run NPM Install"** button click karein

#### **Via SSH:**
```bash
cd ~/public_html/quiz-spark-backend
npm install
```

**Note:** Agar error aaye to:
```bash
npm install --legacy-peer-deps
```

### **Step 3: Environment Variables Configure Karna**

**File Manager se `.env` file edit karein:**

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/quizspark?retryWrites=true&w=majority

# JWT Secret (Strong password use karein)
JWT_SECRET=your_super_secret_key_change_this_12345

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your_gmail_app_password

# Server Port
PORT=3000

# Node Environment
NODE_ENV=production
```

**Gmail App Password kaise banayein:**
1. Google Account → Security
2. 2-Step Verification enable karein
3. App Passwords → Select "Mail" → Generate
4. Generated password ko `.env` mein paste karein

### **Step 4: Application Start Karna**

#### **Via cPanel Node.js App Manager:**
1. Application select karein
2. **"Start Application"** button click karein
3. Application URL copy karein (e.g., `https://yourdomain.com:3000`)

#### **Via SSH:**
```bash
cd ~/public_html/quiz-spark-backend
npm start
```

**Background mein run karne ke liye (PM2 recommended):**
```bash
# PM2 install karein
npm install -g pm2

# Application start karein
pm2 start server.js --name quiz-spark

# Auto-restart enable karein
pm2 startup
pm2 save

# Status check karein
pm2 status
pm2 logs quiz-spark
```

### **Step 5: Backend URL Note Karein**

Aapka backend URL hoga:
- `https://yourdomain.com:3000` (if port-based)
- `https://api.yourdomain.com` (if subdomain)
- `https://yourdomain.com/api` (if path-based)

---

## 🎨 Frontend Deployment

### **Step 1: Frontend Build Karna (Local Machine Par)**

**Apne computer par:**
```bash
cd Frontend

# Backend URL set karein
echo VITE_API_URL=https://yourdomain.com:3000 > .env

# Build karein
npm install
npm run build
```

Yeh `dist` folder create karega optimized files ke saath.

### **Step 2: Frontend Files Upload Karna**

#### **Option A: Main Domain Par Deploy**

1. cPanel File Manager open karein
2. `public_html` folder mein jaayein
3. Purani files delete karein (backup le lein pehle)
4. `dist` folder ki saari files upload karein **directly** `public_html` mein

**Structure:**
```
public_html/
├── index.html
├── assets/
│   ├── index-abc123.js
│   └── index-xyz789.css
└── quiz-spark-backend/ (backend folder alag rahega)
```

#### **Option B: Subdomain Par Deploy**

1. cPanel mein **"Subdomains"** section mein jaayein
2. Naya subdomain banayein: `app.yourdomain.com`
3. Document root set karein: `/public_html/quiz-app`
4. `dist` folder ki files `quiz-app` folder mein upload karein

### **Step 3: .htaccess File Configure Karna**

**Frontend folder mein `.htaccess` file banayein:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🗄️ Database Configuration

### **MongoDB Atlas Setup (Free)**

1. **Account banayein:** https://www.mongodb.com/cloud/atlas/register

2. **Cluster banayein:**
   - **Tier:** M0 (Free)
   - **Region:** Mumbai (ap-south-1) - India ke liye best
   - **Cluster Name:** QuizSpark

3. **Database User banayein:**
   - Username: `quizadmin`
   - Password: Strong password (save kar lein)

4. **Network Access:**
   - **IP Whitelist:** `0.0.0.0/0` (Allow from anywhere)
   - **Note:** Production mein specific IPs use karein

5. **Connection String:**
   ```
   mongodb+srv://quizadmin:password@quizspark.xxxxx.mongodb.net/quizspark?retryWrites=true&w=majority
   ```

6. **Backend `.env` mein paste karein**

---

## 🔧 Server Configuration

### **CORS Setup (Backend)**

**`server.js` mein update karein:**

```javascript
const io = new Server(server, { 
  cors: { 
    origin: [
      "http://localhost:5173",           // Local development
      "https://yourdomain.com",          // Production domain
      "https://app.yourdomain.com"       // Subdomain (if using)
    ], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Express CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://yourdomain.com",
    "https://app.yourdomain.com"
  ],
  credentials: true
}));
```

### **SSL Certificate (HTTPS)**

**Free SSL via cPanel:**
1. cPanel → **"SSL/TLS Status"**
2. Domain select karein
3. **"Run AutoSSL"** click karein
4. Wait for certificate installation

**Let's Encrypt (Alternative):**
1. cPanel → **"Let's Encrypt SSL"**
2. Domain select karein
3. **"Issue"** click karein

---

## 🚀 Application Start Karna

### **Final Steps:**

1. **Backend start karein:**
   ```bash
   cd ~/public_html/quiz-spark-backend
   pm2 start server.js --name quiz-spark
   pm2 save
   ```

2. **Frontend access karein:**
   - Main domain: `https://yourdomain.com`
   - Subdomain: `https://app.yourdomain.com`

3. **Test karein:**
   - Registration
   - Login
   - Quiz create/join
   - Real-time features

---

## 🐛 Troubleshooting

### **Problem 1: Node.js App Start Nahi Ho Raha**

**Solution:**
```bash
# Logs check karein
pm2 logs quiz-spark

# Port conflict check karein
netstat -tulpn | grep :3000

# Different port use karein
PORT=3001 pm2 start server.js --name quiz-spark
```

### **Problem 2: CORS Error**

**Solution:**
- Backend `server.js` mein frontend URL check karein
- Browser console mein exact error dekhein
- `.htaccess` mein CORS headers add karein

### **Problem 3: MongoDB Connection Failed**

**Solution:**
```bash
# Connection string verify karein
# IP whitelist check karein (0.0.0.0/0)
# Username/password verify karein
```

### **Problem 4: Frontend Blank Page**

**Solution:**
- Browser console check karein (F12)
- `.env` mein `VITE_API_URL` verify karein
- `dist` folder properly upload hua hai check karein
- `.htaccess` file present hai check karein

### **Problem 5: Socket.io Not Working**

**Solution:**
```javascript
// Frontend mein socket connection update karein
const socket = io('https://yourdomain.com:3000', {
  transports: ['websocket', 'polling'],
  secure: true
});
```

### **Problem 6: 500 Internal Server Error**

**Solution:**
```bash
# Error logs check karein
tail -f ~/public_html/quiz-spark-backend/error.log

# File permissions check karein
chmod 755 server.js
chmod 644 package.json

# Dependencies reinstall karein
rm -rf node_modules
npm install
```

---

## 📊 Performance Optimization

### **1. Enable Compression**

**.htaccess mein add karein:**
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### **2. Cache Static Files**

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
</IfModule>
```

### **3. PM2 Cluster Mode**

```bash
pm2 start server.js -i max --name quiz-spark
```

### **4. Database Indexing**

**MongoDB Atlas Dashboard:**
- Collections → Indexes
- Create indexes on frequently queried fields

---

## 🔐 Security Best Practices

### **1. Environment Variables Secure Karein**

```bash
# .env file permissions
chmod 600 .env

# .gitignore mein add karein
echo ".env" >> .gitignore
```

### **2. Rate Limiting Add Karein**

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP
});

app.use('/api/', limiter);
```

### **3. Helmet.js Use Karein**

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 📈 Monitoring

### **PM2 Monitoring:**

```bash
# Status check
pm2 status

# Logs dekhein
pm2 logs quiz-spark

# Memory usage
pm2 monit

# Restart application
pm2 restart quiz-spark

# Stop application
pm2 stop quiz-spark
```

### **MongoDB Monitoring:**
- Atlas Dashboard → Metrics
- Monitor connections, operations, storage

---

## ✅ Deployment Checklist

- [ ] Node.js cPanel par installed hai
- [ ] Backend files upload ho gayi
- [ ] `npm install` successfully run hua
- [ ] `.env` file properly configured hai
- [ ] MongoDB Atlas setup complete
- [ ] Backend application start ho gaya
- [ ] Frontend build create ho gaya
- [ ] Frontend files upload ho gayi
- [ ] `.htaccess` file configured hai
- [ ] SSL certificate installed hai
- [ ] CORS properly configured hai
- [ ] All features test kar liye
- [ ] PM2 auto-restart enabled hai

---

## 🎉 Deployment Complete!

**Aapka Quiz Spark app ab live hai!**

**URLs:**
- **Frontend:** https://yourdomain.com
- **Backend API:** https://yourdomain.com:3000
- **Admin Panel:** https://yourdomain.com/admin

**Next Steps:**
1. Users ko invite karein
2. Feedback collect karein
3. Performance monitor karein
4. Regular backups lein

---

## 📞 Support

**Issues face kar rahe hain?**

1. **Logs check karein:**
   ```bash
   pm2 logs quiz-spark
   tail -f error.log
   ```

2. **Browser Console:** F12 press karein

3. **cPanel Error Logs:** cPanel → Metrics → Errors

**Help chahiye?**
- Email: princesoni.it@gmail.com
- GitHub Issues: https://github.com/Princesoni-IT/Quiz-spark/issues

---

## 🚀 Happy Deploying! 🎉

**Agar koi problem aaye to contact karein. All the best!** 👍
