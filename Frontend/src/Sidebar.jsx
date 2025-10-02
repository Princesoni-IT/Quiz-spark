import React from 'react';
import './Sidebar.css'; // Is file ko agle step mein banayenge

function Sidebar({ isOpen, onClose, onLogout }) {
  // Ye functions abhi sirf alert dikhayenge.
  // Inhe implement karne ke liye aapko alag se components banane honge.
  const handleOptionClick = (option) => {
    alert(`${option} functionality abhi implement nahi hui hai.`);
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
        <ul className="sidebar-menu" style={{maxHeight: 'auto', overflowY: 'auto'}}>
          <li onClick={() => handleOptionClick('Change Name')}>Change Name</li>
          <li onClick={() => handleOptionClick('Change Password')}>Change Password</li>
          <li onClick={() => handleOptionClick('Add Email')}>Add Email</li>
          <li onClick={() => handleOptionClick('Add Profile Pic')}>Add Profile Pic</li>
          <li onClick={() => handleOptionClick('College/school Name ')}>College/school Name</li>
          <li onClick={() => handleOptionClick('Feedback')}>Feedback</li>
          <li onClick={() => handleOptionClick('About')}>About</li>
          <li onClick={() => handleOptionClick('Certification')}>Certification</li>
          <li onClick={() => handleOptionClick('Quiz History')}>Quiz History</li>
          <li onClick={onLogout}>Logout</li>
        </ul>
      </div>
    </>
  );
}

export default Sidebar;