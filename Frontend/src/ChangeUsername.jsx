import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function ChangeUsername({ onBack, user }) {
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.fullName) {
      setCurrentUsername(user.fullName);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newUsername.trim()) {
      alert('Please enter a new username.');
      return;
    }

    if (newUsername.trim().length < 3) {
      alert('Username must be at least 3 characters long.');
      return;
    }

    if (newUsername.trim() === currentUsername) {
      alert('New username is the same as current username.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/username`,
        { newUsername: newUsername.trim() },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      alert(response.data.message || 'Username changed successfully!');
      
      // Fetch updated user profile to get latest data
      const profileResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Store updated user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(profileResponse.data.user));
      
      setCurrentUsername(newUsername.trim());
      setNewUsername('');
      
      // Reload page to update username everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '500px', margin: '50px auto' }}>
      <h2>✏️ Change Username</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Update your display name
      </p>

      {/* Current Username Display */}
      <div style={{
        background: '#f0f4f8',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '25px',
        border: '2px solid #e0e0e0'
      }}>
        <label style={{ 
          display: 'block', 
          fontSize: '0.9rem', 
          color: '#666',
          marginBottom: '5px',
          fontWeight: 600
        }}>
          Current Username:
        </label>
        <p style={{ 
          margin: 0, 
          fontSize: '1.2rem', 
          color: '#1e2a78',
          fontWeight: 600
        }}>
          {currentUsername || 'Loading...'}
        </p>
      </div>

      {/* Change Username Form */}
      <form onSubmit={handleSubmit} className="auth-form">
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: 600,
            color: '#555'
          }}>
            New Username:
          </label>
          <input
            type="text"
            placeholder="Enter new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: '2px solid #ddd',
              fontSize: '1rem',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#5a67d8'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#999', 
            marginTop: '5px',
            marginBottom: 0
          }}>
            Minimum 3 characters required
          </p>
        </div>

        <button
          type="submit"
          className="btn login-btn"
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '10px',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Updating...' : '✅ Change Username'}
        </button>
      </form>

      {/* Info Box */}
      <div style={{
        background: '#e3f2fd',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        borderLeft: '4px solid #2196f3'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          color: '#1976d2',
          lineHeight: '1.6'
        }}>
          <strong>ℹ️ Note:</strong> Your username will be updated across the entire application. 
          This change will be visible to other users in quizzes and leaderboards.
        </p>
      </div>

      <button onClick={onBack} className="back-btn blue-back-btn">
        ← Back
      </button>
    </div>
  );
}

export default ChangeUsername;
