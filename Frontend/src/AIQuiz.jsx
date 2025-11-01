// Frontend/src/AIQuiz.jsx

import React, { useState } from 'react';
import axios from 'axios';

const AIQuiz = ({ onQuizCreated, onBack, onAuthError, onPracticeNow }) => {
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1); // 1: Choose method, 2: Generate, 3: Preview
  const [activeTab, setActiveTab] = useState('topic'); // 'topic' or 'syllabus'
  
  // Topic-based generation
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [pointsPerQuestion, setPointsPerQuestion] = useState(10);
  
  // Syllabus-based generation
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [topicsFromSyllabus, setTopicsFromSyllabus] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  
  // Generated questions
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to handle authentication errors
  const handleAuthError = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      alert('Session expired. Please login again.');
      localStorage.removeItem('token');
      if (onAuthError) {
        onAuthError();
      }
      return true;
    }
    return false;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSyllabusFile(file);
  };

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setGeneratedQuestions([]);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/generate-from-topic`, {
        topic,
        numQuestions
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      setGeneratedQuestions(response.data.questions);
      setCurrentStep(3); // Move to preview step
    } catch (error) {
      if (!handleAuthError(error)) {
        alert('Failed to generate questions. Please try again.');
        console.error(error);
      }
    }
    setIsLoading(false);
  };

  const handleUploadSyllabus = async () => {
    if (!syllabusFile) {
      alert('Please upload a syllabus file.');
      return;
    }
    setIsLoading(true);
    setTopicsFromSyllabus([]);
    const formData = new FormData();
    formData.append('syllabus', syllabusFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/extract-topics`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setTopicsFromSyllabus(response.data.topics);
      setCurrentStep(2); // Move to topic selection step
    } catch (error) {
      if (!handleAuthError(error)) {
        alert('Failed to extract topics. Please try again.');
        console.error(error);
      }
    }
    setIsLoading(false);
  };
  
  const handleGenerateFromSyllabus = async () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic.');
      return;
    }
    setIsLoading(true);
    setGeneratedQuestions([]);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/ai/generate-from-topic`, {
        topic: selectedTopics.join(', '),
        numQuestions
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      setGeneratedQuestions(response.data.questions);
      setCurrentStep(3); // Move to preview step
    } catch (error) {
      if (!handleAuthError(error)) {
        alert('Failed to generate questions. Please try again.');
        console.error(error);
      }
    }
    setIsLoading(false);
  };

  const handleBackToStart = () => {
    setCurrentStep(1);
    setTopic('');
    setSyllabusFile(null);
    setTopicsFromSyllabus([]);
    setSelectedTopics([]);
    setGeneratedQuestions([]);
  };

  const handleTopicSelection = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const downloadCSV = () => {
    const csvRows = [
      ['Question', 'Option1', 'Option2', 'Option3', 'Option4', 'CorrectAnswer']
    ];
    generatedQuestions.forEach(q => {
      csvRows.push([
        `"${q.text.replace(/"/g, '""')}"`,
        `"${q.options[0].replace(/"/g, '""')}"`,
        `"${q.options[1].replace(/"/g, '""')}"`,
        `"${q.options[2].replace(/"/g, '""')}"`,
        `"${q.options[3].replace(/"/g, '""')}"`,
        q.correctAnswerIndex + 1
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'quiz_questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startQuizNow = async () => {
    try {
      const token = localStorage.getItem('token');
      const quizTitle = topic || selectedTopics.join(', ');
      
      console.log('Creating quiz...');
      const createQuizResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/quizzes/create`, {
        title: `AI Quiz: ${quizTitle.substring(0, 40)}`,
        description: 'Generated by AI',
        numQuestions: generatedQuestions.length,
        timePerQuestion: timePerQuestion,
        pointsPerQuestion: pointsPerQuestion
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const newQuiz = createQuizResponse.data.quiz;
      console.log('Quiz created:', newQuiz._id);
      
      console.log('Adding questions...');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/quizzes/${newQuiz._id}/questions`, {
        questions: generatedQuestions
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Questions added successfully');

      // Fetch the complete quiz with questions
      console.log('Fetching complete quiz...');
      const completeQuizResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/quizzes/${newQuiz._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Complete quiz fetched:', completeQuizResponse.data);

      alert('AI Quiz created successfully! Redirecting to dashboard...');
      onQuizCreated(completeQuizResponse.data);
    } catch (error) {
      console.error('Error in startQuizNow:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (!handleAuthError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to start the quiz.';
        alert(`Failed to start the quiz: ${errorMsg}`);
      }
    }
  };

  const handlePracticeNow = () => {
    // Create a temporary quiz object for practice mode
    const practiceQuiz = {
      title: `Practice: ${topic || selectedTopics.join(', ')}`,
      questions: generatedQuestions,
      settings: {
        timePerQuestion: timePerQuestion,
        pointsPerQuestion: pointsPerQuestion
      }
    };
    onPracticeNow(practiceQuiz);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '100px 20px 40px 20px', // Added top padding to clear navbar
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <button 
            onClick={onBack} 
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ← Back
          </button>
          
          <h1 style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: '800',
            margin: '0',
            textAlign: 'center',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            🤖 AI Quiz Generator
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '18px',
            textAlign: 'center',
            marginTop: '10px'
          }}>
            Create intelligent quizzes powered by AI in seconds
          </p>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '30px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveTab('topic')}
            style={{
              background: activeTab === 'topic' ? 'white' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'topic' ? '#667eea' : 'white',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: activeTab === 'topic' ? '0 8px 32px rgba(0,0,0,0.2)' : 'none',
              transform: activeTab === 'topic' ? 'translateY(-2px)' : 'none'
            }}
          >
            📝 Enter Topic
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            style={{
              background: activeTab === 'syllabus' ? 'white' : 'rgba(255, 255, 255, 0.2)',
              color: activeTab === 'syllabus' ? '#667eea' : 'white',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '16px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: activeTab === 'syllabus' ? '0 8px 32px rgba(0,0,0,0.2)' : 'none',
              transform: activeTab === 'syllabus' ? 'translateY(-2px)' : 'none'
            }}
          >
            📄 Upload Syllabus
          </button>
        </div>

        {/* Main Content Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          marginBottom: '30px'
        }}>
          {activeTab === 'topic' && (
            <div>
              <h2 style={{
                color: '#333',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Generate from Topic
                </span>
              </h2>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Topic Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Python Programming, World War II, Quantum Physics..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    fontSize: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Number of Questions: <span style={{ color: '#667eea', fontSize: '20px', fontWeight: '700' }}>{numQuestions}</span>
                </label>
                <input
                  type="range"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  min="5"
                  max="30"
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${(numQuestions - 5) / 25 * 100}%, #e0e0e0 ${(numQuestions - 5) / 25 * 100}%, #e0e0e0 100%)`
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  <span>5</span>
                  <span>30</span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Time per Question: <span style={{ color: '#667eea', fontSize: '20px', fontWeight: '700' }}>{timePerQuestion}s</span>
                </label>
                <input
                  type="range"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  min="10"
                  max="120"
                  step="5"
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${(timePerQuestion - 10) / 110 * 100}%, #e0e0e0 ${(timePerQuestion - 10) / 110 * 100}%, #e0e0e0 100%)`
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  <span>10s</span>
                  <span>120s (2min)</span>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Points per Question: <span style={{ color: '#667eea', fontSize: '20px', fontWeight: '700' }}>{pointsPerQuestion}</span>
                </label>
                <input
                  type="range"
                  value={pointsPerQuestion}
                  onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
                  min="1"
                  max="20"
                  step="1"
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${(pointsPerQuestion - 1) / 19 * 100}%, #e0e0e0 ${(pointsPerQuestion - 1) / 19 * 100}%, #e0e0e0 100%)`
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              <button 
                onClick={handleGenerateFromTopic} 
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px',
                  borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => !isLoading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !isLoading && (e.target.style.transform = 'translateY(0)')}
              >
                {isLoading ? (
                  <>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(255,255,255,0.3)',
                      borderTop: '3px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></span>
                    Generating Questions...
                  </>
                ) : (
                  <>✨ Generate Questions</>
                )}
              </button>
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div>
              <h2 style={{
                color: '#333',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '24px'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Generate from Syllabus
                </span>
              </h2>

              <div style={{
                border: '3px dashed #667eea',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                marginBottom: '24px',
                background: 'rgba(102, 126, 234, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
                <label style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Choose File
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                  />
                </label>
                {syllabusFile && (
                  <p style={{
                    marginTop: '16px',
                    color: '#667eea',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    ✓ {syllabusFile.name}
                  </p>
                )}
                <p style={{
                  marginTop: '12px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>

              <button 
                onClick={handleUploadSyllabus} 
                disabled={isLoading || !syllabusFile}
                style={{
                  width: '100%',
                  background: (isLoading || !syllabusFile) ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '18px',
                  borderRadius: '12px',
                  cursor: (isLoading || !syllabusFile) ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  marginBottom: '24px'
                }}
              >
                {isLoading ? '🔄 Extracting Topics...' : '🔍 Extract Topics'}
              </button>

              {topicsFromSyllabus.length > 0 && (
                <div style={{
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginTop: '24px'
                }}>
                  <h3 style={{
                    color: '#333',
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '16px'
                  }}>
                    Select Topics to Include:
                  </h3>
                  
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    marginBottom: '24px',
                    padding: '8px'
                  }}>
                    {topicsFromSyllabus.map((topic, index) => (
                      <label
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 16px',
                          marginBottom: '8px',
                          background: selectedTopics.includes(topic) ? 'rgba(102, 126, 234, 0.15)' : 'white',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: selectedTopics.includes(topic) ? '2px solid #667eea' : '2px solid transparent'
                        }}
                        onMouseOver={(e) => {
                          if (!selectedTopics.includes(topic)) {
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!selectedTopics.includes(topic)) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTopics.includes(topic)}
                          onChange={() => handleTopicSelection(topic)}
                          style={{
                            width: '20px',
                            height: '20px',
                            marginRight: '12px',
                            cursor: 'pointer',
                            accentColor: '#667eea'
                          }}
                        />
                        <span style={{
                          color: '#333',
                          fontSize: '16px',
                          fontWeight: selectedTopics.includes(topic) ? '600' : '500'
                        }}>
                          {topic}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      color: '#555',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '12px'
                    }}>
                      Number of Questions: <span style={{ color: '#667eea', fontSize: '20px', fontWeight: '700' }}>{numQuestions}</span>
                    </label>
                    <input
                      type="range"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      min="5"
                      max="30"
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        outline: 'none',
                        background: `linear-gradient(to right, #667eea 0%, #667eea ${(numQuestions - 5) / 25 * 100}%, #e0e0e0 ${(numQuestions - 5) / 25 * 100}%, #e0e0e0 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      color: '#999',
                      fontSize: '14px'
                    }}>
                      <span>5</span>
                      <span>30</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      color: '#555',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '12px'
                    }}>
                      Time per Question: <span style={{ color: '#667eea', fontSize: '20px', fontWeight: '700' }}>{timePerQuestion}s</span>
                    </label>
                    <input
                      type="range"
                      value={timePerQuestion}
                      onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                      min="10"
                      max="120"
                      step="5"
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        outline: 'none',
                        background: `linear-gradient(to right, #667eea 0%, #667eea ${(timePerQuestion - 10) / 110 * 100}%, #e0e0e0 ${(timePerQuestion - 10) / 110 * 100}%, #e0e0e0 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      color: '#999',
                      fontSize: '14px'
                    }}>
                      <span>10s</span>
                      <span>120s (2min)</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      color: '#555',
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '12px'
                    }}>
                      Points per Question: <span style={{ color: '#667eea', fontSize: '20px', fontWeight: '700' }}>{pointsPerQuestion}</span>
                    </label>
                    <input
                      type="range"
                      value={pointsPerQuestion}
                      onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
                      min="1"
                      max="20"
                      step="1"
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        outline: 'none',
                        background: `linear-gradient(to right, #667eea 0%, #667eea ${(pointsPerQuestion - 1) / 19 * 100}%, #e0e0e0 ${(pointsPerQuestion - 1) / 19 * 100}%, #e0e0e0 100%)`
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      color: '#999',
                      fontSize: '14px'
                    }}>
                      <span>1</span>
                      <span>20</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateFromSyllabus} 
                    disabled={isLoading || selectedTopics.length === 0}
                    style={{
                      width: '100%',
                      background: (isLoading || selectedTopics.length === 0) ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '18px',
                      borderRadius: '12px',
                      cursor: (isLoading || selectedTopics.length === 0) ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      fontWeight: '700',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isLoading ? '⏳ Generating...' : `✨ Generate ${selectedTopics.length} Topic${selectedTopics.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.5s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#333',
                fontSize: '28px',
                fontWeight: '700',
                margin: 0
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  ✅ {generatedQuestions.length} Questions Generated
                </span>
              </h2>
            </div>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '24px',
              border: '2px solid #f0f0f0',
              borderRadius: '16px',
              padding: '16px'
            }}>
              {generatedQuestions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    background: i % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </span>
                    <p style={{
                      color: '#333',
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: 0,
                      lineHeight: '1.6'
                    }}>
                      {q.text}
                    </p>
                  </div>
                  <div style={{
                    marginLeft: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      color: '#667eea',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      ✓ Answer:
                    </span>
                    <span style={{
                      color: '#555',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}>
                      {q.options[q.correctAnswerIndex]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={downloadCSV}
                style={{
                  flex: '1',
                  minWidth: '180px',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
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
                📥 Download CSV
              </button>
              <button 
                onClick={handlePracticeNow}
                style={{
                  flex: '1',
                  minWidth: '180px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🎮 Practice only without save
              </button>
              <button 
                onClick={startQuizNow}
                style={{
                  flex: '1',
                  minWidth: '180px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🚀 Create & Save Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }
      `}</style>
    </div>
  );
};

export default AIQuiz;