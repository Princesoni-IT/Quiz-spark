import React, { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard.jsx'; // Leaderboard ko import kiya
import './App.css';

function QuizPlayer({ socket, quiz, user, onBack }) { // onBack naya prop
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(0); // Actual question index from backend
    const [totalQuestions, setTotalQuestions] = useState(quiz.settings.numQuestions);
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [timer, setTimer] = useState(quiz.settings.timePerQuestion);
    const [scores, setScores] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [playerFinished, setPlayerFinished] = useState(false);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [finishedPlayers, setFinishedPlayers] = useState(0);
    const isAdmin = user.id === quiz.creatorId;

    // Tab locking (sirf student ke liye)
    useEffect(() => {
        if (isAdmin) return; // Admin ke liye tab lock mat karo

        const enterFullScreen = () => {
            if (document.fullscreenElement === null) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            }
        };
        enterFullScreen();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                alert("You tried to switch tabs. This is not allowed during the quiz.");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isAdmin]);
    
    useEffect(() => {
        socket.on('new_question', (data) => {
            setCurrentQuestion(data.question);
            setQuestionNumber(data.questionNumber);
            setQuestionIndex(data.questionIndex); // Store actual question index
            setTotalQuestions(data.totalQuestions || quiz.settings.numQuestions);
            setSelectedOption(null);
            setSubmitted(false);
            setPlayerFinished(false);
            setTimer(quiz.settings.timePerQuestion);
        });

        socket.on('player_finished', () => {
            setPlayerFinished(true);
            setCurrentQuestion(null);
        });

        socket.on('quiz_finished', (finalScores) => {
            setScores(finalScores);
            setIsFinished(true);
        });
        
        // Admin ke liye live leaderboard
        socket.on('update_leaderboard', (liveScores) => {
            // Filter out admin from the scores
            const studentsOnly = liveScores.filter(p => p.id !== quiz.creatorId);
            
            // Scores ko sort karke update karo
            const sortedScores = [...studentsOnly].sort((a, b) => b.score - a.score);
            setScores(sortedScores);
            
            // Count total and finished players (excluding admin)
            setTotalPlayers(studentsOnly.length);
            const finished = studentsOnly.filter(p => p.currentQuestionIndex >= quiz.questions.length).length;
            setFinishedPlayers(finished);
        });

        const interval = setInterval(() => {
            setTimer(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => {
            clearInterval(interval);
            socket.off('new_question');
            socket.off('player_finished');
            socket.off('quiz_finished');
            socket.off('update_leaderboard');
        };
    }, [socket, quiz]);

    // Auto-submit when timer reaches 0
    useEffect(() => {
        if (timer === 0 && !submitted && currentQuestion && !isAdmin) {
            // Auto-submit even if no option selected (will be marked wrong)
            autoSubmit();
        }
    }, [timer, submitted, currentQuestion, isAdmin]);

    const autoSubmit = () => {
        setSubmitted(true);
        socket.emit('submit_answer', {
            roomCode: quiz.quizCode,
            userId: user.id,
            questionIndex: questionIndex,
            selectedOptionIndex: selectedOption !== null ? selectedOption : -1 // -1 means no answer
        });
    };

    const handleAnswerSubmit = () => {
        if (selectedOption === null) {
            alert('Please select an option before submitting!');
            return;
        }
        setSubmitted(true);
        socket.emit('submit_answer', {
            roomCode: quiz.quizCode,
            userId: user.id,
            questionIndex: questionIndex, // Use actual question index from backend
            selectedOptionIndex: selectedOption
        });
    };

    if (isFinished) {
        return <Leaderboard scores={scores} onBack={onBack} />;
    }

    // Admin View (Live Leaderboard)
    if (isAdmin) {
        return (
            <div className="quiz-player-container">
                <h2 style={{ marginBottom: '10px' }}>📊 Live Quiz Monitor</h2>
                <p style={{ fontSize: '1rem', color: '#666', marginBottom: '20px' }}>Track student progress in real-time</p>
                
                {/* Admin Progress Indicator */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '25px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: '20px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '5px' }}>
                                Total Students
                            </div>
                            <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700' }}>
                                {totalPlayers}
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '5px' }}>
                                Completed
                            </div>
                            <div style={{ color: '#38ef7d', fontSize: '2.5rem', fontWeight: '700' }}>
                                {finishedPlayers}
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', marginBottom: '5px' }}>
                                In Progress
                            </div>
                            <div style={{ color: '#feb47b', fontSize: '2.5rem', fontWeight: '700' }}>
                                {totalPlayers - finishedPlayers}
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '12px',
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${totalPlayers > 0 ? (finishedPlayers / totalPlayers) * 100 : 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #38ef7d, #11998e)',
                            transition: 'width 0.5s ease',
                            borderRadius: '6px'
                        }}></div>
                    </div>
                    
                    <div style={{ 
                        color: 'white', 
                        fontSize: '1rem', 
                        marginTop: '10px',
                        textAlign: 'center',
                        fontWeight: '600'
                    }}>
                        {finishedPlayers === totalPlayers && totalPlayers > 0 
                            ? '✅ All students have completed the quiz!' 
                            : `${totalPlayers > 0 ? Math.round((finishedPlayers / totalPlayers) * 100) : 0}% Complete`
                        }
                    </div>
                </div>
                
                <h3 style={{ marginBottom: '15px', color: '#1e2a78' }}>Current Rankings</h3>
                <Leaderboard scores={scores} onBack={onBack} />
            </div>
        );
    }

    // Student View
    if (playerFinished) {
        return (
            <div className="quiz-player-container">
                <h2>🎉 You've completed all questions!</h2>
                <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '10px' }}>Waiting for other students to finish...</p>
                
                {/* Player Progress Indicator */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                    <div style={{ color: 'white', fontSize: '1.3rem', fontWeight: '600', marginBottom: '10px' }}>
                        📊 Quiz Progress
                    </div>
                    <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700' }}>
                        {finishedPlayers} / {totalPlayers}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', marginTop: '5px' }}>
                        Players Completed
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                        width: '100%',
                        height: '10px',
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: '5px',
                        marginTop: '15px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${totalPlayers > 0 ? (finishedPlayers / totalPlayers) * 100 : 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #38ef7d, #11998e)',
                            transition: 'width 0.5s ease',
                            borderRadius: '5px'
                        }}></div>
                    </div>
                </div>
                
                <Leaderboard scores={scores} onBack={onBack} />
            </div>
        );
    }

    if (!currentQuestion) {
        return <div className="quiz-player-container"><h2>Waiting for the first question...</h2></div>;
    }

    return (
        <div className="quiz-player-container">
            <div className="quiz-player-header">
                <h3>Question {questionNumber}/{totalQuestions}</h3>
                <div className="timer">{timer}s</div>
            </div>
            <div className="question-text">
                <h2>{currentQuestion.text}</h2>
            </div>
            <div className="options-container-player">
                {currentQuestion.options.map((option, index) => (
                    <button 
                        key={index} 
                        className={`option-btn ${selectedOption === index ? 'selected' : ''}`}
                        onClick={() => setSelectedOption(index)}
                        disabled={submitted}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button onClick={handleAnswerSubmit} className="btn create-btn submit-answer-btn" disabled={submitted}>
                {submitted ? 'Answer Locked' : 'Lock Answer'}
            </button>
        </div>
    );
}

export default QuizPlayer;

