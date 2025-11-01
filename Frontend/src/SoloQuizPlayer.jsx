// Frontend/src/SoloQuizPlayer.jsx
import React, { useState, useEffect } from 'react';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SoloQuizPlayer = ({ quiz, user, onBack, onFinish }) => {
  // Shuffle questions once when component mounts
  const [shuffledQuestions] = useState(() => shuffleArray(quiz.questions));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.settings.timePerQuestion);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
    if (quizFinished || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return quiz.settings.timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, quizFinished, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    setAnswers([...answers, { 
      questionIndex: currentQuestionIndex, 
      selectedAnswer: null, 
      correct: false,
      timedOut: true 
    }]);
  };

  const handleAnswerSelect = (optionIndex) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setScore(score + quiz.settings.pointsPerQuestion);
    }

    setAnswers([...answers, {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      correct: isCorrect,
      timedOut: false
    }]);

    setShowResult(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(quiz.settings.timePerQuestion);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(quiz.settings.timePerQuestion);
    setQuizFinished(false);
    setAnswers([]);
  };

  // Quiz Finished Screen
  if (quizFinished) {
    const totalQuestions = shuffledQuestions.length;
    const correctAnswers = answers.filter(a => a.correct).length;
    const percentage = ((correctAnswers / totalQuestions) * 100).toFixed(1);

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '100px 20px 40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '48px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎉 Quiz Complete!
          </h1>

          <div style={{
            fontSize: '72px',
            fontWeight: '800',
            color: percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444',
            marginBottom: '20px'
          }}>
            {percentage}%
          </div>

          <div style={{
            fontSize: '24px',
            color: '#666',
            marginBottom: '40px'
          }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>Score:</strong> {score} points
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>Correct:</strong> {correctAnswers}/{totalQuestions}
            </p>
            <p>
              <strong>Accuracy:</strong> {percentage}%
            </p>
          </div>

          {/* Answer Review */}
          <div style={{
            textAlign: 'left',
            marginBottom: '30px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '12px'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>📝 Answer Review:</h3>
            {answers.map((answer, idx) => (
              <div key={idx} style={{
                padding: '12px',
                marginBottom: '8px',
                background: answer.correct ? '#d1fae5' : '#fee2e2',
                borderRadius: '8px',
                borderLeft: `4px solid ${answer.correct ? '#10b981' : '#ef4444'}`
              }}>
                <strong>Q{idx + 1}:</strong> {shuffledQuestions[answer.questionIndex].text.substring(0, 50)}...
                <br />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {answer.timedOut ? '⏱️ Time Out' : answer.correct ? '✅ Correct' : '❌ Wrong'}
                  {!answer.timedOut && !answer.correct && (
                    <span> - Correct: {shuffledQuestions[answer.questionIndex].options[shuffledQuestions[answer.questionIndex].correctAnswerIndex]}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleRetry}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🔄 Try Again
            </button>
            <button
              onClick={onBack}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '700',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Playing Screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '100px 20px 40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px 30px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
              Solo Practice Mode
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#667eea'
            }}>
              Score: {score}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '800',
              color: timeLeft <= 5 ? '#ef4444' : '#667eea',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '24px',
            color: '#333',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            {currentQuestion.text}
          </h3>

          <div style={{
            display: 'grid',
            gap: '15px'
          }}>
            {currentQuestion.options.map((option, index) => {
              let backgroundColor = 'white';
              let borderColor = '#e5e7eb';
              let cursor = 'pointer';

              if (showResult) {
                cursor = 'not-allowed';
                if (index === currentQuestion.correctAnswerIndex) {
                  backgroundColor = '#d1fae5';
                  borderColor = '#10b981';
                } else if (index === selectedAnswer) {
                  backgroundColor = '#fee2e2';
                  borderColor = '#ef4444';
                }
              } else if (selectedAnswer === index) {
                backgroundColor = '#e0e7ff';
                borderColor = '#667eea';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  style={{
                    padding: '20px',
                    fontSize: '18px',
                    textAlign: 'left',
                    background: backgroundColor,
                    border: `3px solid ${borderColor}`,
                    borderRadius: '12px',
                    cursor: cursor,
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => {
                    if (!showResult) {
                      e.target.style.transform = 'translateX(5px)';
                      e.target.style.borderColor = '#667eea';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!showResult) {
                      e.target.style.transform = 'translateX(0)';
                      e.target.style.borderColor = selectedAnswer === index ? '#667eea' : '#e5e7eb';
                    }
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: selectedAnswer === index ? '#667eea' : '#f3f4f6',
                    color: selectedAnswer === index ? 'white' : '#666',
                    textAlign: 'center',
                    lineHeight: '30px',
                    marginRight: '15px',
                    fontWeight: '700'
                  }}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                  {showResult && index === currentQuestion.correctAnswerIndex && ' ✅'}
                  {showResult && index === selectedAnswer && index !== currentQuestion.correctAnswerIndex && ' ❌'}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{
            marginTop: '30px',
            display: 'flex',
            gap: '15px',
            justifyContent: 'center'
          }}>
            {!showResult ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                style={{
                  padding: '16px 48px',
                  fontSize: '18px',
                  fontWeight: '700',
                  background: selectedAnswer === null ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: selectedAnswer === null ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseOver={(e) => {
                  if (selectedAnswer !== null) e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  if (selectedAnswer !== null) e.target.style.transform = 'translateY(0)';
                }}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  padding: '16px 48px',
                  fontSize: '18px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '15px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / shuffledQuestions.length) * 100)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloQuizPlayer;
