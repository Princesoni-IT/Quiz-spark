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
    <div className="add-questions-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: window.innerWidth <= 768 ? '20px' : '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: window.innerWidth <= 768 ? '24px' : '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>
            {quiz.questions && quiz.questions.length > 0 ? '✏️ Edit' : '➕ Add'} Questions
          </h2>
          <p style={{
            fontSize: window.innerWidth <= 768 ? '14px' : '18px',
            color: '#666',
            fontWeight: '500'
          }}>
            for "{quiz.title}"
          </p>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            marginTop: '12px'
          }}>
            {questions.length} / {quiz.settings.numQuestions} Questions Added
          </div>
        </div>
        
        {/* File Upload Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          padding: window.innerWidth <= 768 ? '20px' : '30px', 
          borderRadius: '20px', 
          marginBottom: '30px',
          border: '3px dashed #667eea',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '50%'
          }}></div>
          
          <h3 style={{ 
            marginTop: 0, 
            color: '#667eea',
            fontSize: window.innerWidth <= 768 ? '18px' : '22px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            📁 Bulk Upload Questions
          </h3>
          <p style={{ 
            fontSize: window.innerWidth <= 768 ? '13px' : '15px', 
            color: '#555', 
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            Upload an Excel/CSV file with columns: <strong style={{ color: '#667eea' }}>Question, Option1, Option2, Option3, Option4, CorrectAnswer (1-4)</strong>
          </p>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 28px',
              borderRadius: '12px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              opacity: uploading ? 0.6 : 1
            }}>
              {uploading ? '⏳ Uploading...' : '📤 Choose File'}
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            
            <button 
              onClick={downloadSampleTemplate}
              style={{ 
                fontSize: '15px', 
                color: '#667eea', 
                background: 'white',
                border: '2px solid #667eea',
                borderRadius: '12px',
                padding: '12px 28px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#667eea';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#667eea';
              }}
            >
              📥 Download Template
            </button>
          </div>
        </div>

        <div style={{ 
          textAlign: 'center', 
          margin: '30px 0', 
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            height: '2px',
            background: 'linear-gradient(to right, transparent, #e0e0e0, transparent)'
          }}></div>
          <span style={{
            background: 'white',
            padding: '0 20px',
            color: '#999',
            fontWeight: '700',
            fontSize: '16px',
            position: 'relative',
            zIndex: 1
          }}>OR ADD MANUALLY</span>
        </div>
        
        {/* Question Form */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          padding: '30px',
          borderRadius: '20px',
          marginBottom: '30px',
          border: '2px solid rgba(102, 126, 234, 0.2)'
        }}>
          <h3 style={{
            color: '#667eea',
            fontSize: '20px',
            fontWeight: '700',
            marginTop: 0,
            marginBottom: '20px'
          }}>
            {editingIndex !== null ? '✏️ Update Question' : '➕ Add New Question'}
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#555',
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Question Text
            </label>
            <textarea 
              placeholder={`Enter question ${editingIndex !== null ? editingIndex + 1 : questions.length + 1}...`}
              value={currentQuestion} 
              onChange={(e) => setCurrentQuestion(e.target.value)} 
              rows="3"
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                fontSize: '15px',
                fontFamily: 'Poppins, sans-serif',
                resize: 'vertical',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#555',
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Answer Options (Select the correct one)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {options.map((option, index) => (
                <div 
                  key={index} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: correctAnswer === index ? 'rgba(102, 126, 234, 0.1)' : 'white',
                    padding: '12px 15px',
                    borderRadius: '12px',
                    border: correctAnswer === index ? '2px solid #667eea' : '2px solid #e0e0e0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <input 
                    type="radio" 
                    name="correctAnswer" 
                    checked={correctAnswer === index} 
                    onChange={() => setCorrectAnswer(index)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#667eea'
                    }}
                  />
                  <input 
                    type="text" 
                    placeholder={`Option ${index + 1}`} 
                    value={option} 
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '15px',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: correctAnswer === index ? '600' : '400'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' }}>
            <button 
              onClick={handleAddOrUpdateQuestion}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '12px',
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {editingIndex !== null ? '✅ Update Question' : `➕ Add Question (${questions.length}/${quiz.settings.numQuestions})`}
            </button>
            
            {editingIndex !== null && (
              <button 
                onClick={resetForm}
                style={{
                  background: '#e0e0e0',
                  color: '#666',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#d0d0d0'}
                onMouseOut={(e) => e.target.style.background = '#e0e0e0'}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </div>
        
        {/* Questions List */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '20px',
          marginBottom: '30px',
          border: '2px solid #f0f0f0'
        }}>
          <h3 style={{
            color: '#333',
            fontSize: '22px',
            fontWeight: '700',
            marginTop: 0,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>📋 Added Questions</span>
            <span style={{
              fontSize: '16px',
              color: '#667eea',
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '6px 16px',
              borderRadius: '20px'
            }}>
              {questions.length} Total
            </span>
          </h3>
          
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {questions.length > 0 ? questions.map((q, index) => (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 20px',
                  background: index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'white',
                  borderRadius: '12px',
                  marginBottom: '10px',
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </span>
                    <span style={{
                      color: '#333',
                      fontSize: '15px',
                      fontWeight: '600',
                      lineHeight: '1.4'
                    }}>
                      {q.text.length > 80 ? q.text.substring(0, 80) + '...' : q.text}
                    </span>
                  </div>
                  <div style={{
                    marginLeft: '40px',
                    color: '#667eea',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    ✓ Correct: {q.options[q.correctAnswerIndex]}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginLeft: '20px'
                }}>
                  <button 
                    onClick={() => handleEdit(index)}
                    style={{
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#2980b9'}
                    onMouseOut={(e) => e.target.style.background = '#3498db'}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(index)}
                    style={{
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c0392b'}
                    onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#999'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>No questions added yet. Start adding questions above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '30px',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
        }}>
          <button 
            onClick={handleFinish}
            style={{
              flex: 1,
              minWidth: window.innerWidth <= 768 ? 'auto' : '250px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              border: 'none',
              padding: '18px 32px',
              borderRadius: '12px',
              fontSize: window.innerWidth <= 768 ? '15px' : '17px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            💾 Save Questions & Go to Dashboard
          </button>
          
          <button 
            onClick={onBack}
            style={{
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              padding: '18px 32px',
              borderRadius: '12px',
              fontSize: window.innerWidth <= 768 ? '15px' : '17px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.color = '#667eea';
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddQuestions;

