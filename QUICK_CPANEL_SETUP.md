# ⚡ Quick cPanel Setup Guide - Quiz Spark

## 🎯 5-Minute Setup (Hindi)

### **Step 1: Backend Upload (2 min)**

**SSH se:**
```bash
cd public_html
mkdir quiz-spark-backend
cd quiz-spark-backend

# Files upload karein (FTP ya File Manager se)
# Ya Git se clone karein:
git clone https://github.com/Princesoni-IT/Quiz-spark.git .
cd backend
```

### **Step 2: Dependencies Install (1 min)**

```bash
npm install
```

### **Step 3: Environment Setup (1 min)**

**`.env` file banayein:**
```bash
nano .env
```

**Paste karein:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/quizspark
JWT_SECRET=your_secret_key_12345
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your_app_password
PORT=3000
NODE_ENV=production
```

**Save karein:** `Ctrl+X`, `Y`, `Enter`

### **Step 4: Start Application (30 sec)**

```bash
# PM2 install karein (agar nahi hai)
npm install -g pm2

# Start karein
pm2 start server.js --name quiz-spark
pm2 save
pm2 startup
```

### **Step 5: Frontend Deploy (30 sec)**

**Local machine par:**
```bash
cd Frontend
echo VITE_API_URL=https://yourdomain.com:3000 > .env
npm run build
```

**cPanel File Manager:**
1. `public_html` mein jaayein
2. `dist` folder ki saari files upload karein
3. `.htaccess` file create karein (niche content copy karein)

**`.htaccess` content:**
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

---

## 🔥 Common Commands

### **Application Management:**
```bash
pm2 status              # Status check
pm2 logs quiz-spark     # Logs dekhein
pm2 restart quiz-spark  # Restart
pm2 stop quiz-spark     # Stop
pm2 delete quiz-spark   # Delete
```

### **Debugging:**
```bash
# Backend logs
pm2 logs quiz-spark --lines 100

# Error check
tail -f error.log

# Port check
netstat -tulpn | grep :3000
```

### **Update Application:**
```bash
cd ~/public_html/quiz-spark-backend
git pull origin main
npm install
pm2 restart quiz-spark
```

---

## 📱 Quick URLs

**Replace `yourdomain.com` with your actual domain:**

- **Frontend:** https://yourdomain.com
- **Backend:** https://yourdomain.com:3000
- **API Test:** https://yourdomain.com:3000/api/test

---

## ✅ Quick Test

**Browser console mein (F12):**
```javascript
// Backend test
fetch('https://yourdomain.com:3000/api/test')
  .then(r => r.json())
  .then(console.log)

// Socket test
const socket = io('https://yourdomain.com:3000');
socket.on('connect', () => console.log('Connected!'));
```

---

## 🆘 Quick Fixes

### **Backend not starting?**
```bash
pm2 delete quiz-spark
pm2 start server.js --name quiz-spark
pm2 logs quiz-spark
```

### **CORS error?**
**`server.js` mein update karein:**
```javascript
const io = new Server(server, { 
  cors: { 
    origin: ["https://yourdomain.com"], 
    methods: ["GET", "POST", "PUT", "DELETE"] 
  }
});
```

### **MongoDB not connecting?**
- MongoDB Atlas → Network Access → Add IP: `0.0.0.0/0`
- Connection string verify karein

### **Frontend blank page?**
- Browser console check karein (F12)
- `.env` file mein `VITE_API_URL` verify karein
- `npm run build` phir se run karein

---

## 🎯 Production Checklist

- [ ] SSL certificate installed
- [ ] `.env` file secured (chmod 600)
- [ ] MongoDB IP whitelisted
- [ ] PM2 auto-restart enabled
- [ ] CORS configured
- [ ] All features tested
- [ ] Backup liya

---

## 📞 Need Help?

**Error aa raha hai?**
1. `pm2 logs quiz-spark` check karein
2. Browser console (F12) dekhein
3. cPanel error logs check karein

**Contact:**
- Email: princesoni.it@gmail.com
- GitHub: https://github.com/Princesoni-IT/Quiz-spark

---

**🚀 Done! Aapka app live hai!**
