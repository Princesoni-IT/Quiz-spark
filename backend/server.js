
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ["http://localhost:5173", "https://quiz-spark.netlify.app"], methods: ["GET", "POST", "PUT", "DELETE"] }});
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpVerified: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

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
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your QuizSpark OTP',
text: `Hello,
Thank you for registering on quiz Spark!
Your OTP for registration is: 
        ${otp}
⚠️This OTP is valid for 10 minutes. 
Please do not share it with anyone.

If you did not request this, please ignore this email.

Regards,
Team Quiz Spark✨`,
        };
        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "OTP sent to your email!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during registration.", error });
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

