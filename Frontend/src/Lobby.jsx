import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import QuizCountdown from './QuizCountdown';
import QuizPlayer from './QuizPlayer';

// Socket connection ko component ke bahar banaya
const socket = io(import.meta.env.VITE_API_URL);

function Lobby({ quiz, user, onBack, onKicked }) {
  const [studentList, setStudentList] = useState([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizData, setQuizData] = useState(null);

  useEffect(() => {
    if (quiz && user) {
      socket.emit('join_room', { roomCode: quiz.quizCode, user });
    }
    socket.on('update_student_list', (updatedList) => setStudentList(updatedList));
    socket.on('you_were_kicked', () => {
      alert("You have been removed from the room by the admin.");
      onKicked();
    });
    // Listen for quiz_starting and quiz_started events
    socket.on('quiz_starting', () => {
      setShowCountdown(true);
    });
    socket.on('quiz_started', (quizObj) => {
      setShowCountdown(false);
      setQuizStarted(true);
      setQuizData(quizObj);
    });
    return () => {
      socket.off('update_student_list');
      socket.off('you_were_kicked');
      socket.off('quiz_starting');
      socket.off('quiz_started');
    };
  }, [quiz, user, onKicked]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.quizCode);
    alert('Room Code Copied to clipboard!');
  };

  const handleKickStudent = (studentId) => {
    if (window.confirm("Are you sure you want to kick this student?")) {
        socket.emit('kick_student', { roomCode: quiz.quizCode, studentId });
    }
  };

  const handleStartQuiz = () => {
    console.log("DEBUG [Frontend]: 'Start Quiz' button clicked. Emitting 'start_quiz' event to backend...");
    socket.emit('start_quiz', quiz.quizCode);
  };

  const isAdmin = user && quiz && user.id === quiz.creatorId;

  // Show countdown if quiz is starting
  if (showCountdown) {
    return <QuizCountdown />;
  }

  // Show QuizPlayer if quiz has started
  if (quizStarted && quizData) {
    return <QuizPlayer socket={socket} quiz={quizData} user={user} onBack={onBack} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: window.innerWidth <= 768 ? '80px 15px 40px 15px' : '100px 20px 40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        {/* Back Button */}
        <button 
          onClick={onBack}
          style={{
            background: '#667eea',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 768 ? '14px' : '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#5a5fd8';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#667eea';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          ← Back
        </button>

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: window.innerWidth <= 768 ? '25px' : '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          {isAdmin ? (
            <>
              {/* Admin View */}
              <div style={{ fontSize: window.innerWidth <= 768 ? '48px' : '64px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{
                fontSize: window.innerWidth <= 768 ? '24px' : '32px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '12px'
              }}>
                Quiz Room Created!
              </h2>
              <p style={{
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                color: '#666',
                marginBottom: '30px'
              }}>
                Share this code with your students to let them join
              </p>

              {/* Quiz Code Box */}
              <div 
                onClick={handleCopyCode}
                style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '3px dashed #667eea',
                  borderRadius: '20px',
                  padding: window.innerWidth <= 768 ? '20px' : '30px',
                  marginBottom: '40px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '50%'
                }}></div>
                
                <div style={{
                  fontSize: window.innerWidth <= 768 ? '32px' : '48px',
                  fontWeight: '800',
                  color: '#1e2a78',
                  letterSpacing: window.innerWidth <= 768 ? '4px' : '8px',
                  marginBottom: '12px',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {quiz.quizCode}
                </div>
                <p style={{
                  color: '#667eea',
                  fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                  fontWeight: '600',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  📋 Click to Copy
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Student View */}
              <div style={{ fontSize: window.innerWidth <= 768 ? '48px' : '64px', marginBottom: '20px' }}>✅</div>
              <h2 style={{
                fontSize: window.innerWidth <= 768 ? '20px' : '28px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '12px'
              }}>
                You've Joined: {quiz.title}
              </h2>
              <p style={{
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                color: '#666',
                marginBottom: '40px'
              }}>
                {quiz.description || 'Waiting for the admin to start the quiz...'}
              </p>
            </>
          )}

          {/* Students List */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{
              color: '#333',
              fontSize: '20px',
              fontWeight: '700',
              marginTop: 0,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                👥 Joined Students
              </span>
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                {studentList.length}
              </span>
            </h3>

            <div style={{
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {studentList.length > 0 ? (
                <div>
                  {studentList.map((student, index) => (
                    <div 
                      key={student.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 18px',
                        background: index % 2 === 0 ? 'white' : 'rgba(102, 126, 234, 0.05)',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                      onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '16px'
                        }}>
                          {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{
                            color: '#333',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            {student.fullName}
                            {student.id === quiz.creatorId && (
                              <span style={{
                                marginLeft: '8px',
                                background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700'
                              }}>
                                ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isAdmin && user.id !== student.id && (
                        <button 
                          onClick={() => handleKickStudent(student.id)}
                          style={{
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#c0392b'}
                          onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                        >
                          🚫 Kick
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#999'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
                  <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>
                    Waiting for students to join...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Start Quiz Button (Admin Only) */}
          {isAdmin && (
            <button 
              onClick={handleStartQuiz}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
                color: 'white',
                border: 'none',
                padding: '18px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(255, 126, 95, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚀 Start Quiz Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lobby;

