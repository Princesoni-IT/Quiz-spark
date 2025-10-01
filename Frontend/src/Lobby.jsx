import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import QuizCountdown from './QuizCountdown';
import QuizPlayer from './QuizPlayer';

// Socket connection ko component ke bahar banaya
const socket = io('http://localhost:3000');


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
    <div className="lobby-container">
      <button onClick={onBack} className="back-btn"> Back</button>
      <div className="lobby-content">
        {isAdmin ? (
          <>
            <h2>Quiz Room Created!</h2>
            <p>Share this code with your students to let them join.</p>
            <div className="quiz-code-box" onClick={handleCopyCode} title="Click to copy">
              <span>{quiz.quizCode}</span>
              <p className="copy-text">Click to Copy</p>
            </div>
          </>
        ) : (
          <>
            <h2>You have joined: {quiz.title}</h2>
            <p>{quiz.description || 'Waiting for the admin to start the quiz...'}</p>
          </>
        )}
        <div className="student-list-container">
          <h3>Joined Students ({studentList.length})</h3>
          <div className="student-list">
            {studentList.length > 0 ? (
              <ul>
                {studentList.map((student) => (
                  <li key={student.id}>
                    {student.fullName}
                    {isAdmin && user.id !== student.id && (<button onClick={() => handleKickStudent(student.id)} className="kick-btn">Kick</button>)}
                  </li>
                ))}
              </ul>
            ) : ( <p>Waiting for students to join...</p> )}
          </div>
        </div>
        {isAdmin && (<button onClick={handleStartQuiz} className="btn create-btn start-quiz-btn">Start Quiz Now</button>)}
      </div>
    </div>
  );
}

export default Lobby;

