import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function ForgotPassword({ onBack, onLoginRedirect }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        { email }
      );
      // Show OTP if it's in the response (for development)
      if (response.data.otp) {
        alert(`${response.data.message}\n\n🔐 Your OTP: ${response.data.otp}`);
      } else {
        alert(response.data.message);
      }
      setStep(2);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Just verify OTP is entered, move to next step
      if (otp.length !== 6) {
        alert('Please enter a valid 6-digit OTP.');
        setLoading(false);
        return;
      }
      // Move to password reset step
      setStep(3);
    } catch (error) {
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reset-password`,
        { email, otp, newPassword }
      );
      alert(response.data.message);
      // Redirect to login
      if (onLoginRedirect) {
        onLoginRedirect();
      } else {
        onBack();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '500px', margin: '50px auto' }}>
      <h2>🔑 Forgot Password</h2>
      
      {step === 1 && (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Enter your registered email to receive OTP
          </p>
          <form onSubmit={handleSendOTP} className="auth-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="btn create-btn" 
              disabled={loading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Enter the 6-digit OTP sent to <strong>{email}</strong>
          </p>
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            /> 
            <button 
              type="submit" 
              className="btn create-btn" 
              disabled={loading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                marginTop: '10px',
                background: 'transparent',
                color: '#5a67d8',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Resend OTP
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Create your new password for <strong>{email}</strong>
          </p>
          <form onSubmit={handleResetPassword} className="auth-form">
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}

      <button 
        onClick={onBack} 
        className="back-btn blue-back-btn"
        style={{ marginTop: '20px' }}
      >
        ← Back to Login
      </button>
    </div>
  );
}

export default ForgotPassword;
