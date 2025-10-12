import { useState } from 'react';
import axios from 'axios';
import './App.css';

function CreateQuiz({ onBack, onQuizCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(1);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // --- JAASOOSI TOOL ---
    console.log("Create Quiz button clicked! Function is running.");
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Your session has expired. Please log in again.");
      console.log("Error: No token found.");
      return;
    }

    const quizSettings = { title, description, numQuestions, timePerQuestion, pointsPerQuestion };
    console.log("Sending these settings to backend:", quizSettings);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/quizzes/create`, quizSettings, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log("Backend response received:", response.data);
      onQuizCreated(response.data.quiz);

    } catch (error) {
      console.error("--- REAL ERROR from frontend: ---", error);
      alert(error.response?.data?.message || 'An error occurred while creating the quiz.');
    }
  };

  return (
    <div className="create-quiz-container">
      <div className="auth-container">
        <h2>Create Your Quiz</h2>
        <p>Fill in the details to start a new quiz room.</p>
        <p>Fill in the details correctly. You cannot change quiz settings after creation, only questions can be modified.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" placeholder="Quiz Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea placeholder="Quiz Description..." value={description} onChange={(e) => setDescription(e.target.value)} required rows="3"></textarea>
          <label>Number of Questions:</label>
          <input type="number" min="1" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} required />
          <label>Time per Question (in seconds):</label>
          <input type="number" min="5" value={timePerQuestion} onChange={(e) => setTimePerQuestion(e.target.value)} required />
          <label>Points per Question:</label>
          <input type="number" min="1" value={pointsPerQuestion} onChange={(e) => setPointsPerQuestion(e.target.value)} required />
          <button type="submit" className="btn create-btn">Create Quiz & Add Questions</button>
          <button type="button" onClick={onBack} className="back-btn blue-back-btn">← Back to Dashboard</button>
        </form>
      </div>
    </div>
  );
}

export default CreateQuiz;