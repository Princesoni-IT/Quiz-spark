# 📧 Email-Based OTP Setup Guide

## Overview
Quiz Spark now supports **email-based OTP** for user registration and password reset using **Gmail SMTP** and **Nodemailer**.

---

## ✨ Features

- ✅ **FREE** - No cost, uses Gmail SMTP (500 emails/day limit)
- ✅ **Stable** - Production-ready with fallback support
- ✅ **Simple** - Easy 5-minute setup
- ✅ **Secure** - Uses Gmail App Passwords (2FA required)
- ✅ **Beautiful Emails** - Professional HTML email templates
- ✅ **Dev Mode** - Works without email configuration for development

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** (left sidebar)
3. Under "Signing in to Google", enable **2-Step Verification**
4. Follow the setup process

### Step 2: Generate App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Type "Quiz Spark"
4. Click **Generate**
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Backend Environment

1. Navigate to `backend` folder
2. Create a `.env` file (if not exists)
3. Add these lines:

```env
# Your existing variables
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3000

# Email Configuration (NEW)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:** 
- Use the **16-character App Password** (remove spaces)
- Do NOT use your regular Gmail password

### Step 4: Restart Backend Server

```bash
cd backend
npm start
```

---

## 🎯 How It Works

### Registration Flow:
1. User enters: Full Name, Email, Password
2. Backend generates 6-digit OTP
3. **Email sent to user** with beautiful HTML template
4. User enters OTP from email
5. Account created after verification

### Password Reset Flow:
1. User enters email
2. Backend generates 6-digit OTP
3. **Email sent to user**
4. User enters OTP and new password
5. Password updated

---

## 🧪 Testing

### Development Mode (No Email Setup)
- If `EMAIL_USER` and `EMAIL_PASS` are not configured
- OTP will be shown in:
  - Backend console logs
  - Frontend alert popup (with [DEV MODE] label)
- Perfect for local testing

### Production Mode (Email Configured)
- OTP sent via email
- User receives professional HTML email
- No OTP shown in console/alerts
- Fallback to console if email fails

---

## 📧 Email Templates

### Registration Email
- Beautiful gradient header with Quiz Spark branding
- Large, centered OTP code
- 10-minute validity notice
- Professional styling

### Password Reset Email
- Different color scheme (red/pink gradient)
- Security-focused messaging
- Same professional quality

---

## 🔒 Security Features

- ✅ OTP expires after 10 minutes
- ✅ OTP stored in memory (not database)
- ✅ Auto-cleanup of expired OTPs
- ✅ Rate limiting ready (Gmail: 500 emails/day)
- ✅ App Password instead of real password
- ✅ No OTP exposure in production

---

## 🛠️ Troubleshooting

### Issue: "Invalid credentials" error
**Solution:** 
- Make sure 2FA is enabled
- Use App Password, not regular password
- Remove spaces from App Password

### Issue: Email not received
**Solution:**
- Check spam/junk folder
- Verify EMAIL_USER is correct
- Check Gmail account is active
- Ensure App Password is correct

### Issue: "Less secure app" error
**Solution:**
- This is old method - use App Passwords instead
- App Passwords work with 2FA enabled

### Issue: Rate limit exceeded
**Solution:**
- Gmail allows 500 emails/day
- For higher volume, consider:
  - SendGrid (100 emails/day free)
  - Mailgun (5000 emails/month free)
  - AWS SES (62,000 emails/month free)

---

## 🌐 Alternative Email Services (Optional)

If you need more than 500 emails/day:

### SendGrid (Recommended for scaling)
```bash
npm install @sendgrid/mail
```
- Free: 100 emails/day
- Paid: Starting $14.95/month

### Mailgun
- Free: 5,000 emails/month
- Good for medium traffic

### AWS SES
- Free: 62,000 emails/month (if hosted on AWS)
- Best for high volume

---

## 📝 Environment Variables Reference

```env
# Required for email functionality
EMAIL_USER=your_gmail@gmail.com          # Your Gmail address
EMAIL_PASS=your_app_password_here        # 16-char App Password (no spaces)

# Optional (defaults shown)
PORT=3000                                # Server port
```

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] 2FA enabled on Gmail
- [ ] App Password generated
- [ ] `.env` file configured with EMAIL_USER and EMAIL_PASS
- [ ] Backend server restarted
- [ ] Test registration with real email
- [ ] Test password reset with real email
- [ ] Check spam folder if email not in inbox
- [ ] Verify OTP works correctly
- [ ] Confirm no OTP shown in production alerts

---

## 🎉 Success!

Once configured, your users will receive:
- Professional, branded emails
- Secure OTP delivery
- Better user experience
- No more popup OTPs in production

---

## 📞 Support

If you face any issues:
1. Check backend console logs
2. Verify Gmail App Password setup
3. Test with a different email address
4. Check `.env` file syntax

---

**Made with ❤️ by Team Spark (Prince, Som, Akhlesh)**
