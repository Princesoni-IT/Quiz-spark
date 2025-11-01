# 🚀 Quiz Spark - Deployment Guides

## 📚 Available Deployment Options

Quiz Spark ko aap multiple platforms par deploy kar sakte hain. Niche har platform ke liye detailed guides available hain:

---

## 🎯 Recommended Platforms

### 1. **cPanel Hosting** (Shared Hosting)
**Best for:** Small to medium scale deployments, budget-friendly

**Guides:**
- 📖 [Complete cPanel Deployment Guide](CPANEL_DEPLOYMENT_GUIDE.md) - Detailed step-by-step guide
- ⚡ [Quick cPanel Setup](QUICK_CPANEL_SETUP.md) - 5-minute quick start
- 📸 [Visual Guide with Screenshots](CPANEL_VISUAL_GUIDE.md) - Visual step-by-step

**Scripts:**
- 🪟 [Windows PowerShell Script](deploy-cpanel.ps1) - Automated deployment
- 🐧 [Linux/Mac Bash Script](deploy-cpanel.sh) - Automated deployment

**Capacity:** 50-500 concurrent users  
**Cost:** ₹100-500/month (depending on hosting plan)

---

### 2. **Free Tier Deployment** (Netlify + Render)
**Best for:** Testing, small scale, zero cost

**Guide:**
- 📖 [Free Tier Deployment Guide](DEPLOYMENT_GUIDE.md)

**Stack:**
- Frontend: Netlify (Free)
- Backend: Render.com (Free)
- Database: MongoDB Atlas (Free)

**Capacity:** 50-100 concurrent users  
**Cost:** ₹0/month

---

## 📋 Quick Comparison

| Platform | Setup Time | Cost/Month | Capacity | Difficulty |
|----------|-----------|------------|----------|------------|
| **cPanel** | 10-15 min | ₹100-500 | 50-500 users | Easy |
| **Netlify + Render** | 15-20 min | ₹0 | 50-100 users | Medium |
| **VPS (DigitalOcean)** | 30-45 min | ₹400+ | 500-5000 users | Hard |
| **AWS/Azure** | 60+ min | ₹1000+ | 5000+ users | Very Hard |

---

## 🚀 Quick Start

### **For cPanel Deployment:**

#### **Windows Users:**
```powershell
# PowerShell mein run karein
cd D:\Desktop\Github\Quiz-spark
.\deploy-cpanel.ps1
```

#### **Linux/Mac Users:**
```bash
# Terminal mein run karein
cd ~/Quiz-spark
bash deploy-cpanel.sh
```

### **For Free Tier Deployment:**

**Backend (Render.com):**
1. Account banayein: https://render.com
2. New Web Service → Connect GitHub
3. Environment variables add karein
4. Deploy!

**Frontend (Netlify):**
1. Account banayein: https://netlify.com
2. Drag & drop `Frontend/dist` folder
3. Done!

**Detailed steps:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📖 Documentation Structure

```
Quiz-spark/
├── DEPLOYMENT_README.md           ← You are here
├── CPANEL_DEPLOYMENT_GUIDE.md     ← Complete cPanel guide (Hindi)
├── QUICK_CPANEL_SETUP.md          ← Quick reference
├── CPANEL_VISUAL_GUIDE.md         ← Visual step-by-step
├── DEPLOYMENT_GUIDE.md            ← Free tier deployment
├── deploy-cpanel.ps1              ← Windows automation script
├── deploy-cpanel.sh               ← Linux/Mac automation script
├── EMAIL_SETUP_GUIDE.md           ← Email configuration
└── QUICK_START.md                 ← Local development setup
```

---

## 🎯 Choose Your Deployment Path

### **Path 1: cPanel (Recommended for Beginners)**

**Pros:**
- ✅ Easy setup
- ✅ Visual interface (no command line needed)
- ✅ Good for production
- ✅ Affordable
- ✅ 24/7 support from hosting provider

**Cons:**
- ❌ Monthly cost (₹100-500)
- ❌ Limited scalability

**Follow:**
1. [CPANEL_DEPLOYMENT_GUIDE.md](CPANEL_DEPLOYMENT_GUIDE.md) - Complete guide
2. [CPANEL_VISUAL_GUIDE.md](CPANEL_VISUAL_GUIDE.md) - Visual reference

---

### **Path 2: Free Tier (Best for Testing)**

**Pros:**
- ✅ Completely free
- ✅ Good for testing
- ✅ Easy to setup
- ✅ Automatic deployments

**Cons:**
- ❌ Limited resources
- ❌ Backend sleeps after 15 min inactivity
- ❌ Not suitable for production

**Follow:**
1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

### **Path 3: VPS (For Advanced Users)**

**Pros:**
- ✅ Full control
- ✅ Better performance
- ✅ Scalable
- ✅ Custom configurations

**Cons:**
- ❌ Requires technical knowledge
- ❌ Higher cost
- ❌ Manual maintenance

**Platforms:**
- DigitalOcean
- Linode
- Vultr
- AWS EC2

**Guide:** Coming soon...

---

## 🛠️ Prerequisites

### **For All Deployments:**

**Required:**
- ✅ Node.js 18.0.0 or higher
- ✅ MongoDB Atlas account (free)
- ✅ Gmail account (for OTP emails)
- ✅ Domain name (optional but recommended)

**Optional:**
- Git installed
- FTP client (FileZilla)
- SSH client (PuTTY for Windows)

### **For cPanel:**
- ✅ cPanel hosting account with Node.js support
- ✅ File Manager or FTP access
- ✅ SSH access (recommended)

### **For Free Tier:**
- ✅ GitHub account
- ✅ Netlify account
- ✅ Render.com account

---

## 📝 Pre-Deployment Checklist

Before deploying, make sure:

**Backend:**
- [ ] `.env` file configured with all variables
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Gmail app password generated
- [ ] Dependencies installed (`npm install`)

**Frontend:**
- [ ] `.env` file has backend URL
- [ ] Build created (`npm run build`)
- [ ] All assets in `dist` folder
- [ ] `.htaccess` file created

**Domain & SSL:**
- [ ] Domain pointed to hosting
- [ ] SSL certificate installed
- [ ] HTTPS enabled

---

## 🔧 Configuration Files

### **Backend .env Template:**
```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/quizspark?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your_super_secret_key_change_this_12345

# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=3000
NODE_ENV=production
```

### **Frontend .env Template:**
```env
# Backend API URL
VITE_API_URL=https://yourdomain.com:3000
```

---

## 🐛 Common Issues

### **Issue: Backend not starting**
**Solution:** Check logs, verify .env file, ensure port is not in use

**Guide:** [CPANEL_VISUAL_GUIDE.md#troubleshooting](CPANEL_VISUAL_GUIDE.md#troubleshooting)

### **Issue: CORS errors**
**Solution:** Update CORS configuration in `server.js`

**Guide:** [CPANEL_VISUAL_GUIDE.md#issue-2-cors-error](CPANEL_VISUAL_GUIDE.md#issue-2-cors-error)

### **Issue: MongoDB connection failed**
**Solution:** Check connection string, verify network access

**Guide:** [CPANEL_VISUAL_GUIDE.md#issue-3-mongodb-connection-failed](CPANEL_VISUAL_GUIDE.md#issue-3-mongodb-connection-failed)

### **Issue: Frontend blank page**
**Solution:** Check .htaccess, verify build files, clear cache

**Guide:** [CPANEL_VISUAL_GUIDE.md#issue-4-frontend-shows-blank-page](CPANEL_VISUAL_GUIDE.md#issue-4-frontend-shows-blank-page)

---

## 📊 Performance & Scaling

### **Current Capacity:**
- **Free Tier:** 50-100 concurrent users
- **cPanel Shared:** 50-500 concurrent users
- **VPS:** 500-5000 concurrent users

### **Optimization Tips:**

**For Better Performance:**
1. Enable compression (gzip)
2. Use CDN for static assets
3. Add database indexes
4. Implement caching (Redis)
5. Use PM2 cluster mode

**Guide:** [DEPLOYMENT_GUIDE.md#performance-optimizations](DEPLOYMENT_GUIDE.md#performance-optimizations)

---

## 🔐 Security Best Practices

**Must Do:**
- ✅ Use strong JWT_SECRET
- ✅ Enable HTTPS/SSL
- ✅ Secure .env file (chmod 600)
- ✅ Use environment variables
- ✅ Enable rate limiting
- ✅ Regular backups

**Recommended:**
- ✅ Use Helmet.js
- ✅ Implement CSRF protection
- ✅ Add input validation
- ✅ Monitor logs
- ✅ Keep dependencies updated

---

## 📈 Monitoring

### **Application Monitoring:**
- PM2 dashboard (for Node.js)
- cPanel metrics
- MongoDB Atlas metrics

### **Error Tracking:**
- Application logs
- Browser console
- MongoDB logs
- Email delivery logs

**Tools:**
- PM2: `pm2 monit`
- Logs: `pm2 logs quiz-spark`
- MongoDB: Atlas Dashboard

---

## 🆘 Getting Help

### **Documentation:**
1. Read the appropriate deployment guide
2. Check troubleshooting section
3. Review common issues

### **Support Channels:**
- **Email:** princesoni.it@gmail.com
- **GitHub Issues:** https://github.com/Princesoni-IT/Quiz-spark/issues
- **Documentation:** All guides in this repository

### **Before Asking for Help:**
1. Check application logs
2. Check browser console
3. Verify all configuration files
4. Try troubleshooting steps in guides

---

## 🎉 Post-Deployment

### **After Successful Deployment:**

**Test Everything:**
- [ ] Registration with OTP
- [ ] Login functionality
- [ ] Create quiz
- [ ] Join quiz
- [ ] Real-time features
- [ ] Leaderboard
- [ ] Admin panel

**Share Your App:**
- [ ] Share URL with users
- [ ] Collect feedback
- [ ] Monitor performance
- [ ] Plan improvements

**Maintenance:**
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Update dependencies
- [ ] Security patches

---

## 📞 Support

**Need help with deployment?**

1. **Check Documentation:**
   - [cPanel Guide](CPANEL_DEPLOYMENT_GUIDE.md)
   - [Visual Guide](CPANEL_VISUAL_GUIDE.md)
   - [Quick Setup](QUICK_CPANEL_SETUP.md)

2. **Common Issues:**
   - [Troubleshooting Section](CPANEL_VISUAL_GUIDE.md#common-issues--solutions)

3. **Contact:**
   - Email: princesoni.it@gmail.com
   - GitHub: https://github.com/Princesoni-IT/Quiz-spark

---

## 🚀 Ready to Deploy?

**Choose your platform and follow the guide:**

1. **cPanel:** [Start Here](CPANEL_DEPLOYMENT_GUIDE.md)
2. **Free Tier:** [Start Here](DEPLOYMENT_GUIDE.md)
3. **Quick Setup:** [Start Here](QUICK_CPANEL_SETUP.md)

**Or use automated scripts:**
- Windows: `.\deploy-cpanel.ps1`
- Linux/Mac: `bash deploy-cpanel.sh`

---

**🎉 Happy Deploying! Good luck with your Quiz Spark app! 🚀**
