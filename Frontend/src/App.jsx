import { useState, useEffect } from 'react';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
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

const socket = io(import.meta.env.VITE_API_URL);

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/login', { email, password });
      alert(response.data.message);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const decodedUser = jwtDecode(response.data.token);
        setCurrentUser({ id: decodedUser.userId, fullName: decodedUser.fullName }); 
        setCurrentPage('home');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'An error occurred.');
    }
  };
  
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (!otpSent) {
      // Step 1: Register and send OTP
      const userData = { fullName, email, password };
      try {
        const response = await axios.post('http://localhost:3000/api/register', userData);
        alert(response.data.message);
        setOtpSent(true);
      } catch (error) {
        alert(error.response?.data?.message || 'An error occurred.');
      }
    } else {
      // Step 2: Verify OTP
      try {
        const response = await axios.post('http://localhost:3000/api/verify-otp', { email, otp });
        alert(response.data.message);
        setOtpSent(false);
        setIsLoginView(true);
        setFullName('');
        setEmail('');
        setPassword('');
        setOtp('');
      } catch (error) {
        alert(error.response?.data?.message || 'OTP verification failed.');
      }
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentPage('auth');
    setIsSidebarOpen(false);
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

  const handleKicked = () => {
    setCurrentPage('home');
  };
  
  const renderAuthPage = () => (
    <div className="auth-container">
      <h2>Welcome to Quiz Spark!</h2>
      <p>Please {isLoginView ? 'login' : 'create an account'} to continue</p>
      <form onSubmit={isLoginView ? handleLogin : handleSignUp} className="auth-form">
        {!isLoginView && (<input type="text" placeholder="Full Name (for signup)" value={fullName} onChange={(e) => setFullName(e.target.value)} required />)}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {/* Show OTP input only after registration step */}
        {!isLoginView && otpSent && (
          <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
        )}
        <div className="auth-buttons">{isLoginView ? (<button type="submit" className="btn login-btn">Login</button>) : (<button type="submit" className="btn signup-btn">{otpSent ? 'Verify OTP' : 'Sign Up'}</button>)}</div>
      </form>
      {isLoginView ? (<p>Don't have an account? <a href="#" onClick={() => setIsLoginView(false)}>Sign Up</a></p>) : (<p>Already have an account? <a href="#" onClick={() => setIsLoginView(true)}>Login</a></p>)}
    </div>
  );

  const renderHomePage = () => (
    <>
      {currentUser && (
        <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '1.3rem', fontWeight: 600, color: '#1e2a78' }}>
          Welcome, {currentUser.fullName}!
        </div>
      )}
      <main className="options-container" style={{ marginTop: '40px' }}>
        <div className="option-card"><h2>Create Room</h2><p>Setup a new quiz as an Admin</p><button onClick={() => setCurrentPage('dashboard')} className="btn create-btn">Go to Dashboard</button></div>
        <div className="option-card"><h2>Join Room</h2><p>Enter a code to join a quiz</p><button onClick={() => setCurrentPage('joinQuiz')} className="btn join-btn">Join a Quiz</button></div>
      </main>
      <footer className="app-footer"><h3>Made With 👨‍💻Team ✨Spark (Prince, Som, Akhlesh)</h3></footer>
    </>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home': return renderHomePage();
  case 'dashboard': return <Dashboard onCreateQuiz={() => setCurrentPage('createQuiz')} onStartQuiz={handleStartQuiz} onEditQuiz={handleEditQuiz} onBack={() => setCurrentPage('home')} />;
      case 'createQuiz': return <CreateQuiz onQuizCreated={handleQuizCreated} onBack={() => setCurrentPage('dashboard')} />;
      case 'addQuestions': return <AddQuestions quiz={activeQuiz} onBack={() => setCurrentPage('dashboard')} onFinish={handleQuestionsAdded} />;
      case 'lobby': return <Lobby quiz={activeQuiz} user={currentUser} onBack={() => setCurrentPage('home')} onKicked={handleKicked} />;
      case 'joinQuiz': return <JoinQuiz onBack={() => setCurrentPage('home')} onQuizJoined={handleQuizJoined} />;
      case 'countdown':
        return <QuizCountdown />;
      case 'quizPlayer':
        return <QuizPlayer socket={socket} quiz={activeQuiz} user={currentUser} onBack={() => setCurrentPage('dashboard')} />;
      case 'auth': 
      default:
        return renderAuthPage();
    }
  };

  // Show Navbar and Sidebar only when user is logged in (not on auth page)
  const isAuthenticated = currentUser && currentPage !== 'auth';

  return (
    <div className="container">
      {isAuthenticated && (
        <>
          <Navbar user={currentUser} onProfileClick={() => setIsSidebarOpen(true)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
        </>
      )}
      {renderCurrentPage()}
    </div>
  );
}

export default App;

