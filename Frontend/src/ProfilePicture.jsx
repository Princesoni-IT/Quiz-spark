import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function ProfilePicture({ onBack, user }) {
  const [currentProfilePic, setCurrentProfilePic] = useState(''); // Saved profile pic from DB
  const [newImage, setNewImage] = useState(''); // Newly selected image
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.user.profilePicture) {
        setCurrentProfilePic(response.data.user.profilePicture);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      e.target.value = ''; // Reset file input
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      e.target.value = ''; // Reset file input
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newImage) {
      alert('Please select an image first.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/profile-picture`,
        { profilePicture: newImage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      alert(response.data.message);
      // Reload page to refresh navbar profile picture
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSelection = () => {
    setNewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveProfilePic = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/profile-picture`,
        { profilePicture: '' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('Profile picture removed successfully!');
      window.location.reload();
    } catch (error) {
      alert('Failed to remove profile picture.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '500px', margin: '50px auto' }}>
      <h2>📸 Profile Picture</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Upload or update your profile picture
      </p>
      
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Current Profile Picture */}
        {currentProfilePic && !newImage && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontWeight: 600, color: '#1e2a78', marginBottom: '10px' }}>Current Profile Picture:</p>
            <img 
              src={currentProfilePic} 
              alt="Current Profile" 
              style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '4px solid #5a67d8',
                marginBottom: '15px'
              }} 
            />
            <div>
              <button 
                type="button"
                onClick={handleRemoveProfilePic}
                disabled={loading}
                style={{
                  background: '#ff4757',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🗑️ Remove Profile Picture
              </button>
            </div>
          </div>
        )}

        {/* New Image Preview */}
        {newImage && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontWeight: 600, color: '#2e7d32', marginBottom: '10px' }}>New Image Preview:</p>
            <img 
              src={newImage} 
              alt="New Preview" 
              style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '4px solid #2e7d32',
                marginBottom: '15px'
              }} 
            />
            <div>
              <button 
                type="button"
                onClick={handleCancelSelection}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  marginRight: '10px'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {/* No Image Placeholder */}
        {!currentProfilePic && !newImage && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div 
              style={{ 
                width: '150px', 
                height: '150px', 
                borderRadius: '50%', 
                background: '#f0f4f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                border: '3px dashed #5a67d8'
              }}
            >
              <span style={{ fontSize: '3rem' }}>👤</span>
            </div>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>No profile picture set</p>
          </div>
        )}

        <div style={{ 
          background: '#f0f4f8', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '2px dashed #5a67d8'
        }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: 600,
            color: '#1e2a78'
          }}>
            Choose Image:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '10px', marginBottom: 0 }}>
            Max size: 2MB | Formats: JPG, PNG, GIF
          </p>
        </div>

        {newImage && (
          <div style={{
            background: '#e8f5e9',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center',
            color: '#2e7d32',
            fontWeight: 600
          }}>
            ✓ Image selected! Click "Save" to update or "Cancel" to discard
          </div>
        )}

        <button 
          type="submit" 
          className="btn create-btn" 
          disabled={loading || !newImage}
          style={{ 
            width: '100%', 
            marginTop: '10px',
            opacity: !newImage ? 0.5 : 1,
            cursor: !newImage ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Uploading...' : '💾 Save Profile Picture'}
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

export default ProfilePicture;
