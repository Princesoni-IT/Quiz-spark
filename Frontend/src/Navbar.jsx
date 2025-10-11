import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Navbar.css';

function Navbar({ user, onProfileClick }) {
  const [profilePicture, setProfilePicture] = useState('');
  const defaultAvatar = 'https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.user.profilePicture) {
        setProfilePicture(response.data.user.profilePicture);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* App ka naam, click karne par home page par le jayega */}
        <a href="/" style={{textDecoration: 'none', color: 'white'}}>Quiz Spark ✨</a>
      </div>
      <div className="navbar-profile" onClick={onProfileClick}>
        <img 
          src={profilePicture || defaultAvatar} 
          alt="Profile" 
          className="profile-pic"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid white'
          }}
        />
        <span className="profile-name">{user?.fullName || 'User'}</span>
      </div>
    </nav>
  );
}

export default Navbar;