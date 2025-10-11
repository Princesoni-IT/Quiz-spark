
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: [
            "http://localhost:5173",
            "https://quiz-spark.netlify.app",  // Production URL
            /\.netlify\.app$/  // Allow all Netlify subdomains
        ], 
        methods: ["GET", "POST", "PUT", "DELETE"] 
    }
});
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Multer Configuration for File Upload ---
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        console.log('File filter - originalname:', file.originalname, 'ext:', ext);
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed!'));
        }
    }
});

// Multer error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.log('Multer error:', error);
        return res.status(400).json({ message: error.message });
    } else if (error) {
        console.log('Upload error:', error);
        return res.status(400).json({ message: error.message });
    }
    next();
});

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection FAILED!", error);
        process.exit(1);
    }
};

// --- Schemas ---

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // unique: true already creates index
    password: { type: String, required: true },
    otp: { type: String },
    otpVerified: { type: Boolean, default: false },
    profilePicture: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// Add indexes for better query performance
// Note: email index already created by unique: true, no need to add again
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

const questionSchema = new mongoose.Schema({ text: { type: String, required: true }, options: [{ type: String, required: true }], correctAnswerIndex: { type: Number, required: true }});

const quizSchema = new mongoose.Schema({ title: { type: String, required: true }, description: { type: String }, creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, quizCode: { type: String, required: true, unique: true }, settings: { numQuestions: { type: Number, required: true }, timePerQuestion: { type: Number, required: true }, pointsPerQuestion: { type: Number, required: true } }, questions: [questionSchema]}, { timestamps: true });
const Quiz = mongoose.model('Quiz', quizSchema);


// --- Middleware ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};


// --- API Routes ---

// Registration Step 1: Generate OTP and send email
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User with this email already exists." });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Save user with OTP, not verified yet
        const newUser = new User({ fullName, email, password: hashedPassword, otp, otpVerified: false });
        await newUser.save();

        // Send OTP via Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });
        const mailOptions = {
            from: `"Quiz Spark ✨" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🔐 Your Quiz Spark Verification Code',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
        .otp-label { color: #ffffff; font-size: 14px; margin-bottom: 10px; letter-spacing: 1px; }
        .otp-code { font-size: 48px; font-weight: bold; color: #ffffff; letter-spacing: 8px; margin: 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .info-box { background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box p { margin: 5px 0; color: #1976d2; font-size: 14px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning p { margin: 5px 0; color: #856404; font-size: 14px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
        .footer p { color: #666; font-size: 14px; margin: 5px 0; }
        .social-links { margin: 20px 0; }
        .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ Quiz Spark ✨</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Welcome to the Ultimate Quiz Platform</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello <strong>${fullName}</strong>,</p>
            <p style="color: #555; line-height: 1.6;">
                Thank you for registering with <strong>Quiz Spark</strong>! We're excited to have you join our community of quiz enthusiasts.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-top: 20px;">
                To complete your registration, please use the verification code below:
            </p>
            
            <div class="otp-box">
                <p class="otp-label">YOUR VERIFICATION CODE</p>
                <div class="otp-code">${otp}</div>
                <p style="color: #ffffff; font-size: 12px; margin-top: 15px;">Valid for 10 minutes</p>
            </div>
            
            <div class="info-box">
                <p><strong>📌 How to use:</strong></p>
                <p>1. Return to the Quiz Spark registration page</p>
                <p>2. Enter this 6-digit code in the OTP field</p>
                <p>3. Click "Verify" to activate your account</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>• Never share this code with anyone</p>
                <p>• Quiz Spark team will never ask for your OTP</p>
                <p>• This code expires in 10 minutes</p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-top: 30px;">
                If you didn't request this code, please ignore this email or contact our support team.
            </p>
        </div>
        
        <div class="footer">
            <p style="font-weight: 600; color: #333;">Quiz Spark Team ✨</p>
            <p>Your Ultimate Quiz Platform</p>
            <div class="social-links">
                <a href="#">Website</a> | 
                <a href="#">Support</a> | 
                <a href="#">Privacy Policy</a>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
                © 2025 Quiz Spark. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
            `,
        };
        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "OTP sent to your email!" });
    } catch (error) {
        console.error("Registration error:", error);
        console.error("Error details:", error.message);
        res.status(500).json({ 
            message: "Server error during registration.", 
            error: error.message 
        });
    }
});

// Registration Step 2: Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found." });
        if (user.otpVerified) return res.status(400).json({ message: "OTP already verified." });
        if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });
        user.otpVerified = true;
        user.otp = undefined;
        await user.save();
        res.status(200).json({ message: "OTP verified, registration complete!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during OTP verification.", error });
    }
});


// Test email configuration
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('Testing email configuration...');
        console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'SET' : 'NOT SET');
        console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'SET (hidden)' : 'NOT SET');
        
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            return res.status(500).json({ 
                message: "Email not configured",
                gmailUser: !!process.env.GMAIL_USER,
                gmailPass: !!process.env.GMAIL_PASS
            });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Quiz Spark Test ✨" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: 'Test Email - Quiz Spark',
            text: 'If you receive this, email configuration is working!'
        });

        res.status(200).json({ message: "Test email sent successfully! Check your inbox." });
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({ 
            message: "Email test failed", 
            error: error.message 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials." });
        if (!user.otpVerified) return res.status(400).json({ message: "OTP not verified. Please verify OTP before login." });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });
        const token = jwt.sign({ userId: user._id.toString(), fullName: user.fullName }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Login successful!", token, userId: user._id });
    } catch (error) { res.status(500).json({ message: "Server error during login." }); }
});

app.post('/api/quizzes/create', authMiddleware, async (req, res) => {
    try {
        const { title, description, numQuestions, timePerQuestion, pointsPerQuestion } = req.body;
        const creatorId = req.user.userId;
        const quizCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newQuiz = new Quiz({
            title, description, creatorId, quizCode,
            settings: { numQuestions, timePerQuestion, pointsPerQuestion }
        });
        await newQuiz.save();
        res.status(201).json({ message: "Quiz created successfully!", quiz: newQuiz });
    } catch (error) {
        console.error("Error creating quiz:", error);
        res.status(500).json({ message: "Server error while creating quiz." });
    }
});

app.get('/api/quizzes', authMiddleware, async (req, res) => {
    try {
        const quizzes = await Quiz.find({ creatorId: req.user.userId });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch quizzes", error });
    }
});

app.post('/api/quizzes/:quizId/questions', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });
        if (quiz.creatorId.toString() !== req.user.userId) return res.status(403).json({ message: "You are not authorized." });
        quiz.questions = req.body.questions;
        await quiz.save();
        res.status(200).json({ message: 'Questions added successfully', quiz });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add questions', error });
    }
});

app.delete('/api/quizzes/:quizId', authMiddleware, async (req, res) => {
    try {
        await Quiz.findByIdAndDelete(req.params.quizId);
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete quiz', error });
    }
});

app.put('/api/quizzes/:quizId', authMiddleware, async (req, res) => {
    try {
        const { title, description, settings } = req.body;
        const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.quizId, { title, description, settings }, { new: true });
        res.status(200).json({ message: 'Quiz updated successfully', quiz: updatedQuiz });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update quiz', error });
    }
});

app.post('/api/quizzes/join', authMiddleware, async (req, res) => {
    try {
        const { roomCode } = req.body;
        const quiz = await Quiz.findOne({ quizCode: roomCode.toUpperCase() });
        if (!quiz) return res.status(404).json({ message: "Quiz with this code not found." });
        res.status(200).json({ message: "Quiz found!", quiz });
    } catch (error) {
        res.status(500).json({ message: "Server error while joining quiz." });
    }
});

// --- User Profile Routes ---

// Change Password
app.post('/api/user/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide both current and new password." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long." });
        }

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully!" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Server error while changing password." });
    }
});

// Change Username
app.put('/api/user/username', authMiddleware, async (req, res) => {
    try {
        const { newUsername } = req.body;
        
        if (!newUsername || newUsername.trim().length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long." });
        }

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.fullName = newUsername.trim();
        await user.save();

        res.status(200).json({ 
            message: "Username changed successfully!",
            fullName: user.fullName
        });
    } catch (error) {
        console.error("Error changing username:", error);
        res.status(500).json({ message: "Server error while changing username." });
    }
});

// Update Profile Picture
app.post('/api/user/profile-picture', authMiddleware, async (req, res) => {
    try {
        const { profilePicture } = req.body; // base64 string or empty string to remove
        
        // Allow empty string to remove profile picture
        if (profilePicture === undefined || profilePicture === null) {
            return res.status(400).json({ message: "No profile picture data provided." });
        }

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.profilePicture = profilePicture; // Can be empty string to remove
        await user.save();

        const message = profilePicture === '' 
            ? "Profile picture removed successfully!" 
            : "Profile picture updated successfully!";

        res.status(200).json({ 
            message: message,
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error("Error updating profile picture:", error);
        res.status(500).json({ message: "Server error while updating profile picture." });
    }
});

// Get User Profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -otp');
        if (!user) return res.status(404).json({ message: "User not found." });
        
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error while fetching profile." });
    }
});

// Submit Feedback
app.post('/api/feedback', authMiddleware, async (req, res) => {
    try {
        const { message, rating } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: "Feedback message is required." });
        }

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const feedback = new Feedback({
            userId: req.user.userId,
            userName: user.fullName,
            email: user.email,
            message,
            rating: rating || 5
        });

        await feedback.save();
        res.status(201).json({ message: "Thank you for your feedback!" });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).json({ message: "Server error while submitting feedback." });
    }
});

// Get All Feedbacks (Admin only - specific email)
app.get('/api/feedback', authMiddleware, async (req, res) => {
    try {
        // Check if user is the admin
        const user = await User.findById(req.user.userId);
        const adminEmail = 'princesoni.it@gmail.com';
        
        if (user.email !== adminEmail) {
            return res.status(403).json({ 
                message: "Access denied. Only admin can view feedbacks." 
            });
        }

        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(50);
        res.status(200).json({ feedbacks });
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ message: "Server error while fetching feedbacks." });
    }
});

// Delete Feedback (Admin only)
app.delete('/api/feedback/:feedbackId', authMiddleware, async (req, res) => {
    try {
        // Check if user is the admin
        const user = await User.findById(req.user.userId);
        const adminEmail = 'princesoni.it@gmail.com';
        
        if (user.email !== adminEmail) {
            return res.status(403).json({ 
                message: "Access denied. Only admin can delete feedbacks." 
            });
        }

        const { feedbackId } = req.params;
        
        console.log('Deleting feedback with ID:', feedbackId);
        
        const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);
        
        if (!deletedFeedback) {
            return res.status(404).json({ message: "Feedback not found." });
        }

        console.log('Feedback deleted successfully:', deletedFeedback);
        res.status(200).json({ message: "Feedback deleted successfully!" });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).json({ message: "Server error while deleting feedback.", error: error.message });
    }
});

// --- Admin User Management Routes ---

// Get All Users (Admin only)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
    try {
        // Check if user is the admin
        const user = await User.findById(req.user.userId);
        const adminEmail = 'princesoni.it@gmail.com';
        
        if (user.email !== adminEmail) {
            return res.status(403).json({ 
                message: "Access denied. Only admin can view users." 
            });
        }

        const users = await User.find().select('-password -otp').sort({ createdAt: -1 });
        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error while fetching users." });
    }
});

// Delete User (Admin only)
app.delete('/api/admin/users/:userId', authMiddleware, async (req, res) => {
    try {
        // Check if user is the admin
        const admin = await User.findById(req.user.userId);
        const adminEmail = 'princesoni.it@gmail.com';
        
        if (admin.email !== adminEmail) {
            return res.status(403).json({ 
                message: "Access denied. Only admin can delete users." 
            });
        }

        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (userId === req.user.userId) {
            return res.status(400).json({ 
                message: "You cannot delete your own account." 
            });
        }

        // Delete user's quizzes first
        await Quiz.deleteMany({ creatorId: userId });

        // Delete user's feedbacks
        await Feedback.deleteMany({ userId: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "User and all associated data deleted successfully!" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error while deleting user." });
    }
});

// --- Forgot Password Routes ---

// Step 1: Send OTP for password reset
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        await user.save();

        // Send OTP via email
        console.log('=== FORGOT PASSWORD OTP ===');
        console.log('Email:', email);
        console.log('OTP:', otp);
        console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'SET' : 'NOT SET');
        console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'SET (hidden)' : 'NOT SET');
        console.log('========================');

        // Check if email is configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            console.warn('⚠️ Email not configured! OTP printed in console above.');
            return res.status(200).json({ 
                message: "OTP generated successfully! (Check server console for OTP - Email not configured)" 
            });
        }

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"Quiz Spark ✨" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: '🔑 Reset Your Quiz Spark Password',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .otp-box { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3); }
        .otp-label { color: #ffffff; font-size: 14px; margin-bottom: 10px; letter-spacing: 1px; }
        .otp-code { font-size: 48px; font-weight: bold; color: #ffffff; letter-spacing: 8px; margin: 10px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .info-box { background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box p { margin: 5px 0; color: #e65100; font-size: 14px; }
        .warning { background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning p { margin: 5px 0; color: #c62828; font-size: 14px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; }
        .footer p { color: #666; font-size: 14px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Password Reset</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Quiz Spark Security</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello <strong>${user.fullName}</strong>,</p>
            <p style="color: #555; line-height: 1.6;">
                We received a request to reset your <strong>Quiz Spark</strong> account password.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-top: 20px;">
                Use the verification code below to reset your password:
            </p>
            
            <div class="otp-box">
                <p class="otp-label">PASSWORD RESET CODE</p>
                <div class="otp-code">${otp}</div>
                <p style="color: #ffffff; font-size: 12px; margin-top: 15px;">Valid for 10 minutes</p>
            </div>
            
            <div class="info-box">
                <p><strong>📌 Next Steps:</strong></p>
                <p>1. Return to the Quiz Spark password reset page</p>
                <p>2. Enter this 6-digit code</p>
                <p>3. Create your new password</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Security Alert:</strong></p>
                <p>• If you didn't request this reset, please ignore this email</p>
                <p>• Your password will remain unchanged</p>
                <p>• Consider changing your password if you suspect unauthorized access</p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-top: 30px;">
                For security reasons, this code will expire in 10 minutes.
            </p>
        </div>
        
        <div class="footer">
            <p style="font-weight: 600; color: #333;">Quiz Spark Team ✨</p>
            <p>Your Ultimate Quiz Platform</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
                © 2025 Quiz Spark. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: "OTP sent to your email successfully!" });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            res.status(200).json({ 
                message: "OTP generated! Check server console (Email sending failed)" 
            });
        }
    } catch (error) {
        console.error("Error sending reset OTP:", error);
        res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
});

// Step 2: Verify OTP for password reset
app.post('/api/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        res.status(200).json({ message: "OTP verified successfully! You can now reset your password." });
    } catch (error) {
        console.error("Error verifying reset OTP:", error);
        res.status(500).json({ message: "Server error while verifying OTP." });
    }
});

// Step 3: Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = ''; // Clear OTP after successful reset
        await user.save();

        res.status(200).json({ message: "Password reset successfully! You can now login with your new password." });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Server error while resetting password." });
    }
});

// Test upload endpoint
app.post('/api/test-upload', upload.single('file'), (req, res) => {
    console.log('Test upload - File received:', req.file);
    if (!req.file) {
        return res.status(400).json({ message: 'No file received' });
    }
    res.json({ message: 'File uploaded successfully!', file: req.file });
});

// Upload Excel/CSV file and parse questions
app.post('/api/quizzes/:quizId/upload-questions', authMiddleware, upload.single('file'), async (req, res) => {
    let filePath = null;
    try {
        console.log('=== Upload Request Started ===');
        console.log('Quiz ID:', req.params.quizId);
        console.log('File received:', req.file ? 'YES' : 'NO');
        
        if (!req.file) {
            console.log('ERROR: No file in request');
            return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
        }

        filePath = req.file.path;
        console.log('File path:', filePath);
        console.log('File name:', req.file.originalname);
        console.log('File size:', req.file.size, 'bytes');

        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) {
            console.log('ERROR: Quiz not found');
            return res.status(404).json({ message: "Quiz not found" });
        }
        if (quiz.creatorId.toString() !== req.user.userId) {
            console.log('ERROR: Unauthorized user');
            return res.status(403).json({ message: "You are not authorized." });
        }

        console.log('Reading file...');
        // Read the uploaded file with better error handling
        let workbook;
        try {
            workbook = xlsx.readFile(filePath, { 
                cellDates: true,
                cellNF: false,
                cellText: false
            });
        } catch (readError) {
            console.error('File read error:', readError);
            throw new Error('Failed to read file. Please ensure it is a valid Excel or CSV file.');
        }

        const sheetName = workbook.SheetNames[0];
        console.log('Sheet name:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { 
            defval: '',
            blankrows: false
        });

        console.log('Total rows read:', data.length);

        if (data.length === 0) {
            throw new Error('The file is empty or has no valid data.');
        }

        // Filter out empty rows
        const filteredData = data.filter(row => {
            return row.Question && (row.Option1 || row.Option2 || row.Option3 || row.Option4);
        });

        console.log('Valid rows after filtering:', filteredData.length);

        if (filteredData.length === 0) {
            throw new Error('No valid questions found. Please check your file format.');
        }

        // Parse questions from Excel
        const questions = [];
        const errors = [];

        for (let i = 0; i < filteredData.length; i++) {
            const row = filteredData[i];
            const rowNum = i + 2; // Excel row number (accounting for header)

            try {
                // Check for missing fields
                const missingFields = [];
                if (!row.Question || row.Question.toString().trim() === '') missingFields.push('Question');
                if (!row.Option1 || row.Option1.toString().trim() === '') missingFields.push('Option1');
                if (!row.Option2 || row.Option2.toString().trim() === '') missingFields.push('Option2');
                if (!row.Option3 || row.Option3.toString().trim() === '') missingFields.push('Option3');
                if (!row.Option4 || row.Option4.toString().trim() === '') missingFields.push('Option4');
                if (!row.CorrectAnswer && row.CorrectAnswer !== 0) missingFields.push('CorrectAnswer');
                
                if (missingFields.length > 0) {
                    errors.push(`Row ${rowNum}: Missing ${missingFields.join(', ')}`);
                    continue;
                }

                const correctAnswerIndex = parseInt(row.CorrectAnswer) - 1; // Convert 1-4 to 0-3
                if (isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
                    errors.push(`Row ${rowNum}: CorrectAnswer must be 1, 2, 3, or 4 (got: ${row.CorrectAnswer})`);
                    continue;
                }

                questions.push({
                    text: row.Question.toString().trim(),
                    options: [
                        row.Option1.toString().trim(),
                        row.Option2.toString().trim(),
                        row.Option3.toString().trim(),
                        row.Option4.toString().trim()
                    ],
                    correctAnswerIndex: correctAnswerIndex
                });
            } catch (rowError) {
                errors.push(`Row ${rowNum}: ${rowError.message}`);
            }
        }

        console.log('Questions parsed:', questions.length);
        console.log('Errors:', errors.length);

        if (questions.length === 0) {
            const errorMsg = errors.length > 0 
                ? `No valid questions found. Errors:\n${errors.join('\n')}`
                : 'No valid questions found in the file.';
            throw new Error(errorMsg);
        }

        // Add questions to quiz
        quiz.questions = questions;
        await quiz.save();
        console.log('Questions saved to database');

        // Delete uploaded file after processing
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Temporary file deleted');
        }

        const responseMsg = errors.length > 0
            ? `Successfully uploaded ${questions.length} questions! (${errors.length} rows had errors)`
            : `Successfully uploaded ${questions.length} questions!`;

        res.status(200).json({ 
            message: responseMsg,
            questionsCount: questions.length,
            errors: errors.length > 0 ? errors : undefined,
            quiz 
        });
    } catch (error) {
        // Clean up file if error occurs
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('Temporary file deleted after error');
            } catch (unlinkError) {
                console.error('Failed to delete temp file:', unlinkError);
            }
        }
        console.error('=== Upload Error ===');
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to upload questions' });
    }
});


// --- Real-time Logic with Socket.IO ---
const quizRooms = {}; 

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (data) => {
    const { roomCode, user } = data;
    socket.join(roomCode);
    user.socketId = socket.id;
        if (!quizRooms[roomCode]) quizRooms[roomCode] = { players: [], quiz: null, currentQuestion: -1, quizTimer: null };
        const userExists = quizRooms[roomCode].players.find(p => p.id === user.id);
        if (!userExists) {
            // Initialize score, hasAnswered, and questionSequence for every player
            quizRooms[roomCode].players.push({
                ...user,
                score: 0,
                hasAnswered: false,
                currentQuestionIndex: 0, // Track current question for this player
                questionSequence: [] // Will be filled when quiz starts
            });
        }
        io.to(roomCode).emit('update_student_list', quizRooms[roomCode].players);
  });

  socket.on('kick_student', (data) => {
    const { roomCode, studentId } = data;
    if (quizRooms[roomCode]) {
        const studentToKick = quizRooms[roomCode].players.find(u => u.id === studentId);
        quizRooms[roomCode].players = quizRooms[roomCode].players.filter(u => u.id !== studentId);
        io.to(roomCode).emit('update_student_list', quizRooms[roomCode].players);
        if (studentToKick && studentToKick.socketId) io.to(studentToKick.socketId).emit('you_were_kicked');
    }
  });

  socket.on('start_quiz', async (roomCode) => {
    const quiz = await Quiz.findOne({ quizCode: roomCode });
    if (!quiz || quiz.questions.length === 0) return;

    if(quizRooms[roomCode]) {
        // Assign random question sequence to each player
        quizRooms[roomCode].players.forEach(player => {
            player.score = 0;
            player.currentQuestionIndex = 0;
            player.hasAnswered = false;
            // Create shuffled array of question indices
            player.questionSequence = shuffleArray([...Array(quiz.questions.length).keys()]);
        });
        quizRooms[roomCode].quiz = quiz;
    }
    
    io.to(roomCode).emit('quiz_starting');
    
    setTimeout(() => {
        io.to(roomCode).emit('quiz_started', quiz);
        setTimeout(() => {
            sendFirstQuestionToAll(roomCode);
        }, 500);
    }, 4000); 
  });

  socket.on('submit_answer', (data) => {
    const { roomCode, userId, questionIndex, selectedOptionIndex } = data;
    const room = quizRooms[roomCode];
    if (!room || !room.quiz) return;
    
    const { quiz } = room;
    const question = quiz.questions[questionIndex];
    const player = room.players.find(p => p.id === userId);

    if (question && player && !player.hasAnswered) {
      // Check if answer is correct (selectedOptionIndex === -1 means no answer/timeout)
      if (selectedOptionIndex !== -1 && question.correctAnswerIndex === selectedOptionIndex) {
        player.score = (player.score || 0) + quiz.settings.pointsPerQuestion;
      }
      player.hasAnswered = true;
      player.currentQuestionIndex++;
      
      // Send next question to this specific player
      sendNextQuestionToPlayer(roomCode, player);
    }
    io.to(roomCode).emit('update_leaderboard', room.players);
  });
  
  socket.on('disconnect', () => {
    for (const roomCode in quizRooms) {
        const room = quizRooms[roomCode];
        if (room) {
            const initialLength = room.players.length;
            room.players = room.players.filter(user => user.socketId !== socket.id);
            if (initialLength > room.players.length) {
                io.to(roomCode).emit('update_student_list', room.players);
            }
        }
    }
  });
});

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Send first question to all players
function sendFirstQuestionToAll(roomCode) {
    const room = quizRooms[roomCode];
    if (!room || !room.quiz) return;
    
    room.players.forEach(player => {
        sendNextQuestionToPlayer(roomCode, player);
    });
}

// Send next question to a specific player
function sendNextQuestionToPlayer(roomCode, player) {
    const room = quizRooms[roomCode];
    if (!room || !room.quiz) return;
    
    const { quiz } = room;
    
    // Check if player has finished all questions
    if (player.currentQuestionIndex >= quiz.questions.length) {
        // Notify this player that they're done
        io.to(player.socketId).emit('player_finished');
        
        // Check if all players are done
        const allFinished = room.players.every(p => p.currentQuestionIndex >= quiz.questions.length);
        if (allFinished) {
            io.to(roomCode).emit('quiz_finished', room.players);
        }
        return;
    }
    
    // Get the question index from player's shuffled sequence
    const questionIndex = player.questionSequence[player.currentQuestionIndex];
    const question = quiz.questions[questionIndex];
    
    player.hasAnswered = false;
    
    // Send question only to this specific player
    io.to(player.socketId).emit('new_question', { 
        question, 
        questionNumber: player.currentQuestionIndex + 1,
        totalQuestions: quiz.questions.length,
        questionIndex: questionIndex // Send actual index for answer submission
    });
}

// --- Server Start ---
connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server with real-time features is running on port ${PORT}.`));
});

