import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function Dashboard({ onCreateQuiz, onStartQuiz, onEditQuiz }) { // onEditQuiz naya prop
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) return;

      const response = await axios.get(`http://localhost:3000/api/quizzes`, { // URL se creatorId hataya
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error("Failed to fetch quizzes", error);
      alert("Could not fetch your quizzes.");
    }
  };

  // Naya function: Quiz delete karne ke liye
  const handleDelete = async (quizId) => {
    // Confirmation pop-up
    if (window.confirm("Are you sure you want to delete this quiz permanently?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/api/quizzes/${quizId}`, {
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
      <header className="app-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your quizzes or create a new one.</p>
      </header>
      
      <div className="dashboard-actions">
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
                    {/* Naye Edit aur Delete buttons */}
                    <button onClick={() => onEditQuiz(quiz)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(quiz._id)} className="btn-delete">Delete</button>
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

