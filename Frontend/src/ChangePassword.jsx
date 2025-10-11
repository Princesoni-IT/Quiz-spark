import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function ChangePassword({ onBack }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Sending change password request...');
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/change-password`,
        { currentPassword, newPassword },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Password change response:', response.data);
      alert(response.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onBack();
    } catch (error) {
      console.error('Password change error:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '500px', margin: '50px auto' }}>
      <h2>🔒 Change Password</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Update your account password
      </p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password (min 6 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <button 
          type="submit" 
          className="btn create-btn" 
          disabled={loading}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>

      <button 
        onClick={onBack} 
        className="back-btn blue-back-btn"
        style={{ marginTop: '20px' }}
      >
        ← Back
      </button>
    </div>
  );
}

export default ChangePassword;
