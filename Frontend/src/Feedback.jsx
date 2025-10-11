import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function Feedback({ onBack }) {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (message.trim().length < 10) {
      alert('Please provide feedback with at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/feedback`,
        { message, rating },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert(response.data.message);
      setMessage('');
      setRating(5);
      onBack();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '600px', margin: '50px auto' }}>
      <h2>💬 Feedback</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        We'd love to hear your thoughts! Help us improve Quiz Spark.
      </p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#1e2a78' }}>
            Rate Your Experience:
          </label>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', fontSize: '2rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  cursor: 'pointer',
                  color: star <= rating ? '#ffd700' : '#ddd',
                  transition: 'color 0.2s'
                }}
              >
                ⭐
              </span>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
            {rating} out of 5 stars
          </p>
        </div>

        <textarea
          placeholder="Share your feedback, suggestions, or report issues..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="6"
          required
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        
        <button 
          type="submit" 
          className="btn create-btn" 
          disabled={loading}
          style={{ width: '100%', marginTop: '20px' }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
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

export default Feedback;
