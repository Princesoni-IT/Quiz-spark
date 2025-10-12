import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function UserManagement({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert(error.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis will also delete all their quizzes and data.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      alert('User deleted successfully!');
      fetchUsers(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  return (
    <div className="auth-container" style={{ maxWidth: '1000px', margin: '50px auto', marginTop: '100px' }}>
      <h2>👥 User Management</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Manage all registered users
      </p>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 15px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0',
            fontSize: '1rem'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#f0f4f8',
          borderRadius: '12px'
        }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>👤</p>
          <p style={{ color: '#666', marginTop: '10px' }}>
            {searchTerm ? 'No users found matching your search' : 'No users registered yet'}
          </p>
        </div>
      ) : (
        <div>
          {/* Stats */}
          <div style={{ 
            background: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <h3 style={{ margin: 0, color: '#1976d2', fontSize: '2rem' }}>{users.length}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Total Users</p>
            </div>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <h3 style={{ margin: 0, color: '#388e3c', fontSize: '2rem' }}>
                {users.filter(u => u.otpVerified).length}
              </h3>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Verified Users</p>
            </div>
            <div style={{ textAlign: 'center', margin: '10px' }}>
              <h3 style={{ margin: 0, color: '#f57c00', fontSize: '2rem' }}>
                {filteredUsers.length}
              </h3>
              <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Showing</p>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ background: '#5a67d8', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Registered</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user._id}
                    style={{ 
                      borderBottom: '1px solid #e0e0e0',
                      background: index % 2 === 0 ? '#fafafa' : 'white'
                    }}
                  >
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt="Profile"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #5a67d8'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                          }}>
                            👤
                          </div>
                        )}
                        <strong>{user.fullName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '15px', color: '#666' }}>{user.email}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      {user.otpVerified ? (
                        <span style={{
                          background: '#4caf50',
                          color: 'white',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          ✓ Verified
                        </span>
                      ) : (
                        <span style={{
                          background: '#ff9800',
                          color: 'white',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                      {formatDate(user.createdAt || Date.now())}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteUser(user._id, user.email)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                        onMouseOver={(e) => e.target.style.background = '#d32f2f'}
                        onMouseOut={(e) => e.target.style.background = '#f44336'}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default UserManagement;
