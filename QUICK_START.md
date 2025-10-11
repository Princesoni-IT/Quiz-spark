# 🚀 Quiz Spark - Quick Start Guide

## 📝 Your Current Commands

### **Local Development:**

#### **Backend:**
```bash
cd backend
node server.js
```
Server runs on: `http://localhost:3000`

#### **Frontend:**
```bash
cd Frontend
npm run dev
```
App runs on: `http://localhost:5173`

---

## 🌐 Deployment Commands

### **Backend (Render.com):**
```bash
# Render automatically runs:
npm install
npm start
```

### **Frontend (Netlify):**
```bash
cd Frontend
npm run build
# Upload 'dist' folder to Netlify
```

---

## ⚡ Quick Testing (50 Students)

### **Before Class:**
1. **Wake up server** (2-3 min before class)
   ```
   Open: https://your-backend-url.onrender.com
   Wait for response
   ```

2. **Create Quiz**
   ```
   Login → Dashboard → Create Quiz
   Add questions
   Get Quiz Code (e.g., ABC123)
   ```

3. **Share Code**
   ```
   Write on board: ABC123
   Or WhatsApp group
   ```

### **During Class:**
1. **Students Join:**
   ```
   Open app → Join Quiz → Enter ABC123
   Enter name → Join
   ```

2. **Start Quiz:**
   ```
   Wait for all students
   Click "Start Quiz"
   ```

3. **Monitor:**
   ```
   Watch lobby for student count
   Check for any errors
   ```

---

## 🔧 Environment Setup

### **Backend `.env`:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/quizspark
JWT_SECRET=your_super_secret_key_min_32_chars
GMAIL_USER=princesoni8761969@gmail.com
GMAIL_PASS=your_16_digit_app_password
PORT=3000
```

### **Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3000
```

**For Production:**
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## 📊 Testing Checklist

### **Before Class Testing:**
- [ ] Backend running (check URL)
- [ ] Frontend deployed
- [ ] Test with 2-3 friends first
- [ ] Create sample quiz
- [ ] Test join with quiz code
- [ ] Test real-time updates
- [ ] Check leaderboard

### **During Class:**
- [ ] Server awake (no cold start)
- [ ] Quiz code ready
- [ ] Students can join
- [ ] Real-time working
- [ ] Leaderboard shows

### **After Class:**
- [ ] Collect feedback
- [ ] Check for errors in logs
- [ ] Note any issues
- [ ] Plan improvements

---

## 🐛 Common Issues & Quick Fixes

### **Issue 1: "Cannot connect to server"**
**Fix:**
```bash
# Check if backend is running
curl https://your-backend-url.onrender.com
# If sleeping, just open URL in browser
```

### **Issue 2: "CORS Error"**
**Fix:** Update `server.js` line 18:
```javascript
const io = new Server(server, { 
  cors: { 
    origin: ["http://localhost:5173", "https://your-netlify-url.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE"] 
  }
});
```

### **Issue 3: "Quiz code not working"**
**Fix:**
- Check if quiz code is correct (case-sensitive)
- Ensure quiz is created and saved
- Try creating new quiz

### **Issue 4: "Students not appearing in lobby"**
**Fix:**
- Check internet connection
- Refresh page
- Rejoin with quiz code

---

## 💡 Pro Tips

### **For Smooth Testing:**
1. **Start Early:** Open app 5 min before class
2. **Gradual Join:** Students join 5-10 at a time
3. **Backup Plan:** Keep questions in PDF
4. **Monitor:** Keep Render dashboard open
5. **Test First:** Try with small group first

### **For Better Performance:**
1. **Close Unused Tabs:** On student devices
2. **Good Internet:** WiFi better than mobile data
3. **Modern Browsers:** Chrome/Firefox recommended
4. **Clear Cache:** If facing issues

### **For Class Management:**
1. **Quiz Code on Board:** Big and clear
2. **Helper Students:** 2-3 to help others
3. **Time Buffer:** Start 5 min late
4. **Backup Device:** Your phone/laptop ready

---

## 📱 Student Instructions (Share This)

### **How to Join Quiz:**

1. **Open Link:**
   ```
   https://your-app-url.netlify.app
   ```

2. **Register/Login:**
   - Enter name, email, password
   - Verify OTP from email
   - Login

3. **Join Quiz:**
   - Click "Join Quiz"
   - Enter quiz code: ABC123
   - Click "Join"
   - Wait in lobby

4. **Play Quiz:**
   - Read question
   - Select answer
   - Click "Submit"
   - See score at end

---

## 🎯 Expected Performance (50 Students)

### **Timing:**
- Registration: 1-2 sec per student
- Login: <1 sec
- Join Quiz: <1 sec
- Quiz Playing: Real-time (instant)
- Leaderboard: 1-2 sec

### **Server Load:**
- CPU: 20-30%
- Memory: 100-150MB
- Database: <10MB
- All good! ✅

---

## 📞 Emergency Contacts

### **If Something Goes Wrong:**

1. **Check Logs:**
   - Render: https://dashboard.render.com
   - Browser: F12 → Console

2. **Quick Restart:**
   - Render: Settings → Manual Deploy
   - Takes 2-3 minutes

3. **Backup Plan:**
   - Use Google Forms
   - Or paper quiz
   - Continue class

---

## ✅ Final Checklist

### **Day Before Testing:**
- [ ] Backend deployed and running
- [ ] Frontend deployed and working
- [ ] Test with 2-3 friends
- [ ] Create quiz for class
- [ ] Note down quiz code
- [ ] Share app link with students
- [ ] Ask students to register beforehand

### **Day of Testing:**
- [ ] Wake up server (5 min before)
- [ ] Open app on your device
- [ ] Quiz code ready
- [ ] Backup plan ready
- [ ] Helper students briefed
- [ ] Start quiz!

---

## 🎉 You're Ready!

**Your Setup:**
- ✅ Backend: `node server.js`
- ✅ Frontend: `npm run dev`
- ✅ Capacity: 50 students
- ✅ Cost: ₹0 (Free tier)

**Good luck with your class testing! 🚀**

---

## 📚 Need Help?

- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Issues:** Check browser console (F12)
- **Logs:** Render dashboard
- **Email:** princesoni.it@gmail.com
