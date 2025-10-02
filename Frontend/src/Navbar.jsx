import React from 'react';
import './Navbar.css'; // Is file ko agle step mein banayenge

function Navbar({ user, onProfileClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* App ka naam, click karne par home page par le jayega */}
        <a href="/" style={{textDecoration: 'none', color: 'white'}}>Quiz Spark ✨</a>
      </div>
      <div className="navbar-profile" onClick={onProfileClick}>
        {/* Abhi ke liye placeholder profile pic */}
        <img src="https://st3.depositphotos.com/6672868/13701/v/450/depositphotos_137014128-stock-illustration-user-profile-icon.jpg" alt="Profile" className="profile-pic" />
        <span className="profile-name">{user?.fullName || 'User'}</span>
      </div>
    </nav>
  );
}

export default Navbar;