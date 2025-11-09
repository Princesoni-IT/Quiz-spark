import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Sidebar.css';

function Sidebar({ isOpen, onClose, onLogout, onNavigate, user, isDarkMode, onToggleDarkMode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkIfAdmin();
    console.log('Sidebar user data:', user); // Debug log
  }, [user]);

  const checkIfAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // Only show feedbacks to specific admin email
      const adminEmail = 'princesoni.it@gmail.com';
      setIsAdmin(response.data.user.email === adminEmail);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleOptionClick = (page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Overlay jab sidebar khula ho */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Profile Options</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        {/* User Email Display */}
        {user && user.email && (
          <div className="user-email-section">
            <span className="email-label">📧</span>
            <span className="user-email">{user.email}</span>
          </div>
        )}
        
        <ul className="sidebar-menu" style={{maxHeight: 'auto', overflowY: 'auto'}}>
          <li onClick={() => handleOptionClick('changeUsername')}>✏️ Change Username</li>
          <li onClick={() => handleOptionClick('changePassword')}>🔒 Change Password</li>
          <li onClick={() => handleOptionClick('profilePicture')}>📸 Profile Picture</li>
          <li onClick={() => handleOptionClick('feedback')}>💬 Give Feedback</li>
          <li onClick={() => handleOptionClick('about')}>ℹ️ About</li>
          
          {/* Dark Mode Toggle */}
          <li 
            onClick={onToggleDarkMode} 
            className="dark-mode-toggle"
            style={{ 
              borderTop: '1px solid #e0e0e0', 
              marginTop: '10px', 
              paddingTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
            <div className={`toggle-switch ${isDarkMode ? 'active' : ''}`}>
              <div className="toggle-slider"></div>
            </div>
          </li>
          
          {/* Admin Only Options */}
          {isAdmin && (
            <>
              <li style={{ 
                borderTop: '2px solid #5a67d8', 
                marginTop: '10px', 
                paddingTop: '10px',
                color: '#5a67d8',
                fontWeight: 600,
                fontSize: '0.9rem',
                pointerEvents: 'none'
              }}>
                👑 ADMIN PANEL
              </li>
              <li onClick={() => handleOptionClick('userManagement')}>👥 User Management</li>
              <li onClick={() => handleOptionClick('viewFeedbacks')}>📬 View Feedbacks</li>
            </>
          )}
          
          <li onClick={onLogout} style={{ borderTop: '1px solid #e0e0e0', marginTop: '10px', paddingTop: '10px' }}>
            🚪 Logout
          </li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;