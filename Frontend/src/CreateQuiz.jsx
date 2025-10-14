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
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px'
          }}>
            Create Your Quiz
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '8px',
            lineHeight: '1.6'
          }}>
            Fill in the details to start a new quiz room
          </p>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 126, 95, 0.1) 0%, rgba(254, 180, 123, 0.1) 100%)',
            border: '2px solid rgba(255, 126, 95, 0.3)',
            borderRadius: '12px',
            padding: '12px 20px',
            marginTop: '16px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#ff7e5f',
              fontWeight: '600',
              margin: 0
            }}>
              ⚠️ Note: Quiz settings cannot be changed after creation, only questions can be modified
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quiz Title */}
          <div>
            <label style={{
              display: 'block',
              color: '#333',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📝 Quiz Title
            </label>
            <input 
              type="text" 
              placeholder="e.g., JavaScript Fundamentals Quiz" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'Poppins, sans-serif',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Quiz Description */}
          <div>
            <label style={{
              display: 'block',
              color: '#333',
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📄 Quiz Description
            </label>
            <textarea 
              placeholder="Describe what this quiz is about..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
              rows="4"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.3s ease',
                fontFamily: 'Poppins, sans-serif',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Settings Grid */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid rgba(102, 126, 234, 0.2)'
          }}>
            <h3 style={{
              color: '#667eea',
              fontSize: '18px',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚙️ Quiz Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Number of Questions */}
              <div>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  📊 Number of Questions: <span style={{ color: '#667eea', fontSize: '18px', fontWeight: '700' }}>{numQuestions}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="50"
                  value={numQuestions} 
                  onChange={(e) => setNumQuestions(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${(numQuestions / 50) * 100}%, #e0e0e0 ${(numQuestions / 50) * 100}%, #e0e0e0 100%)` 
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              {/* Time per Question */}
              <div>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  ⏱️ Time per Question: <span style={{ color: '#667eea', fontSize: '18px', fontWeight: '700' }}>{timePerQuestion}s</span>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="120"
                  value={timePerQuestion} 
                  onChange={(e) => setTimePerQuestion(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${((timePerQuestion - 5) / 115) * 100}%, #e0e0e0 ${((timePerQuestion - 5) / 115) * 100}%, #e0e0e0 100%)` 
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <span>5s</span>
                  <span>2min</span>
                </div>
              </div>

              {/* Points per Question */}
              <div>
                <label style={{
                  display: 'block',
                  color: '#555',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  🏆 Points per Question: <span style={{ color: '#667eea', fontSize: '18px', fontWeight: '700' }}>{pointsPerQuestion}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="20"
                  value={pointsPerQuestion} 
                  onChange={(e) => setPointsPerQuestion(e.target.value)} 
                  required
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    background: `linear-gradient(to right, #667eea 0%, #667eea ${((pointsPerQuestion - 1) / 19) * 100}%, #e0e0e0 ${((pointsPerQuestion - 1) / 19) * 100}%, #e0e0e0 100%)` 
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button 
              type="submit"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
                color: 'white',
                border: 'none',
                padding: '18px 32px',
                borderRadius: '12px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255, 126, 95, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              ✨ Create Quiz & Add Questions
            </button>
          </div>

          <button 
            type="button" 
            onClick={onBack}
            style={{
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              padding: '14px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%'
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
        </form>

        <style>{`
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
    </div>
  );
}

export default CreateQuiz;