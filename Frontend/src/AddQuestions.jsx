import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function AddQuestions({ quiz, onBack, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      setQuestions(quiz.questions);
    }
  }, [quiz]);

  const handleAddOrUpdateQuestion = () => {
    if (currentQuestion.trim() === '' || options.some(opt => opt.trim() === '')) {
      alert('Please fill out the question and all four options.');
      return;
    }
    const newQuestion = { text: currentQuestion, options, correctAnswerIndex: correctAnswer };

    let updatedQuestions;
    if (editingIndex !== null) {
      updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = newQuestion;
    } else {
      if (questions.length >= quiz.settings.numQuestions) {
        alert(`You have already added the required ${quiz.settings.numQuestions} questions.`);
        return;
      }
      updatedQuestions = [...questions, newQuestion];
    }
    
    setQuestions(updatedQuestions);
    resetForm();
  };

  const resetForm = () => {
    setCurrentQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
    setEditingIndex(null);
  };
  
  const handleEdit = (index) => {
    const questionToEdit = questions[index];
    setCurrentQuestion(questionToEdit.text);
    setOptions(questionToEdit.options);
    setCorrectAnswer(questionToEdit.correctAnswerIndex);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleFinish = () => {
    if (questions.length === 0 && quiz.settings.numQuestions > 0) {
        alert(`Please add at least one question.`);
        return;
    }
    onFinish(questions);
  };

  return (
    <div className="add-questions-container">
      {/* Back button ab Dashboard par jayega */}
      <div className="auth-container" style={{maxWidth: '800px'}}>
        <h2>{quiz.questions && quiz.questions.length > 0 ? 'Edit' : 'Add'} Questions for "{quiz.title}"</h2>
        
        <div className="question-form">
          <h3>{editingIndex !== null ? 'Update Question' : 'Add a New Question'}</h3>
          <textarea placeholder={`Question ${editingIndex !==null ? editingIndex + 1 : questions.length + 1}`} value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)} rows="3" />
          <div className="options-grid">
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input type="radio" name="correctAnswer" checked={correctAnswer === index} onChange={() => setCorrectAnswer(index)} />
                <input type="text" placeholder={`Option ${index + 1}`} value={option} onChange={(e) => handleOptionChange(index, e.target.value)} />
              </div>
            ))}
          </div>
          <button onClick={handleAddOrUpdateQuestion} className="btn join-btn" style={{width: '100%'}}>
            {editingIndex !== null ? 'Update Question' : `Add Question (${questions.length}/${quiz.settings.numQuestions})`}
          </button>
          {editingIndex !== null && <button onClick={resetForm} className="btn" style={{width: '100%', background: '#777'}}>Cancel Edit</button>}
        </div>
        
        <div className="questions-preview">
          <h3>Added Questions</h3>
          <div className="added-questions-list">
            {questions.length > 0 ? questions.map((q, index) => (
                <div key={index} className="question-list-item">
                    <span>{index + 1}. {q.text.substring(0, 50)}...</span>
                    <div className="question-actions">
                        <button onClick={() => handleEdit(index)}>Edit</button>
                        <button onClick={() => handleDelete(index)}>Delete</button>
                    </div>
                </div>
            )) : <p>No questions added yet.</p>}
          </div>
        </div>

        <button onClick={handleFinish} className="btn create-btn start-quiz-btn">
            Save Questions & Go to Dashboard
        </button>
        <button onClick={onBack} className="back-btn blue-back-btn">← Back to Dashboard</button>
      </div>
    </div>
  );
}

export default AddQuestions;

