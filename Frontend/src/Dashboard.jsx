import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function Dashboard({ onCreateQuiz, onStartQuiz, onEditQuiz, onBack, onSoloPlay }) { // onSoloPlay added
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setQuizzes([]);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/quizzes`, { // URL se creatorId hataya
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setQuizzes(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Failed to fetch quizzes", error);
      setQuizzes([]); // Set empty array on error
      alert("Failed to load quizzes. Please check your connection or login again.");
    }
  };

  // Naya function: Quiz delete karne ke liye
  const handleDelete = async (quizId) => {
    // Confirmation pop-up
    if (window.confirm("Are you sure you want to delete this quiz permanently?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Quiz deleted successfully!");
        fetchQuizzes(); // List ko refresh karo
      } catch (error) {
        alert("Failed to delete quiz.");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <header className="app-header" style={{ textAlign: 'center' }}>
        <h1>Admin Dashboard</h1>
        <p>Manage your quizzes or create a new one.</p>
      </header>

      <div className="dashboard-button-row">
        <button
          onClick={onBack}
          className="btn join-btn"
        >
          Back to Home
        </button>
        
        <button onClick={onCreateQuiz} className="btn create-btn">
          + Create New Quiz
        </button>
      </div>

      <div className="quiz-list-container">
        <h2>Your Quizzes</h2>
        <div className="quiz-list">
          {quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-list-item">
                <div className="quiz-info">
                  <h3>{quiz.title}</h3>
                  <p>Code: <strong>{quiz.quizCode}</strong> | Questions: {quiz.questions.length}/{quiz.settings.numQuestions}</p>
                </div>
                <div className="quiz-actions">
                    {/* Edit, Delete, Solo Play, and Start Quiz buttons */}
                    <button onClick={() => onEditQuiz(quiz)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(quiz._id)} className="btn-delete">Delete</button>
                    <button 
                      onClick={() => onSoloPlay(quiz)} 
                      className="btn-solo"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      🎮 Solo Play
                    </button>
                    <button onClick={() => onStartQuiz(quiz)} className="btn-start">Start Quiz</button>
                </div>
              </div>
            ))
          ) : (
            <p>You haven't created any quizzes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

