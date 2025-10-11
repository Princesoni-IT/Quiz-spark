import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function AdminFeedback({ onBack }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/feedback`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      alert('Failed to load feedbacks.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteFeedback = async (feedbackId, userName) => {
    if (!window.confirm(`Are you sure you want to delete feedback from ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/feedback/${feedbackId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('Feedback deleted successfully!');
      fetchFeedbacks(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete feedback.');
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '900px', margin: '50px auto' }}>
      <h2>💬 User Feedbacks</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        All user feedback submissions
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#f0f4f8',
          borderRadius: '12px'
        }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>📭</p>
          <p style={{ color: '#666', marginTop: '10px' }}>No feedbacks yet</p>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            background: '#e8f5e9', 
            padding: '10px 15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <strong>{feedbacks.length}</strong> total feedback(s) received
          </div>

          {feedbacks.map((feedback, index) => (
            <div 
              key={feedback._id || index}
              style={{
                background: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: '#1e2a78', fontSize: '1.1rem' }}>
                    {feedback.userName}
                  </h3>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {feedback.email}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginRight: '15px' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
                    {renderStars(feedback.rating)}
                  </div>
                  <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>
                    {formatDate(feedback.createdAt)}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => handleDeleteFeedback(feedback._id, feedback.userName)}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#d32f2f'}
                    onMouseOut={(e) => e.target.style.background = '#f44336'}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <div style={{
                background: '#f9f9f9',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: '4px solid #5a67d8'
              }}>
                <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
                  {feedback.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default AdminFeedback;
