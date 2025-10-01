import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import './index.css';
import CreateQuiz from './CreateQuiz.jsx';
import AddQuestions from './AddQuestions.jsx';
import Lobby from './Lobby.jsx';
import Dashboard from './Dashboard.jsx'; 
import JoinQuiz from './JoinQuiz.jsx';
import QuizCountdown from './QuizCountdown.jsx'; // Naya import
import QuizPlayer from './QuizPlayer.jsx';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Baaki ke form states waise hi rahenge
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setCurrentUser({ id: decodedUser.userId, fullName: decodedUser.fullName }); 
        setCurrentPage('home');
      } catch (error) {
        localStorage.clear();
        setCurrentPage('auth');
      }
    }

    // Naye listeners: Jab server se quiz start hone ke events aayein
    socket.on('quiz_starting', () => {
        setCurrentPage('countdown');
    });

    socket.on('quiz_started', (quizData) => {
        setActiveQuiz(quizData);
        setCurrentPage('quizPlayer');
    });

    return () => {
        socket.off('quiz_starting');
        socket.off('quiz_started');
    };
  }, []);

  // Baaki saare functions waise hi rahenge (handleLogin, handleSignUp, etc.)
  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/login', { mobileNumber, password });
      alert(response.data.message);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        const decodedUser = jwtDecode(response.data.token);
        setCurrentUser({ id: decodedUser.userId, fullName: decodedUser.fullName }); 
        setCurrentPage('home');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'An error occurred.');
    }
  };
  
  const handleSignUp = async (event) => {
    event.preventDefault();
    const userData = { fullName, mobileNumber, password };
    try {
      const response = await axios.post('http://localhost:3000/api/register', userData);
      alert(response.data.message);
      setIsLoginView(true);
    } catch (error) {
      alert(error.response?.data?.message || 'An error occurred.');
    }
   };

  const handleLogout = () => { 
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setCurrentUser(null);
    setCurrentPage('auth');
   };
   
  const handleQuizCreated = (quizData) => { 
    setActiveQuiz(quizData);
    setCurrentPage('addQuestions');
  };
  
  const handleQuestionsAdded = async (questions) => { 
    try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:3000/api/quizzes/${activeQuiz._id}/questions`, { questions }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Questions saved successfully! Returning to dashboard.");
        setCurrentPage('dashboard');
    } catch (error) {
        alert("Failed to save questions.");
    }
  };
  
  const handleStartQuiz = (quiz) => { 
    setActiveQuiz(quiz);
    setCurrentPage('lobby');
  };
  
  const handleEditQuiz = (quiz) => { 
    setActiveQuiz(quiz);
    setCurrentPage('addQuestions');
  };

  const handleQuizJoined = (quizData) => {
    setActiveQuiz(quizData);
    setCurrentPage('lobby');
  };
  
  const renderAuthPage = () => (
    <div className="auth-container">
      <h2>Welcome to Quiz Spark!</h2>
      <p>Please {isLoginView ? 'login' : 'create an account'} to continue</p>
      <form onSubmit={isLoginView ? handleLogin : handleSignUp} className="auth-form">
        {!isLoginView && (<input type="text" placeholder="Full Name (for signup)" value={fullName} onChange={(e) => setFullName(e.target.value)} required />)}
        <input type="tel" placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="auth-buttons">{isLoginView ? (<button type="submit" className="btn login-btn">Login</button>) : (<button type="submit" className="btn signup-btn">Sign Up</button>)}</div>
      </form>
      {isLoginView ? (<p>Don't have an account? <a href="#" onClick={() => setIsLoginView(false)}>Sign Up</a></p>) : (<p>Already have an account? <a href="#" onClick={() => setIsLoginView(true)}>Login</a></p>)}
    </div>
  );

  const renderHomePage = () => (
    <>
      <header className="app-header">
        <h1>Quiz Spark ✨</h1>
        <p>Welcome, {currentUser?.fullName || 'User'}! Choose an option to start.</p>
        <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#e74c3c', marginTop: '20px' }}>Logout</button>
      </header>
      <main className="options-container">
        <div className="option-card"><h2>Create Room</h2><p>Setup a new quiz as an Admin</p><button onClick={() => setCurrentPage('dashboard')} className="btn create-btn">Go to Dashboard</button></div>
        <div className="option-card"><h2>Join Room</h2><p>Enter a code to join a quiz</p><button onClick={() => setCurrentPage('joinQuiz')} className="btn join-btn">Join a Quiz</button></div>
      </main>
      <footer className="app-footer"><p>Made with ❤️ for modern learning</p></footer>
    </>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home': return renderHomePage();
      case 'dashboard': return <Dashboard onCreateQuiz={() => setCurrentPage('createQuiz')} onStartQuiz={handleStartQuiz} onEditQuiz={handleEditQuiz} />;
      case 'createQuiz': return <CreateQuiz onQuizCreated={handleQuizCreated} onBack={() => setCurrentPage('dashboard')} />;
      case 'addQuestions': return <AddQuestions quiz={activeQuiz} onBack={() => setCurrentPage('dashboard')} onFinish={handleQuestionsAdded} />;
      case 'lobby': return <Lobby quiz={activeQuiz} user={currentUser} onBack={() => setCurrentPage('home')} onKicked={() => setCurrentPage('home')} />;
      case 'joinQuiz': return <JoinQuiz onBack={() => setCurrentPage('home')} onQuizJoined={handleQuizJoined} />;
      case 'countdown': // Naya case
        return <QuizCountdown />;
      case 'quizPlayer': // Naya case
        return <QuizPlayer socket={socket} quiz={activeQuiz} user={currentUser} onBack={() => setCurrentPage('dashboard')} />;
      case 'auth': 
      default:
        return renderAuthPage();
    }
  };

  return <div className="container">{renderCurrentPage()}</div>;
}

export default App;

