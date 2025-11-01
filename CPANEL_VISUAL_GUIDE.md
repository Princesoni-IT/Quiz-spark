# 📸 Quiz Spark - cPanel Visual Deployment Guide

## 🎯 Complete Step-by-Step Guide with Screenshots Reference

---

## 📋 Table of Contents
1. [Pre-Deployment Preparation](#pre-deployment-preparation)
2. [cPanel Login](#cpanel-login)
3. [Node.js Setup](#nodejs-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Testing](#testing)

---

## 🚀 Pre-Deployment Preparation

### **Local Machine Par (Windows):**

#### **Option 1: PowerShell Script Use Karein (Recommended)**

1. **PowerShell ko Administrator mode mein open karein**
   - Start Menu → PowerShell → Right Click → Run as Administrator

2. **Script run karein:**
   ```powershell
   cd D:\Desktop\Github\Quiz-spark
   .\deploy-cpanel.ps1
   ```

3. **Script automatically create karega:**
   - ✅ `backend-deploy.zip` - Backend files
   - ✅ `frontend-deploy.zip` - Frontend files
   - ✅ `DEPLOYMENT_INSTRUCTIONS.txt` - Step-by-step guide

#### **Option 2: Manual Build**

**Backend Preparation:**
```powershell
cd backend
npm install
# .env file configure karein
```

**Frontend Build:**
```powershell
cd Frontend
# .env file mein backend URL add karein
echo VITE_API_URL=https://yourdomain.com:3000 > .env
npm install
npm run build
```

---

## 🔐 cPanel Login

### **Step 1: cPanel Access**

**URL Format:**
```
https://yourdomain.com:2083
https://yourdomain.com/cpanel
https://cpanel.yourdomain.com
```

**Login Credentials:**
- Username: Your hosting username
- Password: Your hosting password

**Screenshot Reference:**
```
┌─────────────────────────────────────┐
│     cPanel Login                    │
│                                     │
│  Username: [____________]           │
│  Password: [____________]           │
│                                     │
│  [ Login ]                          │
└─────────────────────────────────────┘
```

---

## ⚙️ Node.js Setup

### **Step 1: Find "Setup Node.js App"**

**Location:** cPanel Dashboard → Software Section

**Visual Guide:**
```
cPanel Dashboard
├── Files
├── Databases
├── Email
└── Software
    ├── Select PHP Version
    ├── MultiPHP Manager
    └── ⭐ Setup Node.js App  ← Click here
```

### **Step 2: Create Application**

**Click:** "Create Application" button

**Configuration Form:**
```
┌─────────────────────────────────────────────┐
│  Create Application                         │
├─────────────────────────────────────────────┤
│                                             │
│  Node.js version: [18.x ▼]                 │
│                                             │
│  Application mode: [Production ▼]          │
│                                             │
│  Application root: [quiz-spark-backend]    │
│                                             │
│  Application URL: [yourdomain.com/api]     │
│                                             │
│  Application startup file: [server.js]     │
│                                             │
│  [ Create ]                                 │
└─────────────────────────────────────────────┘
```

**Important Settings:**
- ✅ Node.js Version: **18.x** ya higher
- ✅ Application Mode: **Production**
- ✅ Application Root: **quiz-spark-backend**
- ✅ Startup File: **server.js**

### **Step 3: Application Created**

**Success Message:**
```
✓ Application created successfully!

Application Details:
- URL: https://yourdomain.com:3000
- Root: /home/username/quiz-spark-backend
- Status: Stopped

[ Run NPM Install ] [ Start Application ]
```

---

## 📦 Backend Deployment

### **Step 1: File Manager Access**

**Location:** cPanel Dashboard → Files → File Manager

**Directory Structure:**
```
/home/username/
├── public_html/
│   ├── (frontend files yahan)
│   └── quiz-spark-backend/  ← Backend folder
│       ├── server.js
│       ├── emailService.js
│       ├── package.json
│       ├── .env
│       └── node_modules/
└── ...
```

### **Step 2: Upload Backend Files**

**Method A: Upload Zip File**

1. **File Manager mein jaayein:** `public_html/`
2. **Create Folder:** `quiz-spark-backend`
3. **Upload:** `backend-deploy.zip`
4. **Right Click → Extract**
5. **Delete zip file**

**Visual:**
```
File Manager
├── [ Upload ]  ← Click here
├── [ + New Folder ]
├── [ Extract ]
└── [ Delete ]

Files in quiz-spark-backend/:
✓ server.js
✓ emailService.js
✓ package.json
✓ package-lock.json
✓ .env
```

**Method B: FTP Upload (FileZilla)**

```
FileZilla Connection:
┌─────────────────────────────────────┐
│ Host: ftp.yourdomain.com            │
│ Username: your_cpanel_username      │
│ Password: your_cpanel_password      │
│ Port: 21                            │
│                                     │
│ [ Quickconnect ]                    │
└─────────────────────────────────────┘

Local Site → Remote Site
D:\Quiz-spark\backend → /public_html/quiz-spark-backend/
```

### **Step 3: Configure .env File**

**File Manager → quiz-spark-backend → .env → Edit**

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/quizspark?retryWrites=true&w=majority

# JWT Secret (Strong password)
JWT_SECRET=your_super_secret_key_change_this_12345

# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=3000
NODE_ENV=production
```

**Save Changes:** Click "Save Changes" button

### **Step 4: Install Dependencies**

**Go to:** Setup Node.js App → Your Application

**Click:** "Run NPM Install" button

**Progress:**
```
Installing dependencies...
⏳ npm install running...
✓ Dependencies installed successfully!

Installed packages:
- express
- mongoose
- socket.io
- bcrypt
- jsonwebtoken
- ... (and more)
```

### **Step 5: Add Environment Variables**

**In Node.js App Manager:**

**Click:** "Add Variable" for each:

```
┌─────────────────────────────────────┐
│  Environment Variables              │
├─────────────────────────────────────┤
│                                     │
│  MONGO_URI = mongodb+srv://...      │
│  JWT_SECRET = your_secret_key       │
│  GMAIL_USER = your@email.com        │
│  GMAIL_PASS = your_app_password     │
│  PORT = 3000                        │
│  NODE_ENV = production              │
│                                     │
│  [ + Add Variable ]                 │
└─────────────────────────────────────┘
```

### **Step 6: Start Application**

**Click:** "Start Application" button

**Status:**
```
Application Status: ● Running

Details:
- URL: https://yourdomain.com:3000
- PID: 12345
- Memory: 45 MB
- Uptime: 2 minutes

[ Stop Application ] [ Restart Application ]
```

---

## 🎨 Frontend Deployment

### **Step 1: Upload Frontend Files**

**File Manager → public_html/**

**Method A: Extract Zip**

1. **Upload:** `frontend-deploy.zip` to `public_html/`
2. **Right Click → Extract**
3. **Delete zip file**

**Method B: Manual Upload**

Upload these files from `Frontend/dist/` to `public_html/`:
```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-[hash].js
    ├── index-[hash].css
    └── (other assets)
```

### **Step 2: Verify .htaccess File**

**File Manager → public_html → .htaccess**

**Content:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**If not present:** Create new file named `.htaccess` with above content

### **Step 3: File Permissions**

**Set Permissions:**
```
Files:     644 (rw-r--r--)
Folders:   755 (rwxr-xr-x)
.htaccess: 644 (rw-r--r--)
```

**How to set:**
1. Right click on file/folder
2. Select "Change Permissions"
3. Set appropriate values
4. Click "Change Permissions"

---

## 🔧 SSL Certificate Setup

### **Step 1: Enable SSL**

**cPanel → Security → SSL/TLS Status**

**Visual:**
```
┌─────────────────────────────────────┐
│  SSL/TLS Status                     │
├─────────────────────────────────────┤
│                                     │
│  Domain: yourdomain.com             │
│  Status: ⚠ No SSL                   │
│                                     │
│  [ Run AutoSSL ]                    │
└─────────────────────────────────────┘
```

**Click:** "Run AutoSSL"

**Wait for:**
```
✓ SSL Certificate installed successfully!
✓ Your site is now secure (HTTPS)
```

### **Step 2: Force HTTPS (Optional)**

**Add to .htaccess:**
```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🗄️ MongoDB Atlas Setup

### **Step 1: Create Account**

**URL:** https://www.mongodb.com/cloud/atlas/register

**Sign Up:**
```
┌─────────────────────────────────────┐
│  MongoDB Atlas Sign Up              │
├─────────────────────────────────────┤
│                                     │
│  Email: [___________________]       │
│  Password: [___________________]    │
│                                     │
│  [ Sign Up ]                        │
└─────────────────────────────────────┘
```

### **Step 2: Create Cluster**

**Configuration:**
```
┌─────────────────────────────────────┐
│  Create Cluster                     │
├─────────────────────────────────────┤
│                                     │
│  Cloud Provider: [AWS ▼]            │
│  Region: [Mumbai (ap-south-1) ▼]   │
│  Cluster Tier: [M0 Sandbox (FREE)]  │
│  Cluster Name: [QuizSpark]          │
│                                     │
│  [ Create Cluster ]                 │
└─────────────────────────────────────┘
```

### **Step 3: Database Access**

**Create User:**
```
┌─────────────────────────────────────┐
│  Database Access                    │
├─────────────────────────────────────┤
│                                     │
│  Username: [quizadmin]              │
│  Password: [●●●●●●●●●●]             │
│                                     │
│  [ Add User ]                       │
└─────────────────────────────────────┘
```

**Save credentials securely!**

### **Step 4: Network Access**

**Whitelist IP:**
```
┌─────────────────────────────────────┐
│  Network Access                     │
├─────────────────────────────────────┤
│                                     │
│  IP Address: [0.0.0.0/0]            │
│  Description: [Allow from anywhere] │
│                                     │
│  [ Add IP Address ]                 │
└─────────────────────────────────────┘
```

**⚠ Warning:** `0.0.0.0/0` allows all IPs. For production, use specific IPs.

### **Step 5: Get Connection String**

**Click:** "Connect" → "Connect your application"

**Copy Connection String:**
```
mongodb+srv://quizadmin:<password>@quizspark.xxxxx.mongodb.net/quizspark?retryWrites=true&w=majority
```

**Replace `<password>` with your actual password!**

---

## ✅ Testing Your Deployment

### **Step 1: Backend Test**

**Open Browser:**
```
https://yourdomain.com:3000
```

**Expected Response:**
```json
{
  "message": "Quiz Spark Backend API is running!",
  "version": "1.0.0",
  "status": "active"
}
```

### **Step 2: Frontend Test**

**Open Browser:**
```
https://yourdomain.com
```

**Expected:** Quiz Spark homepage loads

### **Step 3: Feature Testing**

**Test Checklist:**
```
Registration:
□ Open registration page
□ Enter email and password
□ Receive OTP email
□ Verify OTP
□ Account created successfully

Login:
□ Enter credentials
□ Login successful
□ Dashboard loads

Quiz Features:
□ Create new quiz
□ Upload questions
□ Generate quiz code
□ Join quiz with code
□ Real-time quiz playing
□ Leaderboard updates
□ Results display

Admin Panel:
□ View all quizzes
□ User management
□ Analytics
```

### **Step 4: Browser Console Check**

**Press F12 → Console Tab**

**No errors should appear. If errors:**
```javascript
// Check API connection
fetch('https://yourdomain.com:3000/api/test')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Check Socket.io connection
const socket = io('https://yourdomain.com:3000');
socket.on('connect', () => console.log('✓ Socket connected!'));
socket.on('connect_error', (err) => console.error('✗ Socket error:', err));
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Application Not Starting**

**Symptoms:**
- Node.js app shows "Stopped" status
- Error in logs

**Solutions:**

**Check Logs:**
```
Setup Node.js App → Your App → [ View Logs ]
```

**Common Errors:**

**1. Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Fix:** Change PORT in .env to 3001

**2. Missing Dependencies:**
```
Error: Cannot find module 'express'
```
**Fix:** Click "Run NPM Install" again

**3. .env File Missing:**
```
Error: MONGO_URI is not defined
```
**Fix:** Check .env file exists and has correct values

### **Issue 2: CORS Error**

**Symptoms:**
```
Access to fetch at 'https://yourdomain.com:3000' from origin 
'https://yourdomain.com' has been blocked by CORS policy
```

**Solution:**

**Edit server.js:**
```javascript
const io = new Server(server, { 
  cors: { 
    origin: [
      "http://localhost:5173",
      "https://yourdomain.com",        // Add your domain
      "https://www.yourdomain.com"     // Add www version
    ], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});
```

**Restart application**

### **Issue 3: MongoDB Connection Failed**

**Symptoms:**
```
MongooseServerSelectionError: Could not connect to any servers
```

**Solutions:**

**1. Check Connection String:**
- Verify MONGO_URI in .env
- Password should not have special characters (or encode them)
- Database name should be correct

**2. Check Network Access:**
- MongoDB Atlas → Network Access
- Verify 0.0.0.0/0 is whitelisted

**3. Check Database User:**
- MongoDB Atlas → Database Access
- Verify user exists and has correct permissions

### **Issue 4: Frontend Shows Blank Page**

**Symptoms:**
- White/blank page
- No content loads

**Solutions:**

**1. Check Browser Console (F12):**
```
Look for errors like:
- Failed to load resource
- Unexpected token '<'
- Cannot read property of undefined
```

**2. Verify .htaccess:**
```apache
# Must have this for React Router
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**3. Check File Permissions:**
```
index.html: 644
assets/: 755
All JS/CSS files: 644
```

**4. Clear Browser Cache:**
```
Ctrl + Shift + Delete → Clear cache
Or try incognito mode
```

### **Issue 5: Socket.io Not Connecting**

**Symptoms:**
- Real-time features not working
- Quiz updates not showing

**Solutions:**

**1. Check Socket Connection:**
```javascript
// In browser console
const socket = io('https://yourdomain.com:3000', {
  transports: ['websocket', 'polling']
});
socket.on('connect', () => console.log('Connected!'));
```

**2. Verify WebSocket Support:**
- Most cPanel hosts support WebSocket
- Contact hosting provider if issues persist

**3. Check Firewall:**
- Port 3000 should be open
- Check with hosting provider

### **Issue 6: Email Not Sending**

**Symptoms:**
- OTP not received
- Registration emails not working

**Solutions:**

**1. Verify Gmail Settings:**
```
Gmail → Settings → Security
- 2-Step Verification: ON
- App Passwords: Generated
```

**2. Check .env:**
```env
GMAIL_USER=your-email@gmail.com  # Correct email
GMAIL_PASS=xxxx xxxx xxxx xxxx   # 16-digit app password
```

**3. Test Email:**
```javascript
// In backend, create test route
app.get('/test-email', async (req, res) => {
  try {
    await sendOTPEmail('test@example.com', '123456');
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
```

---

## 📊 Monitoring & Maintenance

### **Application Monitoring**

**Setup Node.js App → Your App:**
```
┌─────────────────────────────────────┐
│  Application: quiz-spark            │
├─────────────────────────────────────┤
│                                     │
│  Status: ● Running                  │
│  Memory: 45 MB / 512 MB             │
│  CPU: 2%                            │
│  Uptime: 2 hours                    │
│                                     │
│  [ View Logs ]                      │
│  [ Restart ]                        │
│  [ Stop ]                           │
└─────────────────────────────────────┘
```

### **MongoDB Monitoring**

**Atlas Dashboard → Metrics:**
```
┌─────────────────────────────────────┐
│  Cluster Metrics                    │
├─────────────────────────────────────┤
│                                     │
│  Connections: 5 / 100               │
│  Operations: 120/sec                │
│  Storage: 45 MB / 512 MB            │
│  Network: 2.5 MB/sec                │
│                                     │
└─────────────────────────────────────┘
```

### **Regular Maintenance**

**Weekly:**
- Check application logs
- Monitor memory usage
- Review error logs
- Test critical features

**Monthly:**
- Update dependencies
- Review security
- Backup database
- Check SSL certificate

---

## 🎉 Deployment Complete!

### **Your Application URLs:**

```
Frontend:  https://yourdomain.com
Backend:   https://yourdomain.com:3000
Admin:     https://yourdomain.com/admin
```

### **Next Steps:**

1. **Share with users**
2. **Collect feedback**
3. **Monitor performance**
4. **Plan updates**

---

## 📞 Support & Resources

**Documentation:**
- [Main Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Quick Setup Guide](QUICK_CPANEL_SETUP.md)
- [Email Setup Guide](EMAIL_SETUP_GUIDE.md)

**Need Help?**
- Email: princesoni.it@gmail.com
- GitHub Issues: https://github.com/Princesoni-IT/Quiz-spark/issues

**Useful Links:**
- cPanel Documentation: https://docs.cpanel.net/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Node.js Docs: https://nodejs.org/docs/

---

**🚀 Congratulations! Your Quiz Spark app is now live! 🎉**
