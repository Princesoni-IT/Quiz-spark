
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
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

// CORS configuration
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://quiz-spark.netlify.app",
        /\.netlify\.app$/
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

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

// In-memory storage for pending registrations (before OTP verification)
const pendingRegistrations = new Map();

// Auto-cleanup expired OTPs (10 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of pendingRegistrations.entries()) {
        if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
            pendingRegistrations.delete(email);
            console.log('🗑️ Expired OTP removed for:', email);
        }
    }
}, 60 * 1000); // Check every minute

// ===== REGISTRATION FLOW =====

// Step 1: Register user and send OTP (DON'T save to database yet)
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        // Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }
        
        console.log('\n📝 Registration Request');
        console.log('Name:', fullName);
        console.log('Email:', email);
        
        // Check if user already exists in database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('❌ User already exists in database');
            return res.status(400).json({ message: "User with this email already exists." });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔐 OTP Generated:', otp);
        
        // Store in MEMORY (NOT in database)
        pendingRegistrations.set(email, {
            fullName,
            hashedPassword,
            otp,
            timestamp: Date.now()
        });
        
        console.log('✅ Stored in MEMORY (not in database yet)');
        console.log('⏳ Waiting for OTP verification...\n');
        
        // Send OTP in response
        res.status(200).json({ 
            success: true,
            message: "Registration initiated! Please verify OTP to complete.",
            otp: otp // OTP in response for popup/alert
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            message: "Server error during registration.", 
            error: error.message 
        });
    }
});

// Step 2: Verify OTP and SAVE to database
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Validation
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }
        
        console.log('\n🔍 OTP Verification Request');
        console.log('Email:', email);
        console.log('OTP:', otp);
        
        // Check if pending registration exists
        const pendingData = pendingRegistrations.get(email);
        if (!pendingData) {
            console.log('❌ No pending registration found');
            return res.status(400).json({ 
                message: "No pending registration found. Please register first." 
            });
        }
        
        // Check if OTP expired (10 minutes)
        const now = Date.now();
        const otpAge = now - pendingData.timestamp;
        if (otpAge > 10 * 60 * 1000) {
            pendingRegistrations.delete(email);
            console.log('❌ OTP expired (age:', Math.floor(otpAge / 1000), 'seconds)');
            return res.status(400).json({ 
                message: "OTP expired. Please register again." 
            });
        }
        
        // Verify OTP
        if (pendingData.otp !== otp) {
            console.log('❌ Invalid OTP');
            console.log('Expected:', pendingData.otp);
            console.log('Received:', otp);
            return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }
        
        console.log('✅ OTP verified successfully!');
        console.log('💾 Saving user to database...');
        
        // OTP is correct! Now save to database
        const newUser = new User({
            fullName: pendingData.fullName,
            email: email,
            password: pendingData.hashedPassword
        });
        
        await newUser.save();
        console.log('✅ User saved to database');
        console.log('User ID:', newUser._id);
        
        // Remove from pending registrations
        pendingRegistrations.delete(email);
        console.log('🗑️ Removed from pending registrations\n');
        
        res.status(201).json({ 
            success: true,
            message: "Registration complete! You can now login." 
        });
        
    } catch (error) {
        console.error('❌ OTP verification error:', error);
        res.status(500).json({ 
            message: "Server error during OTP verification.", 
            error: error.message 
        });
    }
});

// ===== LOGIN FLOW =====

// Login - Only for OTP verified users (who are in database)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        
        console.log('\n🔐 Login Request');
        console.log('Email:', email);
        
        // Find user in database
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(400).json({ 
                message: "Invalid email or password." 
            });
        }
        
        console.log('✅ User found in database');
        console.log('User ID:', user._id);
        console.log('Name:', user.fullName);
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.status(400).json({ 
                message: "Invalid email or password." 
            });
        }
        
        console.log('✅ Password verified');
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id.toString(), 
                fullName: user.fullName,
                email: user.email
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        console.log('✅ JWT token generated');
        console.log('Token expires in: 24 hours\n');
        
        res.status(200).json({ 
            success: true,
            message: "Login successful!",
            token: token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture || ''
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            message: "Server error during login.", 
            error: error.message 
        });
    }
});

// New Fixed Code for creating a quiz
app.post('/api/quizzes/create', authMiddleware, async (req, res) => {
    try {
        const { title, description, numQuestions, timePerQuestion, pointsPerQuestion } = req.body;
        const creatorId = req.user.userId;

        let quizCode;
        let isUnique = false;

        // Jab tak unique code na mil jaaye, naya code banate raho
        while (!isUnique) {
            quizCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const existingQuiz = await Quiz.findOne({ quizCode });
            if (!existingQuiz) {
                isUnique = true;
            }
        }

        const newQuiz = new Quiz({
            title, description, creatorId, quizCode,
            settings: { numQuestions, timePerQuestion, pointsPerQuestion }
        });

        await newQuiz.save();
        res.status(201).json({ message: "Quiz created successfully!", quiz: newQuiz });
    } catch (error) {
        console.error("Error creating quiz:", error);
        if (error.code === 11000) { // Handle rare race condition
             return res.status(500).json({ message: "Could not generate a unique quiz code, please try again." });
        }
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

// ===== FORGOT PASSWORD FLOW =====

// In-memory storage for password reset OTPs
const passwordResetOTPs = new Map();

// Auto-cleanup expired password reset OTPs (10 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [email, data] of passwordResetOTPs.entries()) {
        if (now - data.timestamp > 10 * 60 * 1000) { // 10 minutes
            passwordResetOTPs.delete(email);
            console.log('🗑️ Expired password reset OTP removed for:', email);
        }
    }
}, 60 * 1000); // Check every minute

// Step 1: Request password reset OTP
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validation
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }
        
        console.log('\n🔑 Password Reset Request');
        console.log('Email:', email);
        
        // Check if user exists in database
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(404).json({ 
                message: "No account found with this email." 
            });
        }
        
        console.log('✅ User found in database');
        console.log('User ID:', user._id);
        console.log('Name:', user.fullName);
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔐 Password Reset OTP Generated:', otp);
        
        // Store OTP in memory
        passwordResetOTPs.set(email, {
            otp,
            timestamp: Date.now()
        });
        
        console.log('✅ OTP stored in memory');
        console.log('⏳ Valid for 10 minutes\n');
        
        // Send OTP in response
        res.status(200).json({ 
            success: true,
            message: "Password reset OTP sent!",
            otp: otp // OTP in response for popup/alert
        });
        
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ 
            message: "Server error during password reset request.", 
            error: error.message 
        });
    }
});

// Step 2: Verify OTP and reset password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Validation
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ 
                message: "Email, OTP, and new password are required." 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters long." 
            });
        }
        
        console.log('\n🔍 Password Reset Verification');
        console.log('Email:', email);
        console.log('OTP:', otp);
        
        // Check if OTP exists in memory
        const resetData = passwordResetOTPs.get(email);
        if (!resetData) {
            console.log('❌ No password reset request found');
            return res.status(400).json({ 
                message: "No password reset request found. Please request a new OTP." 
            });
        }
        
        // Check if OTP expired (10 minutes)
        const now = Date.now();
        const otpAge = now - resetData.timestamp;
        if (otpAge > 10 * 60 * 1000) {
            passwordResetOTPs.delete(email);
            console.log('❌ OTP expired (age:', Math.floor(otpAge / 1000), 'seconds)');
            return res.status(400).json({ 
                message: "OTP expired. Please request a new one." 
            });
        }
        
        // Verify OTP
        if (resetData.otp !== otp) {
            console.log('❌ Invalid OTP');
            console.log('Expected:', resetData.otp);
            console.log('Received:', otp);
            return res.status(400).json({ 
                message: "Invalid OTP. Please try again." 
            });
        }
        
        console.log('✅ OTP verified successfully!');
        
        // Find user in database
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(404).json({ 
                message: "User not found." 
            });
        }
        
        console.log('💾 Updating password in database...');
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        console.log('✅ Password updated successfully');
        console.log('User ID:', user._id);
        
        // Remove OTP from memory
        passwordResetOTPs.delete(email);
        console.log('🗑️ Removed OTP from memory\n');
        
        res.status(200).json({ 
            success: true,
            message: "Password reset successfully! You can now login with your new password." 
        });
        
    } catch (error) {
        console.error('❌ Password reset error:', error);
        res.status(500).json({ 
            message: "Server error during password reset.", 
            error: error.message 
        });
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

