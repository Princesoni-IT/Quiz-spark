import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function AddQuestions({ quiz, onBack, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const downloadSampleTemplate = () => {
    // Create sample CSV content - CUSTOMIZE YOUR QUESTIONS HERE
    const csvContent = `Question,Option1,Option2,Option3,Option4,CorrectAnswer
What is the capital of India?,Mumbai,Delhi,Kolkata,Chennai,2
What is 5 + 3?,6,7,8,9,3
Which planet is known as the Red Planet?,Venus,Mars,Jupiter,Saturn,2
What is the largest ocean on Earth?,Atlantic,Indian,Arctic,Pacific,4
Who wrote Romeo and Juliet?,Charles Dickens,William Shakespeare,Mark Twain,Jane Austen,2
What is the chemical symbol for water?,H2O,CO2,O2,NaCl,1
How many continents are there?,5,6,7,8,3
What is the square root of 64?,6,7,8,9,3
Which gas do plants absorb from the atmosphere?,Oxygen,Nitrogen,Carbon Dioxide,Hydrogen,3
What is the capital of France?,London,Berlin,Paris,Rome,3`;

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_questions_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!allowedTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      alert('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading file to:', `${import.meta.env.VITE_API_URL}/api/quizzes/${quiz._id}/upload-questions`);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/quizzes/${quiz._id}/upload-questions`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log('Upload response:', response.data);
      
      let message = response.data.message;
      if (response.data.errors && response.data.errors.length > 0) {
        message += '\n\nErrors:\n' + response.data.errors.slice(0, 5).join('\n');
        if (response.data.errors.length > 5) {
          message += `\n... and ${response.data.errors.length - 5} more errors`;
        }
      }
      
      alert(message);
      setQuestions(response.data.quiz.questions);
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload file';
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="add-questions-container">
      {/* Back button ab Dashboard par jayega */}
      <div className="auth-container" style={{maxWidth: '800px'}}>
        <h2>{quiz.questions && quiz.questions.length > 0 ? 'Edit' : 'Add'} Questions for "{quiz.title}"</h2>
        
        {/* File Upload Section */}
        <div style={{ 
          backgroundColor: '#f0f4f8', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          border: '2px dashed #5a67d8'
        }}>
          <h3 style={{ marginTop: 0, color: '#1e2a78' }}>📁 Upload Questions from Excel/CSV</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
            Upload an Excel file with columns: <strong>Question, Option1, Option2, Option3, Option4, CorrectAnswer (1-4)</strong>
          </p>
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ marginBottom: '10px' }}
          />
          {uploading && <p style={{ color: '#5a67d8', fontWeight: 600 }}>⏳ Uploading and processing...</p>}
          <button 
            onClick={downloadSampleTemplate}
            style={{ 
              fontSize: '0.85rem', 
              color: '#5a67d8', 
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0
            }}
          >
            📥 Download Sample Template (CSV)
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '15px 0', color: '#999', fontWeight: 600 }}>
          OR
        </div>
        
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

