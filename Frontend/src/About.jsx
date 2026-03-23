import React from 'react';
import './App.css';

function About({ onBack }) {
  return (
    <div className="auth-container" style={{ maxWidth: '700px', margin: '50px auto' }}>
      <h2>ℹ️ About Quiz Spark</h2>
      
      <div style={{ textAlign: 'left', lineHeight: '1.8', color: '#333' }}>
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#1e2a78', marginBottom: '10px' }}>🎯 What is Quiz Spark?</h3>
          <p>
            Quiz Spark is a real-time interactive quiz platform designed for educators, trainers, 
            and quiz enthusiasts. Create engaging quizzes, host live quiz sessions, and track 
            participant performance with our intuitive interface.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#1e2a78', marginBottom: '10px' }}>✨ Key Features</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>📝 Create custom quizzes with multiple-choice questions</li>
            <li>🤖 AI-Powered Quiz Generation using Google Gemini AI</li>
            <li>📊 Upload questions in bulk via Excel/CSV/PDF files</li>
            <li>🎮 Real-time quiz sessions with live leaderboards</li>
            <li>⏱️ Customizable time limits and scoring</li>
            <li>🔒 Secure authentication with OTP verification</li>
            <li>📱 Responsive design for all devices</li>
            <li>🏆 Instant results and rankings</li>
            <li>👥 Support for multiple participants</li>
            <li>🎯 Solo practice mode for self-assessment</li>
          </ul>
        </section>

        <section style={{ 
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #667eea'
        }}>
          <h3 style={{ color: '#667eea', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 AI-Powered Quiz Generation (New!)
          </h3>
          <p>
            Generate intelligent quizzes instantly using Google's Gemini AI! Simply provide a topic, 
            number of questions, and difficulty level - our AI will create comprehensive quizzes with:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
            <li>✨ Smart question generation based on your topic</li>
            <li>🎯 Multiple difficulty levels (Easy, Medium, Hard)</li>
            <li>📚 Support for text input, file uploads (PDF, TXT, DOCX)</li>
            <li>⚡ Instant quiz creation in seconds</li>
            <li>🎮 Ready-to-use practice mode</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#1e2a78', marginBottom: '10px' }}>👨‍💻 Development Team</h3>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Team Spark ✨
          </p>
          <ul style={{ paddingLeft: '20px', listStyle: 'none' }}>
            <li>🚀 Prince - Full Stack Developer</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#1e2a78', marginBottom: '10px' }}>🛠️ Technology Stack</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <strong>Frontend:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                <li>React.js</li>
                <li>Vite</li>
                <li>Socket.io Client</li>
                <li>Axios</li>
              </ul>
            </div>
            <div>
              <strong>Backend:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                <li>Node.js & Express</li>
                <li>MongoDB</li>
                <li>Socket.io</li>
                <li>JWT Authentication</li>
                <li>Google Gemini AI</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#1e2a78', marginBottom: '10px' }}>📧 Contact & Support</h3>
          <p>
            Have questions or need help? Feel free to reach out to us through the Feedback form 
            or contact our support team.
          </p>
          <p style={{ marginTop: '10px' }}>
            <strong>Version:</strong> 2.0.0<br />
            <strong>Last Updated:</strong> November 2025
          </p>
        </section>

        <section style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '10px' }}>🌟 Thank You for Using Quiz Spark!</h3>
          <p style={{ margin: 0 }}>
            We're constantly working to improve your experience. Your feedback helps us grow!
          </p>
        </section>
      </div>

      <button 
        onClick={onBack} 
        className="back-btn blue-back-btn"
        style={{ marginTop: '30px' }}
      >
        ← Back
      </button>
    </div>
  );
}

export default About;
