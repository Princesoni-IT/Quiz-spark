import React, { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard.jsx'; // Leaderboard ko import kiya
import './App.css';

function QuizPlayer({ socket, quiz, user, onBack }) { // onBack naya prop
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [timer, setTimer] = useState(quiz.settings.timePerQuestion);
    const [scores, setScores] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
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
            setSelectedOption(null);
            setSubmitted(false);
            setTimer(quiz.settings.timePerQuestion);
        });

        socket.on('quiz_finished', (finalScores) => {
            setScores(finalScores);
            setIsFinished(true);
        });
        
        // Admin ke liye live leaderboard
        socket.on('update_leaderboard', (liveScores) => {
            // Scores ko sort karke update karo
            const sortedScores = [...liveScores].sort((a, b) => b.score - a.score);
            setScores(sortedScores);
        });

        const interval = setInterval(() => {
            setTimer(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => {
            clearInterval(interval);
            socket.off('new_question');
            socket.off('quiz_finished');
            socket.off('update_leaderboard');
        };
    }, [socket, quiz]);

    const handleAnswerSubmit = () => {
        if (selectedOption === null) return;
        setSubmitted(true);
        socket.emit('submit_answer', {
            roomCode: quiz.quizCode, // Use roomCode instead of quizCode
            userId: user.id,
            questionIndex: questionNumber - 1,
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
                <h2>Live Leaderboard</h2>
                <Leaderboard scores={scores} onBack={onBack} />
            </div>
        );
    }

    // Student View
    if (!currentQuestion) {
        return <div className="quiz-player-container"><h2>Waiting for the first question...</h2></div>;
    }

    return (
        <div className="quiz-player-container">
            <div className="quiz-player-header">
                <h3>Question {questionNumber}/{quiz.settings.numQuestions}</h3>
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

