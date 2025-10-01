import React, { useState } from 'react';
import axios from 'axios'; // Backend se baat karne ke liye
import './App.css';

function JoinQuiz({ onBack, onQuizJoined }) {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = async (event) => {
    event.preventDefault();
    if (roomCode.trim().length !== 6) {
      alert('Please enter a valid 6-character room code.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Backend se pucha ki is code ka koi quiz hai ya nahi
      const response = await axios.post('http://localhost:3000/api/quizzes/join', 
        { roomCode: roomCode.toUpperCase() },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Agar quiz mil gaya, toh App.jsx ko batao
      onQuizJoined(response.data.quiz);

    } catch (error) {
      alert(error.response?.data?.message || 'Failed to find quiz.');
    }
  };

  return (
    <div className="join-quiz-container">
      <button onClick={onBack} className="back-btn">← Back to Home</button>
      <div className="auth-container">
        <h2>Join a Quiz Room</h2>
        <p>Enter the 6-character code given by your admin.</p>
        <form onSubmit={handleJoin} className="auth-form">
          <input
            type="text"
            placeholder="e.g., AB12CD"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            maxLength="6"
            className="room-code-input"
            required
          />
          <button type="submit" className="btn join-btn">Join Quiz</button>
        </form>
      </div>
    </div>
  );
}

export default JoinQuiz;

