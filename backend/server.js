const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", methods: ["GET", "POST", "PUT", "DELETE"] }});
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Database Connection & Schemas ---
const connectDB = async () => { /* ... (Same as before) ... */ };
const userSchema = new mongoose.Schema({ fullName: { type: String, required: true }, mobileNumber: { type: String, required: true, unique: true }, password: { type: String, required: true }});
const User = mongoose.model('User', userSchema);
const questionSchema = new mongoose.Schema({ text: { type: String, required: true }, options: [{ type: String, required: true }], correctAnswerIndex: { type: Number, required: true }});
const quizSchema = new mongoose.Schema({ title: { type: String, required: true }, description: { type: String }, creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, quizCode: { type: String, required: true, unique: true }, settings: { numQuestions: { type: Number, required: true }, timePerQuestion: { type: Number, required: true }, pointsPerQuestion: { type: Number, required: true } }, questions: [questionSchema]}, { timestamps: true });
const Quiz = mongoose.model('Quiz', quizSchema);

// --- Middleware & API Routes ---
const authMiddleware = (req, res, next) => { /* ... (Same as before) ... */ };
app.post('/api/register', async (req, res) => { /* ... (Same as before) ... */ });
app.post('/api/login', async (req, res) => { /* ... (Same as before) ... */ });
app.post('/api/quizzes/create', authMiddleware, async (req, res) => { /* ... (Same as before) ... */ });
app.get('/api/quizzes', authMiddleware, async (req, res) => { /* ... (Same as before) ... */ });
app.post('/api/quizzes/:quizId/questions', authMiddleware, async (req, res) => { /* ... (Same as before) ... */ });
app.delete('/api/quizzes/:quizId', authMiddleware, async (req, res) => { /* ... (Same as before) ... */ });
app.put('/api/quizzes/:quizId', authMiddleware, async (req, res) => { /* ... (Same as before) ... */ });
app.post('/api/quizzes/join', authMiddleware, async (req, res) => { /* ... (Same as before) ... */ });


// --- Real-time Logic with Socket.IO ---
const quizRooms = {}; 

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (data) => {
    const { roomCode, user } = data;
    socket.join(roomCode);
    user.socketId = socket.id;
    if (!quizRooms[roomCode]) quizRooms[roomCode] = { players: [], currentQuestion: -1, quizTimer: null, quiz: null };
    const userExists = quizRooms[roomCode].players.find(p => p.id === user.id);
    if (!userExists) quizRooms[roomCode].players.push(user);
    io.to(roomCode).emit('update_student_list', quizRooms[roomCode].players);
  });

  socket.on('kick_student', (data) => { /* ... (Same as before) ... */ });

  // --- START QUIZ LOGIC (THE FIX) ---
  socket.on('start_quiz', async (roomCode) => {
    const quiz = await Quiz.findOne({ quizCode: roomCode });
    if (!quiz || quiz.questions.length === 0) return;

    if(quizRooms[roomCode]) {
        quizRooms[roomCode].players.forEach(player => player.score = 0);
        quizRooms[roomCode].quiz = quiz; // Quiz details ko room mein save kiya
    }
    
    io.to(roomCode).emit('quiz_starting');
    
    // 4 second baad countdown khatam hoga
    setTimeout(() => {
        io.to(roomCode).emit('quiz_started', quiz);
        
        // 1 second aur ruko taaki frontend taiyaar ho jaye
        setTimeout(() => {
            sendQuestion(roomCode, 0);
        }, 1000);
    }, 4000); 
  });
  // --- END OF FIX ---

  socket.on('submit_answer', (data) => {
    const { roomCode, userId, questionIndex, selectedOptionIndex } = data;
    const room = quizRooms[roomCode];
    if (!room) return;
    
    const quiz = room.quiz; // Ab quiz room se nikala
    const question = quiz.questions[questionIndex];
    const player = room.players.find(p => p.id === userId);

    if (question && player && !player.hasAnswered) {
      if (question.correctAnswerIndex === selectedOptionIndex) {
        player.score += quiz.settings.pointsPerQuestion;
      }
      player.hasAnswered = true;
    }
    io.to(roomCode).emit('update_leaderboard', room.players);
  });
  
  socket.on('disconnect', () => { /* ... (Same as before) ... */ });
});

function sendQuestion(roomCode, questionIndex) {
    const room = quizRooms[roomCode];
    if (!room) return;
    
    const quiz = room.quiz;

    if (questionIndex >= quiz.questions.length) {
        io.to(roomCode).emit('quiz_finished', room.players);
        if(room.quizTimer) clearTimeout(room.quizTimer);
        return;
    }

    room.players.forEach(player => player.hasAnswered = false);
    room.currentQuestion = questionIndex;
    const question = quiz.questions[questionIndex];
    io.to(roomCode).emit('new_question', { question, questionNumber: questionIndex + 1 });

    if (room.quizTimer) clearTimeout(room.quizTimer);

    room.quizTimer = setTimeout(() => {
        sendQuestion(roomCode, questionIndex + 1);
    }, (quiz.settings.timePerQuestion + 2) * 1000);
}

// --- Server Start ---
connectDB().then(() => {
    server.listen(PORT, () => console.log(`Server with real-time features is running on port ${PORT}.`));
});

